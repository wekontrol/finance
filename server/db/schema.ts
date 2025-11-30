import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

let db: any = null;
let pgPool: Pool | null = null;
let usePostgres = false;

// Initialize database based on environment
function initDB() {
  if (process.env.NODE_ENV === 'production' && process.env.TheFinance) {
    usePostgres = true;
    pgPool = new Pool({
      connectionString: process.env.TheFinance,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    console.log('✅ Using PostgreSQL for all data');
    return pgPool;
  } else {
    usePostgres = false;
    const dbPath = path.join(process.cwd(), 'data.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log('✅ Using SQLite for all data');
    return db;
  }
}

const db_instance = initDB();

/**
 * Sync translations from JSON files to database
 * Ensures database is always up-to-date with translation files
 */
function syncTranslationsFromJSON() {
  const localesPath = path.join(process.cwd(), 'public', 'locales');
  const languages = ['pt', 'en', 'es', 'um', 'ln', 'fr'];
  
  languages.forEach(lang => {
    const filePath = path.join(localesPath, `${lang}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Translation file not found: ${filePath}`);
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(content);
      
      // Temporarily disable foreign key constraints for sync
      db.exec('PRAGMA foreign_keys = OFF');
      
      // Insert or update each translation in the database
      for (const [key, value] of Object.entries(translations)) {
        if (value && typeof value === 'string') {
          db.prepare(`
            INSERT OR REPLACE INTO translations (id, language, key, value, created_by, updated_at, status)
            VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')
          `).run(`tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`, lang, key, value, 'system');
        }
      }
      
      // Re-enable foreign key constraints
      db.exec('PRAGMA foreign_keys = ON');
      
      console.log(`✓ Synced ${Object.keys(translations).length} keys for ${lang}`);
    } catch (error: any) {
      console.error(`Error syncing ${lang} translations:`, error.message);
    }
  });
}

export function initializeDatabase() {
  // Sync translations from JSON files first
  syncTranslationsFromJSON();
  // Migrations: Add missing columns if they don't exist
  try {
    db.exec(`ALTER TABLE api_configurations ADD COLUMN is_default INTEGER DEFAULT 0;`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    db.exec(`ALTER TABLE budget_limits ADD COLUMN is_default INTEGER DEFAULT 0;`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN currency_provider_preference TEXT DEFAULT 'BNA';`);
  } catch (e) {
    // Column already exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      id TEXT PRIMARY KEY,
      language TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_by TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      UNIQUE(language, key),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      frequency TEXT,
      next_due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transaction_attachments (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER,
      type TEXT,
      content TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      color TEXT,
      interest_rate REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goal_transactions (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budget_limits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      is_default INTEGER DEFAULT 0,
      UNIQUE(user_id, category),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS budget_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      month TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      spent_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category, month),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS family_tasks (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      description TEXT NOT NULL,
      assigned_to TEXT,
      is_completed INTEGER DEFAULT 0,
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS family_events (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS saved_simulations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      loan_amount REAL NOT NULL,
      interest_rate_annual REAL NOT NULL,
      term_months INTEGER NOT NULL,
      system TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      provider TEXT PRIMARY KEY,
      rates TEXT NOT NULL,
      last_update TEXT DEFAULT CURRENT_TIMESTAMP,
      next_update TEXT
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      is_global INTEGER DEFAULT 0,
      budget_alerts INTEGER DEFAULT 1,
      subscription_alerts INTEGER DEFAULT 1,
      financial_tips INTEGER DEFAULT 1,
      goal_progress INTEGER DEFAULT 1,
      email_notifications INTEGER DEFAULT 1,
      push_notifications INTEGER DEFAULT 1,
      UNIQUE(user_id, is_global),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_active TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, subscription),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS forecast_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      predictions TEXT NOT NULL,
      confidence INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS waste_analysis_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      waste_indicators TEXT NOT NULL,
      total_waste REAL DEFAULT 0,
      suggestions TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS api_configurations (
      id TEXT PRIMARY KEY,
      provider TEXT UNIQUE NOT NULL,
      api_key TEXT NOT NULL,
      model TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, name, role, avatar, status, family_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'u0',
      'admin',
      hashedPassword,
      'Super Admin',
      'SUPER_ADMIN',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Super',
      'APPROVED',
      'fam_admin'
    );
  }

  // Initialize translations from JSON files - auto-detect all languages
  const translationsCount = db.prepare('SELECT COUNT(*) as count FROM translations').get() as any;
  if (translationsCount.count === 0) {
    const localesDir = path.join(process.cwd(), 'public', 'locales');
    
    try {
      // Auto-detect all JSON files in locales directory
      const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
      const languages = files.map(f => f.replace('.json', ''));
      
      console.log(`📚 Found languages: ${languages.join(', ')}`);
      
      languages.forEach(lang => {
        const filePath = path.join(localesDir, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const translations = JSON.parse(content);
          
          for (const [key, value] of Object.entries(translations)) {
            const id = `tr${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
            try {
              db.prepare(`
                INSERT OR IGNORE INTO translations (id, language, key, value, created_by, status)
                VALUES (?, ?, ?, ?, ?, 'active')
              `).run(id, lang, key, String(value), 'u0');
            } catch (e) {
              // Skip duplicates
            }
          }
        }
      });
      console.log('✅ Translations loaded from JSON files');
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  console.log('Database initialized successfully');
}

export default db;
