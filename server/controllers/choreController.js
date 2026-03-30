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

// GENERATE TODAY'S ASSIGNMENTS
const generateAssignments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's household
    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;
    const today = new Date().toISOString().split('T')[0]; // "2026-03-30"

    // Get all chores for this household
    const [chores] = await pool.query(
      'SELECT * FROM chores WHERE household_id = ?',
      [householdId]
    );

    // Get all household members
    const [members] = await pool.query(
      'SELECT user_id FROM household_members WHERE household_id = ? AND left_at IS NULL',
      [householdId]
    );

    const memberIds = members.map((m) => m.user_id);
    let newAssignments = 0;

    for (const chore of chores) {
      // Find the most recent assignment for this chore
      const [lastAssignment] = await pool.query(
        'SELECT due_date FROM chore_assignments WHERE chore_id = ? ORDER BY due_date DESC LIMIT 1',
        [chore.id]
      );

      let needsAssignment = false;

      if (lastAssignment.length === 0) {
        // Never assigned — create first assignment
        needsAssignment = true;
      } else {
        const lastDateStr = new Date(lastAssignment[0].due_date).toISOString().split('T')[0];
        const daysSince = Math.floor(
          (new Date(today + 'T00:00:00Z') - new Date(lastDateStr + 'T00:00:00Z')) / (1000 * 60 * 60 * 24)
        );


        // Check frequency
        const intervals = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };
        const interval = intervals[chore.frequency] || 7;

        if (daysSince >= interval) {
          needsAssignment = true;
        }
      }

      if (needsAssignment) {
        // Pick who to assign — whoever has done this chore the least
        const [counts] = await pool.query(
          `SELECT hm.user_id, COUNT(ca.id) as total
           FROM household_members hm
           LEFT JOIN chore_assignments ca ON ca.assigned_to = hm.user_id AND ca.chore_id = ?
           WHERE hm.household_id = ? AND hm.left_at IS NULL
           GROUP BY hm.user_id
           ORDER BY total ASC
           LIMIT 1`,
          [chore.id, householdId]
        );

        const assignTo = counts.length > 0 ? counts[0].user_id : memberIds[0];

        // Check if an assignment for today already exists
        const [existing] = await pool.query(
          'SELECT id FROM chore_assignments WHERE chore_id = ? AND due_date = ?',
          [chore.id, today]
        );

        if (existing.length === 0) {
          await pool.query(
            'INSERT INTO chore_assignments (chore_id, assigned_to, due_date) VALUES (?, ?, ?)',
            [chore.id, assignTo, today]
          );
          newAssignments++;
        }
      }
    }

    res.json({ message: `Generated ${newAssignments} new assignments` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET TODAY'S ASSIGNMENTS
const getTodayAssignments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's household
    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;
    const today = new Date().toISOString().split('T')[0];

    // Get today's assignments with chore details and assigned user name
    const [assignments] = await pool.query(
      `SELECT ca.*, c.name as chore_name, c.difficulty, c.frequency, u.name as assigned_to_name
       FROM chore_assignments ca
       JOIN chores c ON ca.chore_id = c.id
       JOIN users u ON ca.assigned_to = u.id
       WHERE c.household_id = ? AND ca.due_date = ?
       ORDER BY ca.completed_at IS NOT NULL, c.difficulty DESC`,
      [householdId, today]
    );

    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// MARK ASSIGNMENT AS COMPLETE
const completeAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;

    const [result] = await pool.query(
      'UPDATE chore_assignments SET completed_at = NOW() WHERE id = ? AND completed_at IS NULL',
      [assignmentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Assignment not found or already completed' });
    }

    res.json({ message: 'Chore marked as complete' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getChores, createChore, deleteChore, generateAssignments, getTodayAssignments, completeAssignment };