const pool = require('../config/db');

// GET ALL CHORES for the user's household
const getChores = async (req, res) => {
  try {
    const userId = req.user.id;

    // First, find which household this user belongs to
    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    // Get all chores for this household, with the creator's name
    const [chores] = await pool.query(
      `SELECT c.*, u.name as created_by_name 
       FROM chores c 
       JOIN users u ON c.created_by = u.id 
       WHERE c.household_id = ?
       ORDER BY c.created_at DESC`,
      [householdId]
    );

    res.json({ chores });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE A NEW CHORE
const createChore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, difficulty, frequency } = req.body;

    // Find user's household
    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    // Insert the chore
    const [result] = await pool.query(
      'INSERT INTO chores (household_id, name, difficulty, frequency, created_by) VALUES (?, ?, ?, ?, ?)',
      [householdId, name, difficulty || 1, frequency || 'weekly', userId]
    );

    // Fetch the created chore with creator name
    const [newChore] = await pool.query(
      `SELECT c.*, u.name as created_by_name 
       FROM chores c 
       JOIN users u ON c.created_by = u.id 
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Chore created successfully',
      chore: newChore[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE A CHORE
const deleteChore = async (req, res) => {
  try {
    const userId = req.user.id;
    const choreId = req.params.id;

    // Find user's household
    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    // Make sure the chore belongs to this household
    const [chore] = await pool.query(
      'SELECT id FROM chores WHERE id = ? AND household_id = ?',
      [choreId, householdId]
    );

    if (chore.length === 0) {
      return res.status(404).json({ message: 'Chore not found' });
    }

    // Delete assignments first (foreign key constraint)
    await pool.query('DELETE FROM chore_assignments WHERE chore_id = ?', [choreId]);

    // Delete the chore
    await pool.query('DELETE FROM chores WHERE id = ?', [choreId]);

    res.json({ message: 'Chore deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getChores, createChore, deleteChore };