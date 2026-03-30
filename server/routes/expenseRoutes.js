const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, getMyDebts, settleDebt, deleteExpense } = require('../controllers/expenseController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/my-debts', getMyDebts);
router.post('/settle', settleDebt);
router.delete('/:id', deleteExpense);

module.exports = router;