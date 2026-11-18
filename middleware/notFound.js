/**
 * Passes unmatched routes to the central error handler as HTTP 404.
 */
function notFound(req, res, next) {
  const error = new Error('İstenen sayfa yok.');
  error.status = 404;
  next(error);
}

module.exports = notFound;
