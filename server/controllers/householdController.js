const pool = require('../config/db');
const crypto = require('crypto');

// Generate a unique 8-character invite code
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// CREATE HOUSEHOLD
const createHousehold = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Check if user is already in a household
    const [existing] = await pool.query(
      'SELECT id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You are already in a household' });
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const [existing] = await pool.query(
        'SELECT id FROM households WHERE invite_code = ?',
        [inviteCode]
      );
      if (existing.length === 0) isUnique = true;
    }

    // Create the household
    const [result] = await pool.query(
      'INSERT INTO households (name, invite_code, created_by) VALUES (?, ?, ?)',
      [name, inviteCode, userId]
    );

    // Add creator as admin member
    await pool.query(
      'INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, userId, 'admin']
    );

    res.status(201).json({
      message: 'Household created successfully',
      household: {
        id: result.insertId,
        name,
        inviteCode,
        role: 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// JOIN HOUSEHOLD
const joinHousehold = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    // Check if user is already in a household
    const [existingMembership] = await pool.query(
      'SELECT id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );
    if (existingMembership.length > 0) {
      return res.status(400).json({ message: 'You are already in a household' });
    }

    // Find household by invite code
    const [households] = await pool.query(
      'SELECT * FROM households WHERE invite_code = ?',
      [inviteCode]
    );
    if (households.length === 0) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    const household = households[0];

    // Add user as member
    await pool.query(
      'INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)',
      [household.id, userId, 'member']
    );

    res.json({
      message: 'Joined household successfully',
      household: {
        id: household.id,
        name: household.name,
        inviteCode: household.invite_code,
        role: 'member',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET MY HOUSEHOLD
const getMyHousehold = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT h.id, h.name, h.invite_code, hm.role 
       FROM households h 
       JOIN household_members hm ON h.id = hm.household_id 
       WHERE hm.user_id = ? AND hm.left_at IS NULL`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ household: null });
    }

    const household = rows[0];

    // Get all members of this household
    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, hm.role, hm.joined_at 
       FROM users u 
       JOIN household_members hm ON u.id = hm.user_id 
       WHERE hm.household_id = ? AND hm.left_at IS NULL`,
      [household.id]
    );

    res.json({
      household: {
        id: household.id,
        name: household.name,
        inviteCode: household.invite_code,
        role: household.role,
        members,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createHousehold, joinHousehold, getMyHousehold };