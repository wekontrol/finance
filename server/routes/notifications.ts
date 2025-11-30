import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

router.use(requireAuth);

// Get notification preferences for current user
router.get('/preferences', (req: Request, res: Response) => {
  const userId = req.session!.userId as string;
  const user = req.session!.user as any;
  const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

  if (isSuperAdmin) {
    // Get global preferences for super admin
    const global = db.prepare(`
      SELECT * FROM notification_preferences WHERE is_global = 1
    `).get() as any;
    
    if (!global) {
      const id = `np${Date.now()}`;
      db.prepare(`
        INSERT INTO notification_preferences (id, is_global, budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications)
        VALUES (?, 1, 1, 1, 1, 1, 1, 1)
      `).run(id);
      const created = db.prepare(`SELECT * FROM notification_preferences WHERE id = ?`).get(id);
      return res.json(created);
    }
    res.json(global);
  } else {
    // Get user-specific preferences
    const prefs = db.prepare(`
      SELECT * FROM notification_preferences WHERE user_id = ? AND is_global = 0
    `).get(userId) as any;
    
    if (!prefs) {
      const id = `np${Date.now()}`;
      db.prepare(`
        INSERT INTO notification_preferences (id, user_id, is_global, budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications)
        VALUES (?, ?, 0, 1, 1, 1, 1, 1, 1)
      `).run(id, userId);
      const created = db.prepare(`SELECT * FROM notification_preferences WHERE id = ?`).get(id);
      return res.json(created);
    }
    res.json(prefs);
  }
});

// Update notification preferences
router.post('/preferences', (req: Request, res: Response) => {
  const userId = req.session!.userId as string;
  const user = req.session!.user as any;
  const { budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications } = req.body;
  const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

  if (isSuperAdmin) {
    // Update global preferences
    db.prepare(`
      UPDATE notification_preferences 
      SET budget_alerts = ?, subscription_alerts = ?, financial_tips = ?, goal_progress = ?, email_notifications = ?, push_notifications = ?
      WHERE is_global = 1
    `).run(budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications);
  } else {
    // Update user-specific preferences
    db.prepare(`
      UPDATE notification_preferences 
      SET budget_alerts = ?, subscription_alerts = ?, financial_tips = ?, goal_progress = ?, email_notifications = ?, push_notifications = ?
      WHERE user_id = ? AND is_global = 0
    `).run(budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications, userId);
  }

  res.json({ message: 'Preferences updated' });
});

export default router;
