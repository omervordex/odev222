const supabase = require('../config/supabase');
const adminError = require('./adminError');

async function countAdmins() {
  const { count, error } = await supabase
    .from('admins')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw adminError(error, 'Yönetici listesi kontrol edilemedi.');
  }

  return count || 0;
}

async function findByEmail(email) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw adminError(error, 'Giriş tamamlanamadı.');
  }

  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw adminError(error, 'Giriş tamamlanamadı.');
  }

  return data;
}

async function create({ email, passwordHash }) {
  const { error } = await supabase.from('admins').insert({
    email,
    password_hash: passwordHash
  });

  if (error) {
    throw adminError(error, 'Yönetici hesabı oluşturulamadı.');
  }
}

module.exports = {
  countAdmins,
  findByEmail,
  findById,
  create
};
