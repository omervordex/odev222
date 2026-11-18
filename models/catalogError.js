/**
 * Turns a database failure into a safe HTTP error.
 * The original message is not sent to the browser, and secret values are never logged.
 */
function catalogError(error) {
  console.error(`Catalog query failed (${error && error.code ? error.code : 'none'}).`);

  const wrapped = new Error('Katalog yüklenemedi. Lütfen yeniden deneyin.');
  wrapped.status = 500;
  return wrapped;
}

module.exports = catalogError;
