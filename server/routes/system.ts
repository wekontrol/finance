import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import * as db from '../db/manager';

const execAsync = promisify(exec);
const router = Router();

let updateProgress = { current: 0, total: 100, status: 'idle', error: null as string | null };

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.user || req.session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only Super Admin can update system' });
  }
  next();
}

// GET update progress
router.get('/update-progress', requireAuth, (req: Request, res: Response) => {
  res.json(updateProgress);
});

// POST - Execute system update
router.post('/update', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    if (updateProgress.current > 0 && updateProgress.current < 100) {
      return res.status(409).json({ error: 'Update already in progress' });
    }

    updateProgress = { current: 10, total: 100, status: 'Iniciando atualização...', error: null };

    // Get project directory
    const projectDir = process.env.PROJECT_DIR || '/var/www/gestor-financeiro' || process.cwd();
    
    // Get GitHub repo URL from settings or use default
    const repoSetting = await db.get('SELECT value FROM app_settings WHERE key = ?', ['github_repo_url']) as any;
    const githubRepo = repoSetting?.value || 'origin';

    // Step 1: Pull from git
    updateProgress = { current: 20, total: 100, status: 'Puxando código do repositório...', error: null };
    try {
      await execAsync(`git pull ${githubRepo} main`, { cwd: projectDir, timeout: 60000, shell: '/bin/bash' });
    } catch (e: any) {
      console.warn('Git pull failed (might be first deploy):', e.message);
    }

    // Step 2: Install dependencies
    updateProgress = { current: 40, total: 100, status: 'Instalando dependências...', error: null };
    await execAsync('npm install', { cwd: projectDir, timeout: 120000, shell: '/bin/bash' });

    // Step 3: Build
    updateProgress = { current: 70, total: 100, status: 'Compilando aplicação...', error: null };
    await execAsync('npm run build', { cwd: projectDir, timeout: 180000, shell: '/bin/bash' });

    // Step 4: Restart service (if running under systemd)
    updateProgress = { current: 90, total: 100, status: 'Reiniciando serviço...', error: null };
    try {
      await execAsync('sudo systemctl restart gestor-financeiro', { timeout: 30000, shell: '/bin/bash' });
    } catch (e: any) {
      console.warn('Systemctl restart not available (development mode):', e.message);
    }

    updateProgress = { current: 100, total: 100, status: 'Atualização concluída!', error: null };

    res.json({
      success: true,
      message: 'Sistema atualizado com sucesso',
      timestamp: new Date().toISOString()
    });

    // Reset progress after 3 seconds
    setTimeout(() => {
      updateProgress = { current: 0, total: 100, status: 'idle', error: null };
    }, 3000);

  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    updateProgress = { current: 0, total: 100, status: 'Erro na atualização', error: errorMsg };
    
    console.error('System update error:', error);
    res.status(500).json({ 
      error: errorMsg,
      details: error.stderr || ''
    });
  }
});

export default router;
