import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';

let db: any = null;
let usePostgres = false;
let pgPool: Pool | null = null;

// Determine which database to use
if (process.env.NODE_ENV === 'production' && process.env.TheFinance) {
  usePostgres = true;
  pgPool = new Pool({
    connectionString: process.env.TheFinance,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  pgPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  console.log('✅ Using PostgreSQL database');
} else {
  const dbPath = path.join(process.cwd(), 'data.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  console.log('✅ Using SQLite database');
}

// Wrapper for SQLite-like interface
export const database = {
  async prepare(sql: string) {
    if (usePostgres && pgPool) {
      return {
        run: async (...params: any[]) => {
          const result = await pgPool!.query(sql, params);
          return { changes: result.rowCount };
        },
        get: async (...params: any[]) => {
          const result = await pgPool!.query(sql, params);
          return result.rows[0];
        },
        all: async (...params: any[]) => {
          const result = await pgPool!.query(sql, params);
          return result.rows;
        },
      };
    } else {
      const stmt = db.prepare(sql);
      return {
        run: (...params: any[]) => stmt.run(...params),
        get: (...params: any[]) => stmt.get(...params),
        all: (...params: any[]) => stmt.all(...params),
      };
    }
  },

  // Synchronous operations for SQLite
  prepareSync(sql: string) {
    if (usePostgres && pgPool) {
      console.warn('⚠️ Cannot use sync prepare with PostgreSQL');
      return null;
    }
    return db.prepare(sql);
  },

  exec(sql: string) {
    if (usePostgres && pgPool) {
      console.warn('⚠️ exec() not supported for PostgreSQL');
      return;
    }
    return db.exec(sql);
  },

  query: async (sql: string, params?: any[]) => {
    if (usePostgres && pgPool) {
      const result = await pgPool.query(sql, params || []);
      return result.rows;
    } else {
      const stmt = db.prepare(sql);
      return stmt.all(...(params || []));
    }
  },

  isPostgres: () => usePostgres,
  getPool: () => pgPool,
};

export default database;
