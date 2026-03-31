const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const householdRoutes = require('./routes/householdRoutes');
const choreRoutes = require('./routes/choreRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const ruleRoutes = require('./routes/ruleRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/chores', choreRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/rules', ruleRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'SplitSpace API is running' });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ status: 'DB connected successfully' });
  } catch (error) {
    res.status(500).json({ status: 'DB connection failed', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});