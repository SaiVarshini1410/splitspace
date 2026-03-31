const pool = require('../config/db');

// GET ALL INVENTORY ITEMS
const getItems = async (req, res) => {
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

    const [items] = await pool.query(
      `SELECT i.*, u.name as updated_by_name
       FROM inventory_items i
       JOIN users u ON i.last_updated_by = u.id
       WHERE i.household_id = ?
       ORDER BY 
         CASE i.status WHEN 'out' THEN 0 WHEN 'low' THEN 1 WHEN 'stocked' THEN 2 END,
         i.updated_at DESC`,
      [householdId]
    );

    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE AN ITEM
const createItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, category } = req.body;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [result] = await pool.query(
      'INSERT INTO inventory_items (household_id, name, category, last_updated_by) VALUES (?, ?, ?, ?)',
      [householdId, name, category || 'other', userId]
    );

    const [newItem] = await pool.query(
      `SELECT i.*, u.name as updated_by_name
       FROM inventory_items i
       JOIN users u ON i.last_updated_by = u.id
       WHERE i.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Item added successfully',
      item: newItem[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE ITEM STATUS
const updateStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { status } = req.body;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [item] = await pool.query(
      'SELECT id FROM inventory_items WHERE id = ? AND household_id = ?',
      [itemId, householdId]
    );

    if (item.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await pool.query(
      'UPDATE inventory_items SET status = ?, last_updated_by = ? WHERE id = ?',
      [status, userId, itemId]
    );

    const [updated] = await pool.query(
      `SELECT i.*, u.name as updated_by_name
       FROM inventory_items i
       JOIN users u ON i.last_updated_by = u.id
       WHERE i.id = ?`,
      [itemId]
    );

    res.json({
      message: 'Status updated',
      item: updated[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE AN ITEM
const deleteItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [item] = await pool.query(
      'SELECT id FROM inventory_items WHERE id = ? AND household_id = ?',
      [itemId, householdId]
    );

    if (item.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await pool.query('DELETE FROM inventory_items WHERE id = ?', [itemId]);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET LOW/OUT COUNT
const getLowCount = async (req, res) => {
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

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_items WHERE household_id = ? AND status IN ("low", "out")',
      [householdId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getItems, createItem, updateStatus, deleteItem, getLowCount };