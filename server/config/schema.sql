CREATE DATABASE IF NOT EXISTS splitspace;
USE splitspace;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Households table
CREATE TABLE households (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Household members junction table
CREATE TABLE household_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  household_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (household_id) REFERENCES households(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_member (household_id, user_id)
);

-- Chore definitions
CREATE TABLE chores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  household_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  difficulty INT NOT NULL DEFAULT 1,
  frequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Chore assignments (instances of chores assigned to users)
CREATE TABLE chore_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chore_id INT NOT NULL,
  assigned_to INT NOT NULL,
  due_date DATE NOT NULL,
  completed_at TIMESTAMP NULL,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  household_id INT NOT NULL,
  paid_by INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  category ENUM('rent', 'utilities', 'groceries', 'supplies', 'food', 'transport', 'entertainment', 'other') DEFAULT 'other',
  split_type ENUM('equal', 'custom') DEFAULT 'equal',
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id),
  FOREIGN KEY (paid_by) REFERENCES users(id)
);

CREATE TABLE expense_splits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_id INT NOT NULL,
  user_id INT NOT NULL,
  share_amount DECIMAL(10,2) NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMP NULL,
  FOREIGN KEY (expense_id) REFERENCES expenses(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);