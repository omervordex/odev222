/**
 * Safe message for a failed admin query. Database details stay in the server log.
 */
function adminError(error, fallback) {
  const code = error && error.code ? error.code : 'none';
  console.error(`Admin query failed (${code}).`);

  const wrapped = new Error(fallback || 'Değişiklik kaydedilemedi. Lütfen yeniden deneyin.');
  wrapped.status = 500;

  if (code === '23505') {
    wrapped.status = 400;
    wrapped.message = 'Bu değer zaten kullanılıyor.';
  }

  if (code === '23503') {
    wrapped.status = 400;
    wrapped.message = 'Bu kayıt hâlâ başka verilere bağlı.';
  }

  return wrapped;
}

module.exports = adminError;
