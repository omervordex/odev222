/**
 * Central error handler.
 * HTML requests receive an error page. Other requests receive JSON.
 * Production responses hide internal error details.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number(err.status) || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const rawMessage = err.message || 'Beklenmeyen bir hata oluştu.';
  const containsSecret = /sb_secret_|sb_publishable_|service_role|SUPABASE_SECRET_KEY/i.test(rawMessage);
  const message = containsSecret || (status === 500 && isProduction)
    ? 'Beklenmeyen bir hata oluştu.'
    : rawMessage;

  console.error(`[${status}] ${req.method} ${req.originalUrl}`);
  if (status >= 500 && !isProduction && err.stack) {
    console.error(err.stack);
  }

  const accept = req.get('Accept') || '';
  const wantsJson = accept.includes('application/json') && !accept.includes('text/html');

  if (wantsJson) {
    return res.status(status).json({
      status: 'error',
      message
    });
  }

  return res.status(status).render('pages/error', {
    title: status === 404 ? 'Sayfa bulunamadı' : 'Hata',
    description: status === 404
      ? 'İstenen sayfa kullanılamıyor.'
      : 'Sayfa tamamlanamadı.',
    status,
    message
  });
}

module.exports = errorHandler;
