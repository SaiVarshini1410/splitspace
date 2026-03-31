const express = require('express');
const router = express.Router();
const { getRules, createRule, agreeToRule, updateRule, deleteRule } = require('../controllers/ruleController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', getRules);
router.post('/', createRule);
router.post('/:id/agree', agreeToRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

module.exports = router;