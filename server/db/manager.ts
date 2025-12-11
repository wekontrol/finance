/**
 * Database Manager - SQLite com WAL para dev + produção
 * Padrão: SEMPRE USE ASYNC/AWAIT para compatibilidade futura
 */

import Database from 'better-sqlite3';
import path from 'path';

type QueryParams = any[];

let dbInstance: Database.Database | null = null;

// Initialize SQLite (dev + production)
export function initializeDatabaseManager() {
  console.log('🗄️ DATABASE MODE: SQLite (dev + production)');
  
  const dbPath = path.join(process.cwd(), 'data.db');
  dbInstance = new Database(dbPath);
  
  // Enable Write-Ahead Logging for better concurrency
  dbInstance.pragma('journal_mode = WAL');
  
  // Performance optimizations for family use
  dbInstance.pragma('cache_size = -64000');      // 64MB cache
  dbInstance.pragma('synchronous = NORMAL');      // Balance safety + speed
  dbInstance.pragma('auto_vacuum = INCREMENTAL'); // Automatic cleanup
  
  console.log('✅ SQLite initialized with WAL + optimizations');
}

/**
 * Execute a query and return all rows
 * Works with SQLite (sync converted to async)
 */
export async function all(sql: string, params: QueryParams = []): Promise<any[]> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  const stmt = dbInstance.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute a query and return first row
 * Works with SQLite (sync converted to async)
 */
export async function get(sql: string, params: QueryParams = []): Promise<any> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  const stmt = dbInstance.prepare(sql);
  return stmt.get(...params) || null;
}

/**
 * Execute an INSERT/UPDATE/DELETE query
 * Returns number of affected rows
 */
export async function run(sql: string, params: QueryParams = []): Promise<{ changes: number }> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  const stmt = dbInstance.prepare(sql);
  const result = stmt.run(...params);
  return { changes: result.changes };
}

/**
 * Execute multiple statements in a transaction
 */
export async function transaction<T>(
  callback: (db: { all: typeof all; get: typeof get; run: typeof run }) => Promise<T>
): Promise<T> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  const txn = dbInstance.transaction(callback as any);
  return txn({ all, get, run });
}

/**
 * Get database type (for debugging/logging)
 */
export function getType(): 'sqlite' {
  return 'sqlite';
}

/**
 * Check if using SQLite
 */
export function isSQLite(): boolean {
  return true;
}

/**
 * Get current database choice
 */
export function getDatabaseChoice(): 'sqlite' {
  return 'sqlite';
}

export default {
  all,
  get,
  run,
  transaction,
  getType,
  isSQLite,
  getDatabaseChoice,
};
