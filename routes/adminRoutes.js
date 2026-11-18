const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminProductController = require('../controllers/adminProductController');
const adminCategoryController = require('../controllers/adminCategoryController');
const adminInquiryController = require('../controllers/adminInquiryController');
const { requireAdmin, readFlash } = require('../middleware/requireAdmin');
const { ensureCsrf, verifyCsrf } = require('../middleware/csrf');
const loginRateLimit = require('../middleware/loginRateLimit');
const {
  loginValidators,
  categoryValidators,
  productValidators,
  statusValidators,
  idParam
} = require('../validators/adminForms');

const router = express.Router();

router.use(ensureCsrf);
router.use(readFlash);

router.get('/login', adminAuthController.showLogin);
router.post('/login', loginRateLimit, verifyCsrf, loginValidators, adminAuthController.login);

router.use(requireAdmin);
router.post('/logout', verifyCsrf, adminAuthController.logout);
router.get('/', adminDashboardController.dashboard);

router.get('/products', adminProductController.list);
router.get('/products/new', adminProductController.createForm);
router.post('/products', verifyCsrf, productValidators, adminProductController.create);
router.get('/products/:id/edit', idParam, adminProductController.editForm);
router.post('/products/:id/delete', verifyCsrf, idParam, adminProductController.remove);
router.post('/products/:id', verifyCsrf, idParam, productValidators, adminProductController.update);

router.get('/categories', adminCategoryController.list);
router.get('/categories/new', adminCategoryController.createForm);
router.post('/categories', verifyCsrf, categoryValidators, adminCategoryController.create);
router.get('/categories/:id/edit', idParam, adminCategoryController.editForm);
router.post('/categories/:id/delete', verifyCsrf, idParam, adminCategoryController.remove);
router.post('/categories/:id', verifyCsrf, idParam, categoryValidators, adminCategoryController.update);

router.get('/inquiries', adminInquiryController.list);
router.get('/inquiries/:id', idParam, adminInquiryController.detail);
router.post('/inquiries/:id/status', verifyCsrf, idParam, statusValidators, adminInquiryController.updateStatus);

module.exports = router;
