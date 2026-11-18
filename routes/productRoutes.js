const express = require('express');
const { query, param } = require('express-validator');
const productController = require('../controllers/productController');

const router = express.Router();
const slugRule = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

router.get(
  '/',
  query('q')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 80 }),
  query('category')
    .optional({ values: 'falsy' })
    .trim()
    .matches(slugRule),
  productController.catalog
);

router.get(
  '/:slug',
  param('slug').matches(slugRule),
  productController.detail
);

module.exports = router;
