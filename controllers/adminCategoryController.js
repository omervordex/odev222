const { validationResult } = require('express-validator');
const categoryModel = require('../models/categoryModel');
const slugify = require('../models/slug');
const { fieldErrors } = require('../validators/adminForms');
const { setFlash } = require('../middleware/requireAdmin');

function blankCategory() {
  return {
    id: '',
    name: '',
    slug: '',
    description: ''
  };
}

function valuesFrom(body) {
  return {
    id: '',
    name: typeof body.name === 'string' ? body.name.trim() : '',
    slug: typeof body.slug === 'string' ? body.slug.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : ''
  };
}

async function resolveSlug(values, ignoreId) {
  if (!values.slug) {
    const generated = slugify(values.name);
    if (!generated) {
      return { slug: '', error: 'Kısa adrese dönüşebilecek bir ad girin.' };
    }

    return { slug: await categoryModel.uniqueSlug(generated, ignoreId), error: '' };
  }

  if (await categoryModel.slugTaken(values.slug, ignoreId)) {
    return { slug: values.slug, error: 'Bu kısa adres başka bir kategoride kullanılıyor.' };
  }

  return { slug: values.slug, error: '' };
}

function missingRecord() {
  const error = new Error('Bu kayıt bulunamadı.');
  error.status = 404;
  return error;
}

function hasInvalidId(req) {
  return validationResult(req).array().some((item) => item.path === 'id');
}

async function list(req, res, next) {
  try {
    const categories = await categoryModel.listAll();
    const withCounts = await Promise.all(categories.map(async (category) => ({
      ...category,
      productCount: await categoryModel.countProducts(category.id)
    })));

    res.status(200).render('admin/categories/list', {
      title: 'Kategoriler',
      categories: withCounts
    });
  } catch (error) {
    next(error);
  }
}

function createForm(req, res) {
  res.status(200).render('admin/categories/form', {
    title: 'Kategori ekle',
    category: blankCategory(),
    errors: {}
  });
}

async function create(req, res, next) {
  const category = valuesFrom(req.body);

  try {
    const result = validationResult(req);
    const errors = fieldErrors(result);

    if (!result.isEmpty()) {
      res.status(400).render('admin/categories/form', {
        title: 'Kategori ekle',
        category,
        errors
      });
      return;
    }

    const resolved = await resolveSlug(category, '');
    if (resolved.error) {
      res.status(400).render('admin/categories/form', {
        title: 'Kategori ekle',
        category,
        errors: { slug: resolved.error }
      });
      return;
    }

    await categoryModel.create({
      name: category.name,
      slug: resolved.slug,
      description: category.description
    });
    setFlash(req, 'Kategori kaydedildi.');
    res.redirect(303, '/admin/categories');
  } catch (error) {
    if (error.status === 400) {
      res.status(400).render('admin/categories/form', {
        title: 'Kategori ekle',
        category,
        errors: { slug: error.message }
      });
      return;
    }

    next(error);
  }
}

async function editForm(req, res, next) {
  try {
    if (hasInvalidId(req)) {
      throw missingRecord();
    }

    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      const error = new Error('Bu kayıt bulunamadı.');
      error.status = 404;
      throw error;
    }

    res.status(200).render('admin/categories/form', {
      title: 'Kategoriyi düzenle',
      category,
      errors: {}
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  const category = valuesFrom(req.body);
  category.id = req.params.id;

  try {
    if (hasInvalidId(req)) {
      throw missingRecord();
    }

    const existing = await categoryModel.findById(req.params.id);
    if (!existing) {
      throw missingRecord();
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).render('admin/categories/form', {
        title: 'Kategoriyi düzenle',
        category,
        errors: fieldErrors(result)
      });
      return;
    }

    const resolved = await resolveSlug(category, existing.id);
    if (resolved.error) {
      res.status(400).render('admin/categories/form', {
        title: 'Kategoriyi düzenle',
        category,
        errors: { slug: resolved.error }
      });
      return;
    }

    await categoryModel.update(existing.id, {
      name: category.name,
      slug: resolved.slug,
      description: category.description
    });
    setFlash(req, 'Kategori güncellendi.');
    res.redirect(303, '/admin/categories');
  } catch (error) {
    if (error.status === 400) {
      res.status(400).render('admin/categories/form', {
        title: 'Kategoriyi düzenle',
        category,
        errors: { slug: error.message }
      });
      return;
    }

    next(error);
  }
}

async function remove(req, res, next) {
  try {
    if (hasInvalidId(req)) {
      throw missingRecord();
    }

    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      throw missingRecord();
    }

    const productCount = await categoryModel.countProducts(category.id);
    if (productCount > 0) {
      setFlash(req, 'Bu kategoride hâlâ ürün var, bu yüzden silinemez. Önce o ürünleri taşıyın veya silin.', 'danger');
      res.redirect(303, '/admin/categories');
      return;
    }

    await categoryModel.remove(category.id);
    setFlash(req, 'Kategori silindi.');
    res.redirect(303, '/admin/categories');
  } catch (error) {
    if (error.status === 400) {
      setFlash(req, 'Bu kategoride hâlâ ürün var, bu yüzden silinemez. Önce o ürünleri taşıyın veya silin.', 'danger');
      res.redirect(303, '/admin/categories');
      return;
    }

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
