const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const adminModel = require('../models/adminModel');
const { fieldErrors } = require('../validators/adminForms');

const GENERIC_LOGIN_ERROR = 'E-posta veya şifre doğru değil.';
let dummyHash = '';

async function readyDummyHash() {
  if (!dummyHash) {
    dummyHash = await bcrypt.hash('not-a-stored-password', 12);
  }

  return dummyHash;
}

function showLogin(req, res) {
  if (req.session.adminId) {
    res.redirect(303, '/admin');
    return;
  }

  res.status(200).render('admin/login', {
    title: 'Yönetici girişi',
    email: '',
    loginError: ''
  });
}

async function login(req, res, next) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      res.status(400).render('admin/login', {
        title: 'Yönetici girişi',
        email,
        loginError: fieldErrors(result).email || fieldErrors(result).password || GENERIC_LOGIN_ERROR
      });
      return;
    }

    const admin = await adminModel.findByEmail(email);
    const hash = admin ? admin.password_hash : await readyDummyHash();
    const matches = await bcrypt.compare(req.body.password, hash);

    if (!admin || !matches) {
      res.status(401).render('admin/login', {
        title: 'Yönetici girişi',
        email,
        loginError: GENERIC_LOGIN_ERROR
      });
      return;
    }

    req.session.regenerate((error) => {
      if (error) {
        next(error);
        return;
      }

      req.session.adminId = admin.id;
      req.session.csrfToken = undefined;
      req.session.save((saveError) => {
        if (saveError) {
          next(saveError);
          return;
        }

        res.redirect(303, '/admin');
      });
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie('optical.sid');
    res.redirect(303, '/admin/login');
  });
}

module.exports = {
  showLogin,
  login,
  logout
};
