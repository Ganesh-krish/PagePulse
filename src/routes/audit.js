const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { auditValidator } = require('../validators/auditValidator');
const { auditController } = require('../controllers/auditController');

router.post('/', validate(auditValidator), auditController);

module.exports = router;
