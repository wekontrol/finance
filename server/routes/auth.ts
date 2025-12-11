import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as db from '../db/manager';
import { autoSaveMonthlyHistory } from './budget';

const router = Router();

declare module 'express-session' {
  interface SessionData {
    userId: string;
    user: any;
  }
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await db.get(`
      SELECT id, username, password, name, role, avatar, status, created_by, family_id, birth_date, allow_parent_view, language_preference
      FROM users WHERE username = ?
    `, [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Account not approved' });
    }

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.allowParentView = !!user.allow_parent_view;
    userWithoutPassword.birthDate = user.birth_date;
    userWithoutPassword.createdBy = user.created_by;
    userWithoutPassword.familyId = user.family_id;
    userWithoutPassword.languagePreference = user.language_preference;

    req.session.userId = user.id;
    req.session.user = userWithoutPassword;

    // Auto-save budget history if month changed
    autoSaveMonthlyHistory(user.id);

    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, familyName, securityQuestion, securityAnswer } = req.body;

    if (!username || !password || !name || !familyName) {
      return res.status(400).json({ error: 'All fields are required (username, password, name, familyName)' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Default budget categories
    const defaultBudgets = [
      { category: 'Alimentação', limit: 500 },
      { category: 'Transporte', limit: 200 },
      { category: 'Saúde', limit: 300 },
      { category: 'Educação', limit: 400 },
      { category: 'Entretenimento', limit: 150 },
      { category: 'Utilidades', limit: 350 },
      { category: 'Vestuário', limit: 250 },
      { category: 'Comunicação', limit: 100 },
      { category: 'Seguros', limit: 200 },
      { category: 'Poupança', limit: 1000 },
      { category: 'Investimentos', limit: 500 },
      { category: 'Lazer', limit: 200 },
      { category: 'Viagens', limit: 300 },
      { category: 'Casa', limit: 400 },
      { category: 'Pets', limit: 150 },
      { category: 'Geral', limit: 500 }
    ];

    const userId = `u${Date.now()}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const familyId = `fam_${Date.now()}`;

    // Create family
    await db.run(`
      INSERT INTO families (id, name)
      VALUES (?, ?)
    `, [familyId, familyName.trim()]);

    // Create user
    await db.run(`
      INSERT INTO users (id, username, password, name, email, role, avatar, status, family_id, security_question, security_answer, language_preference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      username,
      hashedPassword,
      name,
      email || null,
      'MANAGER',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
      'APPROVED',
      familyId,
      securityQuestion || null,
      securityAnswer ? securityAnswer.toLowerCase() : null,
      'pt'
    ]);

    // Create default budgets for new user
    for (const budget of defaultBudgets) {
      const budgetId = `bl${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      await db.run(`
        INSERT INTO budget_limits (id, user_id, category, limit_amount, is_default)
        VALUES (?, ?, ?, ?, 1)
      `, [budgetId, userId, budget.category, budget.limit]);
    }

    const user = await db.get(`
      SELECT id, username, name, role, avatar, status, family_id as familyId
      FROM users WHERE id = ?
    `, [userId]);

    res.status(201).json({ user });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
});

router.post('/recover-password', async (req: Request, res: Response) => {
  try {
    const { username, securityAnswer, newPassword } = req.body;

    const user = await db.get('SELECT id, security_answer FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.security_answer || user.security_answer !== securityAnswer.toLowerCase()) {
      return res.status(401).json({ error: 'Security answer is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Password recovery error:', error);
    res.status(500).json({ error: 'Password recovery failed' });
  }
});

export default router;
