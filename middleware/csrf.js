const crypto = require('crypto');

function ensureCsrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function tokensMatch(sent, expected) {
  if (!sent || !expected || sent.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
}

function verifyCsrf(req, res, next) {
  const site = req.get('Sec-Fetch-Site');
  const sent = typeof req.body._csrf === 'string' ? req.body._csrf : '';

  if ((site && site !== 'same-origin' && site !== 'none') || !tokensMatch(sent, req.session.csrfToken)) {
    const error = new Error('Formun süresi doldu. Lütfen yeniden deneyin.');
    error.status = 403;
    next(error);
    return;
  }

  next();
}

module.exports = {
  ensureCsrf,
  verifyCsrf
};
