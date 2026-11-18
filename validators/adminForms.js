const { body, param } = require('express-validator');
const categoryModel = require('../models/categoryModel');
const { safeImageUrl } = require('../models/productModel');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ['new', 'read', 'answered', 'closed'];

const loginValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('E-posta ve şifrenizi girin.')
    .bail()
    .isEmail()
    .withMessage('E-posta ve şifrenizi girin.')
    .isLength({ max: 254 }),
  body('password')
    .notEmpty()
    .withMessage('E-posta ve şifrenizi girin.')
    .isLength({ max: 200 })
    .withMessage('E-posta ve şifrenizi girin.')
];

const categoryValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Bir kategori adı girin.')
    .bail()
    .isLength({ min: 2, max: 80 })
    .withMessage('Ad 2 ile 80 karakter arasında olmalıdır.'),
  body('slug')
    .trim()
    .custom((value) => {
      if (!value || (SLUG_PATTERN.test(value) && value.length <= 80)) {
        return true;
      }

      throw new Error('Kısa adres yalnızca küçük harf, rakam ve tire içerebilir.');
    }),
  body('description')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Açıklama 1000 karakteri geçmemelidir.')
];

const productValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Bir ürün adı girin.')
    .bail()
    .isLength({ min: 2, max: 120 })
    .withMessage('Ad 2 ile 120 karakter arasında olmalıdır.'),
  body('slug')
    .trim()
    .custom((value) => {
      if (!value || (SLUG_PATTERN.test(value) && value.length <= 80)) {
        return true;
      }

      throw new Error('Kısa adres yalnızca küçük harf, rakam ve tire içerebilir.');
    }),
  body('description')
    .trim()
    .isLength({ max: 4000 })
    .withMessage('Açıklama 4000 karakteri geçmemelidir.'),
  body('brand')
    .trim()
    .isLength({ max: 80 })
    .withMessage('Marka 80 karakteri geçmemelidir.'),
  body('category_id')
    .trim()
    .isUUID()
    .withMessage('Bir kategori seçin.')
    .bail()
    .custom(async (id) => {
      const category = await categoryModel.findById(id);
      if (!category) {
        throw new Error('Bir kategori seçin.');
      }

      return true;
    }),
  body('price')
    .trim()
    .custom((value) => {
      if (!value) {
        return true;
      }

      if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) > 99999999.99) {
        throw new Error('En fazla iki ondalıklı, sıfır veya pozitif bir fiyat girin ya da alanı boş bırakın.');
      }

      return true;
    }),
  body('image_url')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Daha kısa bir görsel adresi kullanın.')
    .bail()
    .custom((value) => {
      if (!value) {
        return true;
      }

      if (safeImageUrl(value)) {
        return true;
      }

      throw new Error('http veya https bir görsel adresi, /images/ içindeki bir dosya girin ya da alanı boş bırakın.');
    }),
  body('is_featured').optional({ values: 'falsy' })
];

const statusValidators = [
  body('status')
    .trim()
    .isIn(STATUSES)
    .withMessage('Geçerli bir durum seçin.')
];

const idParam = [
  param('id').isUUID().withMessage('Bu kayıt bulunamadı.')
];

function fieldErrors(result) {
  const errors = {};

  result.array().forEach((item) => {
    if (!errors[item.path]) {
      errors[item.path] = item.msg;
    }
  });

  return errors;
}

module.exports = {
  loginValidators,
  categoryValidators,
  productValidators,
  statusValidators,
  idParam,
  fieldErrors,
  STATUSES
};
