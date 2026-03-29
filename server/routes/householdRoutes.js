const express = require('express');
const router = express.Router();
const { createHousehold, joinHousehold, getMyHousehold } = require('../controllers/householdController');
const authenticate = require('../middleware/auth');

// All household routes require authentication
router.use(authenticate);

router.post('/create', createHousehold);
router.post('/join', joinHousehold);
router.get('/mine', getMyHousehold);

module.exports = router;