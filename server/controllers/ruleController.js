const pool = require('../config/db');

// GET ALL RULES
const getRules = async (req, res) => {
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

    const [rules] = await pool.query(
      `SELECT r.*, u.name as created_by_name
       FROM house_rules r
       JOIN users u ON r.created_by = u.id
       WHERE r.household_id = ?
       ORDER BY r.created_at DESC`,
      [householdId]
    );

    // Get agreements for each rule
    for (const rule of rules) {
      const [agreements] = await pool.query(
        `SELECT ra.user_id, ra.agreed_at, u.name
         FROM rule_agreements ra
         JOIN users u ON ra.user_id = u.id
         WHERE ra.rule_id = ?`,
        [rule.id]
      );
      rule.agreements = agreements;
    }

    // Get total member count for "X of Y agreed"
    const [members] = await pool.query(
      'SELECT COUNT(*) as count FROM household_members WHERE household_id = ? AND left_at IS NULL',
      [householdId]
    );

    res.json({ rules, totalMembers: members[0].count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE A RULE
const createRule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description } = req.body;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [result] = await pool.query(
      'INSERT INTO house_rules (household_id, title, description, created_by) VALUES (?, ?, ?, ?)',
      [householdId, title, description, userId]
    );

    // Creator auto-agrees
    await pool.query(
      'INSERT INTO rule_agreements (rule_id, user_id) VALUES (?, ?)',
      [result.insertId, userId]
    );

    const [newRule] = await pool.query(
      `SELECT r.*, u.name as created_by_name
       FROM house_rules r
       JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    const [agreements] = await pool.query(
      `SELECT ra.user_id, ra.agreed_at, u.name
       FROM rule_agreements ra
       JOIN users u ON ra.user_id = u.id
       WHERE ra.rule_id = ?`,
      [result.insertId]
    );

    newRule[0].agreements = agreements;

    res.status(201).json({
      message: 'Rule created successfully',
      rule: newRule[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// AGREE TO A RULE
const agreeToRule = async (req, res) => {
  try {
    const userId = req.user.id;
    const ruleId = req.params.id;

    // Check if already agreed
    const [existing] = await pool.query(
      'SELECT id FROM rule_agreements WHERE rule_id = ? AND user_id = ?',
      [ruleId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'You already agreed to this rule' });
    }

    await pool.query(
      'INSERT INTO rule_agreements (rule_id, user_id) VALUES (?, ?)',
      [ruleId, userId]
    );

    const [agreements] = await pool.query(
      `SELECT ra.user_id, ra.agreed_at, u.name
       FROM rule_agreements ra
       JOIN users u ON ra.user_id = u.id
       WHERE ra.rule_id = ?`,
      [ruleId]
    );

    res.json({ message: 'Agreed to rule', agreements });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE A RULE (increments version, resets agreements)
const updateRule = async (req, res) => {
  try {
    const userId = req.user.id;
    const ruleId = req.params.id;
    const { title, description } = req.body;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [rule] = await pool.query(
      'SELECT id, version FROM house_rules WHERE id = ? AND household_id = ?',
      [ruleId, householdId]
    );

    if (rule.length === 0) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    // Update rule and increment version
    await pool.query(
      'UPDATE house_rules SET title = ?, description = ?, version = version + 1 WHERE id = ?',
      [title, description, ruleId]
    );

    // Reset all agreements — everyone needs to re-agree
    await pool.query('DELETE FROM rule_agreements WHERE rule_id = ?', [ruleId]);

    // Creator of the edit auto-agrees
    await pool.query(
      'INSERT INTO rule_agreements (rule_id, user_id) VALUES (?, ?)',
      [ruleId, userId]
    );

    const [updated] = await pool.query(
      `SELECT r.*, u.name as created_by_name
       FROM house_rules r
       JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [ruleId]
    );

    const [agreements] = await pool.query(
      `SELECT ra.user_id, ra.agreed_at, u.name
       FROM rule_agreements ra
       JOIN users u ON ra.user_id = u.id
       WHERE ra.rule_id = ?`,
      [ruleId]
    );

    updated[0].agreements = agreements;

    res.json({
      message: 'Rule updated successfully',
      rule: updated[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE A RULE
const deleteRule = async (req, res) => {
  try {
    const userId = req.user.id;
    const ruleId = req.params.id;

    const [membership] = await pool.query(
      'SELECT household_id FROM household_members WHERE user_id = ? AND left_at IS NULL',
      [userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ message: 'You are not in a household' });
    }

    const householdId = membership[0].household_id;

    const [rule] = await pool.query(
      'SELECT id FROM house_rules WHERE id = ? AND household_id = ?',
      [ruleId, householdId]
    );

    if (rule.length === 0) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    await pool.query('DELETE FROM rule_agreements WHERE rule_id = ?', [ruleId]);
    await pool.query('DELETE FROM house_rules WHERE id = ?', [ruleId]);

    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRules, createRule, agreeToRule, updateRule, deleteRule };