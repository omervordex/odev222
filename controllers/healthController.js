/**
 * Confirms that the Express process is accepting requests.
 * This does not check the database. Database checks come in a later stage.
 */
function check(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Express sunucusu çalışıyor.',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  check
};
