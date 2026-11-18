const { validationResult } = require('express-validator');
const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const slugify = require('../models/slug');
const { fieldErrors } = require('../validators/adminForms');
const { setFlash } = require('../middleware/requireAdmin');

function blankProduct() {
  return {
    id: '',
    name: '',
    slug: '',
    description: '',
    brand: '',
    categoryId: '',
    price: '',
    imageUrl: '',
    isFeatured: false
  };
}

function valuesFrom(body) {
  const price = typeof body.price === 'string' ? body.price.trim() : '';

  return {
    id: '',
    name: typeof body.name === 'string' ? body.name.trim() : '',
    slug: typeof body.slug === 'string' ? body.slug.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
    brand: typeof body.brand === 'string' ? body.brand.trim() : '',
    categoryId: typeof body.category_id === 'string' ? body.category_id.trim() : '',
    price,
    imageUrl: typeof body.image_url === 'string' ? body.image_url.trim() : '',
    isFeatured: body.is_featured === '1'
  };
}

function formProduct(record) {
  if (!record) {
    return blankProduct();
  }

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    brand: record.brand,
    categoryId: record.category ? record.category.id : '',
    price: record.price === null ? '' : String(record.price),
    imageUrl: record.imageUrl,
    isFeatured: record.isFeatured
  };
}

async function renderForm(res, status, title, product, errors) {
  const categories = await categoryModel.listAll();
  res.status(status).render('admin/products/form', {
    title,
    product,
    categories,
    errors
  });
}

async function resolveSlug(values, ignoreId) {
  if (!values.slug) {
    const generated = slugify(values.name);
    if (!generated) {
      return { slug: '', error: 'Kısa adrese dönüşebilecek bir ad girin.' };
    }

    return { slug: await productModel.uniqueSlug(generated, ignoreId), error: '' };
  }

  if (await productModel.slugTaken(values.slug, ignoreId)) {
    return { slug: values.slug, error: 'Bu kısa adres başka bir üründe kullanılıyor.' };
  }

  return { slug: values.slug, error: '' };
}

function missingRecord() {
  const error = new Error('Bu kayıt bulunamadı.');
  error.status = 404;
  return error;
}

async function list(req, res, next) {
  try {
    const products = await productModel.listForAdmin();
    res.status(200).render('admin/products/list', {
      title: 'Ürünler',
      products
    });
  } catch (error) {
    next(error);
  }
}

async function createForm(req, res, next) {
  try {
    await renderForm(res, 200, 'Ürün ekle', blankProduct(), {});
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  const product = valuesFrom(req.body);

  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      await renderForm(res, 400, 'Ürün ekle', product, fieldErrors(result));
      return;
    }

    const resolved = await resolveSlug(product, '');
    if (resolved.error) {
      await renderForm(res, 400, 'Ürün ekle', product, { slug: resolved.error });
      return;
    }

    await productModel.create({
      ...product,
      slug: resolved.slug,
      price: product.price === '' ? null : Number(product.price)
    });
    setFlash(req, 'Ürün kaydedildi.');
    res.redirect(303, '/admin/products');
  } catch (error) {
    if (error.status === 400) {
      await renderForm(res, 400, 'Ürün ekle', product, { slug: error.message });
      return;
    }

    next(error);
  }
}

async function editForm(req, res, next) {
  try {
    if (!validationResult(req).isEmpty()) {
      throw missingRecord();
    }

    const product = await productModel.findById(req.params.id);
    if (!product) {
      throw missingRecord();
    }

    await renderForm(res, 200, 'Ürünü düzenle', formProduct(product), {});
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  const product = valuesFrom(req.body);
  product.id = req.params.id;

  try {
    if (validationResult(req).array().some((item) => item.path === 'id')) {
      throw missingRecord();
    }

    const existing = await productModel.findById(req.params.id);
    if (!existing) {
      throw missingRecord();
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      await renderForm(res, 400, 'Ürünü düzenle', product, fieldErrors(result));
      return;
    }

    const resolved = await resolveSlug(product, existing.id);
    if (resolved.error) {
      await renderForm(res, 400, 'Ürünü düzenle', product, { slug: resolved.error });
      return;
    }

    await productModel.update(existing.id, {
      ...product,
      slug: resolved.slug,
      price: product.price === '' ? null : Number(product.price)
    });
    setFlash(req, 'Ürün güncellendi.');
    res.redirect(303, '/admin/products');
  } catch (error) {
    if (error.status === 400) {
      await renderForm(res, 400, 'Ürünü düzenle', product, { slug: error.message });
      return;
    }

    next(error);
  }
}

async function remove(req, res, next) {
  try {
    if (!validationResult(req).isEmpty()) {
      throw missingRecord();
    }

    const product = await productModel.findById(req.params.id);
    if (!product) {
      throw missingRecord();
    }

    await productModel.remove(product.id);
    setFlash(req, 'Ürün silindi. İlgili mesajlar ürün bağlantısı olmadan durur.');
    res.redirect(303, '/admin/products');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  createForm,
  create,
  editForm,
  update,
  remove
};
