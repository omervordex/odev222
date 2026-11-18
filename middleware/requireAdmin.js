const adminModel = require('../models/adminModel');

async function requireAdmin(req, res, next) {
  try {
    const adminId = req.session && req.session.adminId;

    if (!adminId) {
      res.redirect(303, '/admin/login');
      return;
    }

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      req.session.destroy(() => {
        res.redirect(303, '/admin/login');
      });
      return;
    }

    res.locals.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}

function setFlash(req, message, type = 'success') {
  req.session.flash = {
    type: type === 'danger' ? 'danger' : 'success',
    message
  };
}

function readFlash(req, res, next) {
  res.locals.flash = null;

  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  }

  next();
}

module.exports = {
  requireAdmin,
  setFlash,
  readFlash
};
