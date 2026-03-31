const express = require('express');
const router = express.Router();
const { getItems, createItem, updateStatus, deleteItem, getLowCount } = require('../controllers/inventoryController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', getItems);
router.post('/', createItem);
router.get('/low-count', getLowCount);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteItem);

module.exports = router;