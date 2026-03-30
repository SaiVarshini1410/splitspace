const pool = require('../config/db');

// GET ALL EXPENSES for the household
const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [expenses] = await pool.query(
      `SELECT e.*, u.name as paid_by_name
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       WHERE e.household_id = ?
       ORDER BY e.date DESC, e.created_at DESC`,
      [householdId]
    );

    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE AN EXPENSE
const createExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description, category, split_type, date } = req.body;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [result] = await pool.query(
      'INSERT INTO expenses (household_id, paid_by, amount, description, category, split_type, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [householdId, userId, amount, description, category || 'other', split_type || 'equal', date || new Date().toISOString().split('T')[0]]
    );

    const expenseId = result.insertId;

    const [members] = await pool.query(
      'SELECT user_id FROM household_members WHERE household_id = ? AND left_at IS NULL',
      [householdId]
    );

    if (split_type === 'equal') {
      const shareAmount = (amount / members.length).toFixed(2);

      for (const member of members) {
        await pool.query(
          'INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)',
          [expenseId, member.user_id, shareAmount]
        );
      }
    }

    const [newExpense] = await pool.query(
      `SELECT e.*, u.name as paid_by_name
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       WHERE e.id = ?`,
      [expenseId]
    );

    res.status(201).json({
      message: 'Expense created successfully',
      expense: newExpense[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET MY DEBTS — what I owe others and what others owe me
const getMyDebts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    // Get all unsettled expenses with splits for this household
    const [rows] = await pool.query(
      `SELECT e.id as expense_id, e.paid_by, es.user_id, es.share_amount, es.settled
       FROM expenses e
       JOIN expense_splits es ON e.id = es.expense_id
       WHERE e.household_id = ? AND es.settled = FALSE AND e.paid_by != es.user_id`,
      [householdId]
    );

    // Build debt map: person-to-person
    const debtMap = {};

    for (const row of rows) {
      // row.user_id owes row.paid_by the share_amount
      const key = `${row.user_id}->${row.paid_by}`;
      debtMap[key] = (debtMap[key] || 0) + parseFloat(row.share_amount);
    }

    // Net out debts between pairs
    const netted = {};
    const processed = new Set();

    for (const key of Object.keys(debtMap)) {
      if (processed.has(key)) continue;

      const [debtorId, creditorId] = key.split('->').map(Number);
      const reverseKey = `${creditorId}->${debtorId}`;

      const owes = debtMap[key] || 0;
      const owedBack = debtMap[reverseKey] || 0;
      const net = Math.round((owes - owedBack) * 100) / 100;

      if (net > 0) {
        netted[key] = net;
      } else if (net < 0) {
        netted[reverseKey] = Math.abs(net);
      }

      processed.add(key);
      processed.add(reverseKey);
    }

    // Get names
    const [members] = await pool.query(
      'SELECT u.id, u.name FROM users u JOIN household_members hm ON u.id = hm.user_id WHERE hm.household_id = ? AND hm.left_at IS NULL',
      [householdId]
    );

    const nameMap = {};
    for (const m of members) {
      nameMap[m.id] = m.name;
    }

    // Split into "I owe" and "owed to me"
    const iOwe = [];
    const owedToMe = [];

    for (const [key, amount] of Object.entries(netted)) {
      const [debtorId, creditorId] = key.split('->').map(Number);

      if (debtorId === userId) {
        iOwe.push({
          userId: creditorId,
          name: nameMap[creditorId],
          amount: amount,
        });
      } else if (creditorId === userId) {
        owedToMe.push({
          userId: debtorId,
          name: nameMap[debtorId],
          amount: amount,
        });
      }
    }

    // Total household spend
    const [totalResult] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE household_id = ?',
      [householdId]
    );

    res.json({
      iOwe,
      owedToMe,
      totalSpend: parseFloat(totalResult[0].total),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// SETTLE DEBT — mark all splits between two users as settled
const settleDebt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { withUserId } = req.body;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    // Settle all splits where:
    // 1. I owe them: expense paid_by = withUserId, split user_id = me
    await pool.query(
      `UPDATE expense_splits es
       JOIN expenses e ON es.expense_id = e.id
       SET es.settled = TRUE, es.settled_at = NOW()
       WHERE e.household_id = ? AND e.paid_by = ? AND es.user_id = ? AND es.settled = FALSE`,
      [householdId, withUserId, userId]
    );

    // 2. They owe me: expense paid_by = me, split user_id = withUserId
    await pool.query(
      `UPDATE expense_splits es
       JOIN expenses e ON es.expense_id = e.id
       SET es.settled = TRUE, es.settled_at = NOW()
       WHERE e.household_id = ? AND e.paid_by = ? AND es.user_id = ? AND es.settled = FALSE`,
      [householdId, userId, withUserId]
    );

    res.json({ message: 'Debt settled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE AN EXPENSE
const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [expense] = await pool.query(
      'SELECT id FROM expenses WHERE id = ? AND household_id = ?',
      [expenseId, householdId]
    );

    if (expense.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await pool.query('DELETE FROM expense_splits WHERE expense_id = ?', [expenseId]);
    await pool.query('DELETE FROM expenses WHERE id = ?', [expenseId]);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getExpenses, createExpense, getMyDebts, settleDebt, deleteExpense };