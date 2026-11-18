const { validationResult } = require('express-validator');
const inquiryModel = require('../models/inquiryModel');
const { fieldErrors, STATUSES } = require('../validators/adminForms');
const { setFlash } = require('../middleware/requireAdmin');

async function list(req, res, next) {
  try {
    const inquiries = await inquiryModel.listAll();
    res.status(200).render('admin/inquiries/list', {
      title: 'Mesajlar',
      inquiries
    });
  } catch (error) {
    next(error);
  }
}

async function detail(req, res, next) {
  try {
    if (!validationResult(req).isEmpty()) {
      const error = new Error('Bu kayıt bulunamadı.');
      error.status = 404;
      throw error;
    }

    const inquiry = await inquiryModel.findById(req.params.id);
    if (!inquiry) {
      const error = new Error('Bu kayıt bulunamadı.');
      error.status = 404;
      throw error;
    }

    res.status(200).render('admin/inquiries/detail', {
      title: 'Mesaj',
      inquiry,
      statuses: STATUSES,
      errors: {}
    });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    if (validationResult(req).array().some((item) => item.path === 'id')) {
      const error = new Error('Bu kayıt bulunamadı.');
      error.status = 404;
      throw error;
    }

    const inquiry = await inquiryModel.findById(req.params.id);
    if (!inquiry) {
      const error = new Error('Bu kayıt bulunamadı.');
      error.status = 404;
      throw error;
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).render('admin/inquiries/detail', {
        title: 'Mesaj',
        inquiry,
        statuses: STATUSES,
        errors: fieldErrors(result)
      });
      return;
    }

    await inquiryModel.updateStatus(inquiry.id, req.body.status);
    setFlash(req, 'Mesaj durumu güncellendi.');
    res.redirect(303, `/admin/inquiries/${inquiry.id}`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  detail,
  updateStatus
};
