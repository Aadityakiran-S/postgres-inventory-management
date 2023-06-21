const express = require('express');
const router = express.Router();
const { getData } = require('../controllers/api-requests.js');

router.route('/').get(getData);

module.exports = router;