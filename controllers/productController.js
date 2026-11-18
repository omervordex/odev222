const { validationResult } = require('express-validator');
const categoryModel = require('../models/categoryModel');
const productModel = require('../models/productModel');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readFilters(req) {
  const errors = validationResult(req);
  const requestedCategory = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const requestedSearch = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!errors.isEmpty()) {
    return {
      categorySlug: '',
      search: '',
      notice: 'Filtreler geçerli olmadığı için temizlendi.'
    };
  }

  return {
    categorySlug: SLUG_PATTERN.test(requestedCategory) ? requestedCategory : '',
    search: productModel.sanitizeSearch(requestedSearch),
    notice: ''
  };
}

async function catalog(req, res, next) {
  try {
    const filters = readFilters(req);
    const [products, categories] = await Promise.all([
      productModel.listProducts(filters),
      categoryModel.listAll()
    ]);

    res.status(200).render('pages/products', {
      title: 'Koleksiyon',
      description: 'Optik Ayşegül Özçelik koleksiyonuna göz atın. Ürün kayıtları mağaza kataloğundan gelir.',
      products,
      categories,
      categorySlug: filters.categorySlug,
      search: filters.search,
      notice: filters.notice
    });
  } catch (error) {
    next(error);
  }
}

async function detail(req, res, next) {
  try {
    if (!SLUG_PATTERN.test(req.params.slug || '')) {
      const error = new Error('Bu çerçeve katalogda yok.');
      error.status = 404;
      throw error;
    }

    const product = await productModel.findBySlug(req.params.slug);

    if (!product) {
      const error = new Error('Bu çerçeve katalogda yok.');
      error.status = 404;
      throw error;
    }

    const relatedProducts = await productModel.listRelated(product);

    res.status(200).render('pages/product', {
      title: product.name,
      description: product.description || `${product.name}, Başakşehir’deki Optik Ayşegül Özçelik kataloğundan.`,
      product,
      relatedProducts
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  catalog,
  detail
};
