const supabase = require('../config/supabase');
const catalogError = require('./catalogError');
const adminError = require('./adminError');

const CATEGORY_COLUMNS = 'id, name, slug, description';

function mapCategory(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || ''
  };
}

async function listAll() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .order('name', { ascending: true });

    if (error) {
      throw catalogError(error);
    }

    return (data || []).map(mapCategory);
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw catalogError(error);
  }
}

module.exports = {
  listAll,
  findById,
  create,
  update,
  countProducts,
  countAll,
  slugTaken,
  uniqueSlug,
  remove
};

async function findById(id) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw adminError(error, 'Kategori yüklenemedi.');
    }

    return mapCategory(data);
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw adminError(error, 'Kategori yüklenemedi.');
  }
}

async function create(values) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: values.name,
        slug: values.slug,
        description: values.description || null
      })
      .select('id')
      .single();

    if (error) {
      throw adminError(error);
    }

    return data.id;
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw adminError(error);
  }
}

async function update(id, values) {
  try {
    const { error } = await supabase
      .from('categories')
      .update({
        name: values.name,
        slug: values.slug,
        description: values.description || null
      })
      .eq('id', id);

    if (error) {
      throw adminError(error);
    }
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw adminError(error);
  }
}

async function countProducts(id) {
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (error) {
    throw adminError(error, 'Kategori kontrol edilemedi.');
  }

  return count || 0;
}

async function countAll() {
  const { count, error } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw adminError(error, 'Panel yüklenemedi.');
  }

  return count || 0;
}

async function slugTaken(slug, ignoreId) {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw adminError(error, 'Kategori kontrol edilemedi.');
  }

  return Boolean(data) && data.id !== ignoreId;
}

async function uniqueSlug(base, ignoreId) {
  let slug = base;
  let suffix = 2;

  while (await slugTaken(slug, ignoreId)) {
    slug = `${base.slice(0, 76)}-${suffix}`;
    suffix += 1;

    if (suffix > 50) {
      const error = new Error('Benzersiz bir kategori adresi oluşturulamadı.');
      error.status = 400;
      throw error;
    }
  }

  return slug;
}

async function remove(id) {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      throw adminError(error, 'Kategori silinemedi.');
    }
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw adminError(error, 'Kategori silinemedi.');
  }
}
