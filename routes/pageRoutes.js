const express = require('express');
const pageController = require('../controllers/pageController');
const inquiryController = require('../controllers/inquiryController');
const inquiryGuard = require('../middleware/inquiryGuard');

const router = express.Router();

router.get('/', pageController.home);
router.get('/about', pageController.about);
router.get('/find-your-frame', pageController.findYourFrame);
router.get('/contact/received', inquiryController.received);
router.get('/contact', inquiryController.show);
router.post(
  '/contact',
  inquiryGuard,
  inquiryController.inquiryValidators,
  inquiryController.submit
);

module.exports = router;
