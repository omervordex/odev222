const { validationResult } = require('express-validator');
const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const slugify = require('../models/slug');
const { fieldErrors } = require('../validators/adminForms');
const { setFlash } = require('../middleware/requireAdmin');
const productImages = require('../middleware/productImages');

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

function applyImageChoice(req, product) {
  if (req.uploadedImagePath) {
    product.imageUrl = req.uploadedImagePath;
  }

  return product;
}

async function rejectProductForm(req, res, title, product, errors, existing) {
  if (req.uploadedImagePath) {
    await productImages.discardUpload(req);
    req.uploadedImagePath = '';
    req.file = undefined;
    product.imageUrl = existing ? existing.imageUrl : '';
    if (!errors.image_file) {
      errors.image_file = 'Seçilen görsel kaydedilmedi. Diğer alanları düzelttikten sonra yeniden seçin.';
    }
  }

  await renderForm(res, 400, title, product, errors);
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
  const product = applyImageChoice(req, valuesFrom(req.body));
  let saved = false;

  try {
    if (req.imageUploadError) {
      await rejectProductForm(req, res, 'Ürün ekle', product, { image_file: req.imageUploadError }, null);
      return;
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      await rejectProductForm(req, res, 'Ürün ekle', product, fieldErrors(result), null);
      return;
    }

    const resolved = await resolveSlug(product, '');
    if (resolved.error) {
      await rejectProductForm(req, res, 'Ürün ekle', product, { slug: resolved.error }, null);
      return;
    }

    await productModel.create({
      ...product,
      slug: resolved.slug,
      price: product.price === '' ? null : Number(product.price)
    });
    saved = true;
    setFlash(req, 'Ürün kaydedildi.');
    res.redirect(303, '/admin/products');
  } catch (error) {
    if (!saved) {
      await productImages.discardUpload(req).catch(() => {});
    }
    if (error.status === 400) {
      product.imageUrl = '';
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
  const product = applyImageChoice(req, valuesFrom(req.body));
  product.id = req.params.id;
  let existing = null;
  let saved = false;

  try {
    if (validationResult(req).array().some((item) => item.path === 'id')) {
      throw missingRecord();
    }

    existing = await productModel.findById(req.params.id);
    if (!existing) {
      throw missingRecord();
    }

    if (req.imageUploadError) {
      product.imageUrl = existing.imageUrl;
      await rejectProductForm(req, res, 'Ürünü düzenle', product, { image_file: req.imageUploadError }, existing);
      return;
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      await rejectProductForm(req, res, 'Ürünü düzenle', product, fieldErrors(result), existing);
      return;
    }

    const resolved = await resolveSlug(product, existing.id);
    if (resolved.error) {
      await rejectProductForm(req, res, 'Ürünü düzenle', product, { slug: resolved.error }, existing);
      return;
    }

    const previousImage = existing.imageUrl;
    await productModel.update(existing.id, {
      ...product,
      slug: resolved.slug,
      price: product.price === '' ? null : Number(product.price)
    });
    saved = true;
    await productImages.releaseReplacedImage(previousImage, product.imageUrl).catch(() => {
      console.error('Stored product image could not be removed.');
    });
    setFlash(req, 'Ürün güncellendi.');
    res.redirect(303, '/admin/products');
  } catch (error) {
    if (!saved) {
      await productImages.discardUpload(req).catch(() => {});
    }
    if (error.status === 400) {
      if (existing) {
        product.imageUrl = existing.imageUrl;
      }
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

    const previousImage = product.imageUrl;
    await productModel.remove(product.id);
    await productImages.releaseReplacedImage(previousImage, '').catch(() => {
      console.error('Stored product image could not be removed.');
    });
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
