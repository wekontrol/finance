import { Router, Request, Response } from 'express';
import * as db from '../db/manager';
import { sendEmail, sendBudgetAlertEmail } from '../services/emailService';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  const user = req.session!.user as any;
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

router.use(requireAuth);

// Send test email
router.post('/test', async (req: Request, res: Response) => {
  try {
    const user = req.session!.user as any;
    const userId = req.session!.userId as string;

    // Get user email from database
    const userRecord = await db.get('SELECT email FROM users WHERE id = ?', [userId]) as any;
    
    if (!userRecord || !userRecord.email) {
      return res.status(400).json({ error: 'User email not configured' });
    }

    sendEmail({
      to: userRecord.email,
      subject: '📧 Teste - Gestor Financeiro',
      body: `Olá ${user.name},\n\nEste é um email de teste do sistema de notificações.\n\nSe você recebeu esta mensagem, o sistema de email está funcionando corretamente!`,
      html: `
        <h2>📧 Email de Teste</h2>
        <p>Olá <strong>${user.name}</strong>,</p>
        <p>Este é um email de teste do sistema de notificações.</p>
        <p>Se você recebeu esta mensagem, o sistema de email está funcionando corretamente!</p>
      `
    }).then(success => {
      res.json({ 
        message: success ? 'Email de teste enviado' : 'Email enviado (fallback - sem configuração)',
        sent: success
      });
    }).catch(error => {
      res.status(500).json({ error: error.message });
    });
  } catch (error: any) {
    console.error('Send test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Get user email configuration
router.get('/config', async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as string;
    const userRecord = await db.get('SELECT email FROM users WHERE id = ?', [userId]) as any;

    res.json({
      hasEmail: !!userRecord?.email,
      email: userRecord?.email ? userRecord.email.replace(/(.{2})(.*)(.{2})/, '$1***$3') : null
    });
  } catch (error: any) {
    console.error('Get email config error:', error);
    res.status(500).json({ error: 'Failed to fetch email configuration' });
  }
});

export default router;
