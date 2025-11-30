/**
 * Database Manager - Wrapper inteligente para SQLite + PostgreSQL
 * Detecta automaticamente qual database usar baseado em NODE_ENV e TheFinance
 */

import Database from 'better-sqlite3';
import { Pool, QueryResult } from 'pg';
import path from 'path';

type QueryParams = any[];

interface DBStatement {
  run(...params: QueryParams): any;
  get(...params: QueryParams): any;
  all(...params: QueryParams): any;
}

interface DatabaseManager {
  prepare(sql: string): DBStatement;
  exec(sql: string): void;
  prepareSync(sql: string): DBStatement | null;
  query(sql: string, params?: QueryParams): Promise<any[]>;
  isPostgres(): boolean;
  isSQLite(): boolean;
  getType(): 'postgres' | 'sqlite';
}

let dbInstance: Database.Database | null = null;
let pgPool: Pool | null = null;
let usePostgres = false;

// Initialize based on environment
export function initializeDatabaseManager() {
  if (process.env.NODE_ENV === 'production' && process.env.TheFinance) {
    console.log('🗄️ DATABASE: PostgreSQL (production mode)');
    usePostgres = true;
    
    pgPool = new Pool({
      connectionString: process.env.TheFinance,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    pgPool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  } else {
    console.log('🗄️ DATABASE: SQLite (development mode)');
    usePostgres = false;
    
    const dbPath = path.join(process.cwd(), 'data.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
  }
}

// Create prepared statement wrapper
function createStatement(sql: string): DBStatement {
  if (usePostgres && pgPool) {
    return {
      run(...params: QueryParams) {
        return pgPool!.query(sql, params);
      },
      get(...params: QueryParams) {
        return pgPool!.query(sql, params);
      },
      all(...params: QueryParams) {
        return pgPool!.query(sql, params);
      },
    };
  } else if (dbInstance) {
    const stmt = dbInstance.prepare(sql);
    return {
      run(...params: QueryParams) {
        return stmt.run(...params);
      },
      get(...params: QueryParams) {
        return stmt.get(...params);
      },
      all(...params: QueryParams) {
        return stmt.all(...params);
      },
    };
  }
  
  throw new Error('No database initialized');
}

// Main database manager object
export const dbManager: DatabaseManager = {
  prepare(sql: string): DBStatement {
    return createStatement(sql);
  },

  exec(sql: string): void {
    if (usePostgres) {
      console.warn('⚠️ exec() called in PostgreSQL mode - use query() instead');
      return;
    }
    if (dbInstance) {
      dbInstance.exec(sql);
    }
  },

  prepareSync(sql: string): DBStatement | null {
    if (usePostgres) {
      console.warn('⚠️ prepareSync() not available for PostgreSQL');
      return null;
    }
    return this.prepare(sql);
  },

  async query(sql: string, params: QueryParams = []): Promise<any[]> {
    if (usePostgres && pgPool) {
      const result = await pgPool.query(sql, params);
      return result.rows;
    } else if (dbInstance) {
      const stmt = dbInstance.prepare(sql);
      return stmt.all(...params);
    }
    throw new Error('No database initialized');
  },

  isPostgres(): boolean {
    return usePostgres;
  },

  isSQLite(): boolean {
    return !usePostgres;
  },

  getType(): 'postgres' | 'sqlite' {
    return usePostgres ? 'postgres' : 'sqlite';
  },
};

export default dbManager;
