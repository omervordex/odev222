const { body, validationResult } = require('express-validator');
const inquiryModel = require('../models/inquiryModel');
const productModel = require('../models/productModel');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CONTACT_DESCRIPTION = 'Başakşehir’deki Optik Ayşegül Özçelik mağazasına ulaşın.';
const recentInquiries = new Map();
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

const inquiryValidators = [
  body('customer_name')
    .trim()
    .notEmpty()
    .withMessage('Adınızı ve soyadınızı girin.')
    .bail()
    .isLength({ min: 2, max: 80 })
    .withMessage('Ad 2 ile 80 karakter arasında olmalıdır.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('E-posta adresinizi girin.')
    .bail()
    .isLength({ max: 254 })
    .withMessage('Daha kısa bir e-posta adresi girin.')
    .bail()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin.')
    .bail()
    .matches(EMAIL_PATTERN)
    .withMessage('Geçerli bir e-posta adresi girin.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone')
    .trim()
    .custom((value) => {
      if (!value) {
        return true;
      }

      if (value.length < 5 || value.length > 30) {
        throw new Error('Telefon 5 ile 30 karakter arasında olmalı ya da boş bırakılmalıdır.');
      }

      return true;
    }),
  body('product_slug')
    .trim()
    .custom((value) => {
      if (!value || SLUG_PATTERN.test(value)) {
        return true;
      }

      throw new Error('Listeden bir çerçeve seçin.');
    }),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Bir mesaj yazın.')
    .bail()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Mesaj en az 10, en fazla 2000 karakter olmalıdır.'),
  body('company_website')
    .trim()
];

function emptyValues() {
  return {
    customerName: '',
    email: '',
    phone: '',
    productSlug: '',
    message: ''
  };
}

function valuesFrom(source) {
  const values = emptyValues();
  values.customerName = typeof source.customer_name === 'string' ? source.customer_name.trim() : '';
  values.email = typeof source.email === 'string' ? source.email.trim() : '';
  values.phone = typeof source.phone === 'string' ? source.phone.trim() : '';
  values.productSlug = typeof source.product_slug === 'string' ? source.product_slug.trim() : '';
  values.message = typeof source.message === 'string' ? source.message.trim() : '';
  return values;
}

function errorsByField(result) {
  const errors = {};

  result.array().forEach((item) => {
    if (!errors[item.path]) {
      errors[item.path] = item.msg;
    }
  });

  return errors;
}

async function pageData(values) {
  const products = await productModel.listProducts({});
  const slug = SLUG_PATTERN.test(values.productSlug) ? values.productSlug : '';
  const selected = slug ? await productModel.findBySlug(slug) : null;

  return {
    products,
    selected
  };
}

async function show(req, res, next) {
  try {
    const requestedSlug = typeof req.query.product === 'string' ? req.query.product.trim() : '';
    const values = emptyValues();
    const slugIsValid = SLUG_PATTERN.test(requestedSlug);
    const selected = slugIsValid ? await productModel.findBySlug(requestedSlug) : null;
    const products = await productModel.listProducts({});

    if (selected) {
      values.productSlug = selected.slug;
    }

    res.status(200).render('pages/contact', {
      title: 'İletişim',
      description: CONTACT_DESCRIPTION,
      values,
      errors: {},
      formError: '',
      products,
      selected,
      unknownProduct: Boolean(requestedSlug) && !selected
    });
  } catch (error) {
    next(error);
  }
}

async function submit(req, res, next) {
  const values = valuesFrom(req.body);
  const honeypot = typeof req.body.company_website === 'string' ? req.body.company_website.trim() : '';

  try {
    if (honeypot) {
      res.status(400).render('pages/contact', {
        title: 'İletişim',
        description: CONTACT_DESCRIPTION,
        values,
        errors: {},
        formError: 'Mesaj gönderilemedi. Lütfen yeniden deneyin.',
        products: await productModel.listProducts({}),
        selected: null,
        unknownProduct: false
      });
      return;
    }

    const result = validationResult(req);
    const errors = errorsByField(result);
    const page = await pageData(values);

    if (!result.isEmpty()) {
      res.status(400).render('pages/contact', {
        title: 'İletişim',
        description: CONTACT_DESCRIPTION,
        values,
        errors,
        formError: '',
        products: page.products,
        selected: page.selected,
        unknownProduct: false
      });
      return;
    }

    if (values.productSlug && !page.selected) {
      res.status(400).render('pages/contact', {
        title: 'İletişim',
        description: CONTACT_DESCRIPTION,
        values,
        errors: {
          product_slug: 'Bu çerçeve artık katalogda yok.'
        },
        formError: '',
        products: page.products,
        selected: null,
        unknownProduct: true
      });
      return;
    }

    const duplicateKey = `${values.email}\n${values.productSlug}\n${values.message}`;
    const now = Date.now();

    for (const [key, time] of recentInquiries) {
      if (now - time > DUPLICATE_WINDOW_MS) {
        recentInquiries.delete(key);
      }
    }

    if (recentInquiries.has(duplicateKey)) {
      res.redirect(303, '/contact/received');
      return;
    }

    recentInquiries.set(duplicateKey, now);

    try {
      await inquiryModel.create({
        customerName: values.customerName,
        email: values.email,
        phone: values.phone,
        productId: page.selected ? page.selected.id : null,
        message: values.message
      });
    } catch (error) {
      recentInquiries.delete(duplicateKey);
      throw error;
    }

    res.redirect(303, '/contact/received');
  } catch (error) {
    if (error.status === 503) {
      try {
        const page = await pageData(values);
        res.status(503).render('pages/contact', {
          title: 'İletişim',
          description: CONTACT_DESCRIPTION,
          values,
          errors: {},
          formError: error.message,
          products: page.products,
          selected: page.selected,
          unknownProduct: false
        });
        return;
      } catch (renderError) {
        next(renderError);
        return;
      }
    }

    next(error);
  }
}

function received(req, res) {
  res.status(200).render('pages/inquiryReceived', {
    title: 'Mesaj alındı',
    description: 'Mağaza mesajınızı aldı.'
  });
}

module.exports = {
  inquiryValidators,
  show,
  submit,
  received
};
