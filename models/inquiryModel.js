const supabase = require('../config/supabase');
const adminError = require('./adminError');

const INQUIRY_COLUMNS = 'id, customer_name, email, phone, message, status, created_at, products(id, name, slug)';

/**
 * Stores a validated inquiry. The caller must already have checked the product.
 */
async function create({ customerName, email, phone, productId, message }) {
  try {
    const { error } = await supabase.from('inquiries').insert({
      customer_name: customerName,
      email,
      phone: phone || null,
      product_id: productId || null,
      message,
      status: 'new'
    });

    if (error) {
      console.error(`Inquiry insert failed (${error.code || 'none'}).`);
      const wrapped = new Error('Mesaj gönderilemedi. Lütfen yeniden deneyin.');
      wrapped.status = 503;
      throw wrapped;
    }
  } catch (error) {
    if (error.status) {
      throw error;
    }

    console.error('Inquiry insert failed (none).');
    const wrapped = new Error('Mesaj gönderilemedi. Lütfen yeniden deneyin.');
    wrapped.status = 503;
    throw wrapped;
  }
}

module.exports = {
  create,
  listAll,
  findById,
  updateStatus,
  remove,
  countAll,
  countByStatus
};

function mapInquiry(row) {
  if (!row) {
    return null;
  }

  const product = row.products || null;

  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone || '',
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    product: product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug
        }
      : null
  };
}

async function listAll() {
  const { data, error } = await supabase
    .from('inquiries')
    .select(INQUIRY_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    throw adminError(error, 'Mesajlar yüklenemedi.');
  }

  return (data || []).map(mapInquiry);
}

async function findById(id) {
  const { data, error } = await supabase
    .from('inquiries')
    .select(INQUIRY_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw adminError(error, 'Mesaj yüklenemedi.');
  }

  return mapInquiry(data);
}

async function updateStatus(id, status) {
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw adminError(error, 'Mesaj durumu güncellenemedi.');
  }
}

async function remove(id) {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id);

  if (error) {
    throw adminError(error, 'Mesaj silinemedi. Lütfen yeniden deneyin.');
  }
}

async function countAll() {
  const { count, error } = await supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw adminError(error, 'Panel yüklenemedi.');
  }

  return count || 0;
}

async function countByStatus(status) {
  const { count, error } = await supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);

  if (error) {
    throw adminError(error, 'Panel yüklenemedi.');
  }

  return count || 0;
}
