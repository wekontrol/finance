/**
 * Database Manager - Abstração universal para SQLite + PostgreSQL
 * Suporta operações SYNC (SQLite) e ASYNC (PostgreSQL) automaticamente
 * Novo padrão: SEMPRE USE ASYNC/AWAIT
 */

import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';

type QueryParams = any[];

let dbInstance: Database.Database | null = null;
let pgPool: Pool | null = null;
let usePostgres = false;
let databaseChoice: 'sqlite' | 'postgresql' = 'sqlite'; // Default to SQLite

// Initialize based on environment + admin choice
export function initializeDatabaseManager() {
  // Check admin choice from app_settings (if already initialized)
  const choice = process.env.DATABASE_CHOICE || 'sqlite';
  
  if ((process.env.NODE_ENV === 'production' && process.env.TheFinance) || choice === 'postgresql') {
    console.log('🗄️ DATABASE MODE: PostgreSQL');
    usePostgres = true;
    databaseChoice = 'postgresql';
    
    pgPool = new Pool({
      connectionString: process.env.TheFinance || process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    pgPool.on('error', (err) => {
      console.error('🔴 PostgreSQL pool error:', err);
    });
  } else {
    console.log('🗄️ DATABASE MODE: SQLite (development)');
    usePostgres = false;
    databaseChoice = 'sqlite';
    
    const dbPath = path.join(process.cwd(), 'data.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
  }
}

// Get current database choice
export function getDatabaseChoice(): 'sqlite' | 'postgresql' {
  return databaseChoice;
}

/**
 * Execute a query and return all rows
 * Works with both SQLite (sync) and PostgreSQL (async)
 */
export async function all(sql: string, params: QueryParams = []): Promise<any[]> {
  if (usePostgres && pgPool) {
    const result = await pgPool.query(sql, params);
    return result.rows;
  } else if (dbInstance) {
    const stmt = dbInstance.prepare(sql);
    return stmt.all(...params);
  }
  throw new Error('No database initialized');
}

/**
 * Execute a query and return first row
 * Works with both SQLite (sync) and PostgreSQL (async)
 */
export async function get(sql: string, params: QueryParams = []): Promise<any> {
  if (usePostgres && pgPool) {
    const result = await pgPool.query(sql, params);
    return result.rows[0] || null;
  } else if (dbInstance) {
    const stmt = dbInstance.prepare(sql);
    return stmt.get(...params) || null;
  }
  throw new Error('No database initialized');
}

/**
 * Execute an INSERT/UPDATE/DELETE query
 * Returns number of affected rows
 */
export async function run(sql: string, params: QueryParams = []): Promise<{ changes: number }> {
  if (usePostgres && pgPool) {
    const result = await pgPool.query(sql, params);
    return { changes: result.rowCount || 0 };
  } else if (dbInstance) {
    const stmt = dbInstance.prepare(sql);
    const result = stmt.run(...params);
    return { changes: result.changes };
  }
  throw new Error('No database initialized');
}

/**
 * Execute multiple statements in a transaction
 */
export async function transaction<T>(
  callback: (db: { all: typeof all; get: typeof get; run: typeof run }) => Promise<T>
): Promise<T> {
  if (usePostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback({ all, get, run });
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else if (dbInstance) {
    const txn = dbInstance.transaction(callback as any);
    return txn({ all, get, run });
  }
  throw new Error('No database initialized');
}

/**
 * Get database type (for debugging/logging)
 */
export function getType(): 'postgres' | 'sqlite' {
  return usePostgres ? 'postgres' : 'sqlite';
}

/**
 * Check if using PostgreSQL
 */
export function isPostgres(): boolean {
  return usePostgres;
}

/**
 * Check if using SQLite
 */
export function isSQLite(): boolean {
  return !usePostgres;
}

export default {
  all,
  get,
  run,
  transaction,
  getType,
  isPostgres,
  isSQLite,
};
