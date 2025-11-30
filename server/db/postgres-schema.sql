-- PostgreSQL Schema for Gestor Financeiro Familiar
-- Run this on Ubuntu deployment via deploy.sh

-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_by TEXT,
  family_id TEXT,
  birth_date TEXT,
  allow_parent_view INTEGER DEFAULT 0,
  security_question TEXT,
  security_answer TEXT,
  language_preference TEXT DEFAULT 'pt',
  currency_provider_preference TEXT DEFAULT 'BNA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  is_recurring INTEGER DEFAULT 0,
  frequency TEXT,
  next_due_date TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_attachments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INTEGER,
  type TEXT,
  content TEXT
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  deadline TEXT,
  color TEXT,
  interest_rate REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goal_transactions (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS budget_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  limit_amount REAL NOT NULL,
  is_default INTEGER DEFAULT 0,
  UNIQUE(user_id, category)
);

CREATE TABLE IF NOT EXISTS budget_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  limit_amount REAL NOT NULL,
  spent_amount REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, month)
);

CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  UNIQUE(language, key)
);

CREATE TABLE IF NOT EXISTS api_configurations (
  id TEXT PRIMARY KEY,
  provider TEXT UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  subscription TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subscription)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budget_user_id ON budget_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
