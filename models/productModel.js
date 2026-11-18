const supabase = require('../config/supabase');
const catalogError = require('./catalogError');
const adminError = require('./adminError');

const PRODUCT_COLUMNS = 'id, name, slug, description, brand, price, image_url, is_featured, categories(id, name, slug)';

const LOCAL_IMAGE = /^\/images\/(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i;

function safeImageUrl(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('/')) {
    if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('//')) {
      return '';
    }

    return LOCAL_IMAGE.test(trimmed) ? trimmed : '';
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.href;
    }
  } catch {
    return '';
  }

  return '';
}

function mapPrice(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function mapProduct(row) {
  const category = row.categories || null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    brand: row.brand || '',
    price: mapPrice(row.price),
    imageUrl: safeImageUrl(row.image_url),
    isFeatured: Boolean(row.is_featured),
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug
        }
      : null
  };
}

function sanitizeSearch(value) {
  return String(value || '')
    .trim()
    .slice(0, 80)
    .replace(/[%_"\\(),.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function catalogErrorOrAdmin(error) {
  if (error && (error.code === '23505' || error.code === '23503')) {
    return adminError(error);
  }

  return catalogError(error);
}

async function runQuery(build) {
  try {
    const { data, error } = await build();

    if (error) {
      throw catalogErrorOrAdmin(error);
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw catalogError(error);
  }
}

async function listFeatured() {
  const data = await runQuery(() => supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6));

  return (data || []).map(mapProduct);
}

async function listProducts(filters = {}) {
  const categorySlug = filters.categorySlug || '';
  const search = sanitizeSearch(filters.search);
  const columns = categorySlug
    ? 'id, name, slug, description, brand, price, image_url, is_featured, categories!inner(id, name, slug)'
    : PRODUCT_COLUMNS;

  const data = await runQuery(() => {
    let request = supabase.from('products').select(columns);

    if (categorySlug) {
      request = request.eq('categories.slug', categorySlug);
    }

    if (search) {
      const pattern = `"%${search}%"`;
      request = request.or(`name.ilike.${pattern},brand.ilike.${pattern}`);
    }

    return request.order('created_at', { ascending: false }).limit(60);
  });

  return (data || []).map(mapProduct);
}

async function findBySlug(slug) {
  const data = await runQuery(() => supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle());

  return data ? mapProduct(data) : null;
}

async function listRelated(product, limit = 3) {
  if (!product || !product.category || !product.category.slug) {
    return [];
  }

  const products = await listProducts({ categorySlug: product.category.slug });
  return products.filter((item) => item.id !== product.id).slice(0, limit);
}

async function countAll() {
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw adminError(error, 'Panel yüklenemedi.');
  }

  return count || 0;
}

async function listForAdmin() {
  const data = await runQuery(() => supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200));

  return (data || []).map(mapProduct);
}

async function findById(id) {
  const data = await runQuery(() => supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .maybeSingle());

  return data ? mapProduct(data) : null;
}

async function slugTaken(slug, ignoreId) {
  const data = await runQuery(() => supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle());

  if (!data) {
    return false;
  }

  return data.id !== ignoreId;
}

async function uniqueSlug(base, ignoreId) {
  let slug = base;
  let suffix = 2;

  while (await slugTaken(slug, ignoreId)) {
    const trimmed = base.slice(0, 76);
    slug = `${trimmed}-${suffix}`;
    suffix += 1;

    if (suffix > 50) {
      const error = new Error('Benzersiz bir ürün adresi oluşturulamadı.');
      error.status = 400;
      throw error;
    }
  }

  return slug;
}

function productRow(values) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    brand: values.brand || null,
    category_id: values.categoryId,
    price: values.price,
    image_url: values.imageUrl || null,
    is_featured: Boolean(values.isFeatured)
  };
}

async function create(values) {
  const data = await runQuery(() => supabase
    .from('products')
    .insert(productRow(values))
    .select('id')
    .single());

  return data.id;
}

async function update(id, values) {
  await runQuery(() => supabase
    .from('products')
    .update(productRow(values))
    .eq('id', id));
}

async function remove(id) {
  await runQuery(() => supabase.from('products').delete().eq('id', id));
}

module.exports = {
  safeImageUrl,
  listFeatured,
  listProducts,
  listRelated,
  findBySlug,
  sanitizeSearch,
  listForAdmin,
  findById,
  slugTaken,
  uniqueSlug,
  countAll,
  create,
  update,
  remove
};
