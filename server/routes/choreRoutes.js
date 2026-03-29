const express = require('express');
const router = express.Router();
const { getChores, createChore, deleteChore } = require('../controllers/choreController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', getChores);
router.post('/', createChore);
router.delete('/:id', deleteChore);

module.exports = router;