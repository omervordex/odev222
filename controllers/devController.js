const testDatabaseConnection = require('../database/testConnection');

/**
 * GET /health/db
 * Mounted only when NODE_ENV is not production.
 */
async function databaseHealth(req, res, next) {
  try {
    const result = await testDatabaseConnection();
    res.status(result.httpStatus).json(result.body);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  databaseHealth
};
