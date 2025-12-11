import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import * as db from '../db/manager';

const router = Router();

// Progress tracking
let backupProgress = { current: 0, total: 100, status: 'idle' };

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.user || (req.session.user.role !== 'ADMIN' && req.session.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Only admins can manage backups' });
  }
  next();
}

// GET backup progress
router.get('/progress', requireAuth, requireAdmin, (req: Request, res: Response) => {
  res.json(backupProgress);
});

// POST - Create backup
router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    backupProgress = { current: 10, total: 100, status: 'Inicializando...' };

    const dbPath = path.join(process.cwd(), 'data.db');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }

    backupProgress = { current: 30, total: 100, status: 'Lendo banco de dados...' };

    // Read the entire database
    const dbContent = fs.readFileSync(dbPath);

    backupProgress = { current: 70, total: 100, status: 'Exportando dados...' };

    // Get all tables data
    const tables: Record<string, any[]> = {};
    const tableNames = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    
    for (const t of tableNames) {
      tables[t.name] = await db.all(`SELECT * FROM ${t.name}`);
    }

    backupProgress = { current: 85, total: 100, status: 'Preparando arquivo...' };

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables,
      dbHash: require('crypto').createHash('md5').update(dbContent).digest('hex')
    };

    backupProgress = { current: 100, total: 100, status: 'Completo!' };

    res.json({
      success: true,
      data: backupData,
      size: JSON.stringify(backupData).length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    backupProgress = { current: 0, total: 100, status: 'Erro: ' + error.message };
    console.error('Create backup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Restore backup
router.post('/restore', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { backupData } = req.body;

    if (!backupData || !backupData.tables) {
      return res.status(400).json({ error: 'Invalid backup data' });
    }

    backupProgress = { current: 10, total: 100, status: 'Iniciando restauro...' };

    // Clear all existing tables
    const tableNames = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    backupProgress = { current: 20, total: 100, status: 'Limpando banco de dados...' };
    
    for (const t of tableNames) {
      try {
        await db.run(`DELETE FROM ${t.name}`);
      } catch (e) {
        // Table might not exist or have constraints
      }
    }

    backupProgress = { current: 40, total: 100, status: 'Inserindo dados...' };

    // Restore data table by table
    const tableList = Object.keys(backupData.tables);
    let processed = 0;

    for (const tableName of tableList) {
      const rows = backupData.tables[tableName];
      if (rows && rows.length > 0) {
        const firstRow = rows[0];
        const columns = Object.keys(firstRow);
        const placeholders = columns.map(() => '?').join(',');
        const sql = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`;
        
        for (const row of rows) {
          await db.run(sql, columns.map(col => row[col]));
        }
      }
      
      processed++;
      const progress = 40 + Math.floor((processed / tableList.length) * 50);
      backupProgress = { current: progress, total: 100, status: `Restaurando ${tableName}...` };
    }

    backupProgress = { current: 100, total: 100, status: 'Restauro completo!' };

    res.json({
      success: true,
      message: 'Backup restaurado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    backupProgress = { current: 0, total: 100, status: 'Erro: ' + error.message };
    console.error('Restore backup error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
