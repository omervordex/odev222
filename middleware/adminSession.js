const cookieSession = require('cookie-session');
const config = require('../config');

const COOKIE_NAME = 'optical.sid';

function cookieOptions() {
  return {
    name: COOKIE_NAME,
    keys: [config.sessionSecret],
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
    signed: true,
    overwrite: true
  };
}

function attachSessionMethods(req) {
  const session = req.session;

  if (!session || Object.prototype.hasOwnProperty.call(session, 'regenerate')) {
    return;
  }

  Object.defineProperty(session, 'regenerate', {
    configurable: true,
    enumerable: false,
    writable: true,
    value(callback) {
      Object.keys(session).forEach((key) => {
        delete session[key];
      });

      if (callback) {
        callback(null);
      }
    }
  });

  Object.defineProperty(session, 'save', {
    configurable: true,
    enumerable: false,
    writable: true,
    value(callback) {
      if (callback) {
        callback(null);
      }
    }
  });

  Object.defineProperty(session, 'destroy', {
    configurable: true,
    enumerable: false,
    writable: true,
    value(callback) {
      req.session = null;

      if (callback) {
        callback(null);
      }
    }
  });
}

function adminSession(req, res, next) {
  cookieSession(cookieOptions())(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    attachSessionMethods(req);
    next();
  });
}

function clearAdminCookie(res) {
  const options = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction
  };

  res.clearCookie(COOKIE_NAME, options);
  res.clearCookie(`${COOKIE_NAME}.sig`, options);
}

module.exports = adminSession;
module.exports.clearAdminCookie = clearAdminCookie;
