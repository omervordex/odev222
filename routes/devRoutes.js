const express = require('express');
const devController = require('../controllers/devController');

const router = express.Router();

router.get('/health/db', devController.databaseHealth);

module.exports = router;
