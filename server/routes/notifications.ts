import { Router, Request, Response } from 'express';
import * as db from '../db/manager';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

router.use(requireAuth);

// Get notification preferences for current user
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as string;
    const user = req.session!.user as any;
    const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      // Get global preferences for super admin
      const global = await db.get(`
        SELECT * FROM notification_preferences WHERE is_global = 1
      `) as any;
      
      if (!global) {
        const id = `np${Date.now()}`;
        await db.run(`
          INSERT INTO notification_preferences (id, is_global, budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications)
          VALUES (?, 1, 1, 1, 1, 1, 1, 1)
        `, [id]);
        const created = await db.get(`SELECT * FROM notification_preferences WHERE id = ?`, [id]);
        return res.json(created);
      }
      res.json(global);
    } else {
      // Get user-specific preferences
      const prefs = await db.get(`
        SELECT * FROM notification_preferences WHERE user_id = ? AND is_global = 0
      `, [userId]) as any;
      
      if (!prefs) {
        const id = `np${Date.now()}`;
        await db.run(`
          INSERT INTO notification_preferences (id, user_id, is_global, budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications)
          VALUES (?, ?, 0, 1, 1, 1, 1, 1, 1)
        `, [id, userId]);
        const created = await db.get(`SELECT * FROM notification_preferences WHERE id = ?`, [id]);
        return res.json(created);
      }
      res.json(prefs);
    }
  } catch (error: any) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.post('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as string;
    const user = req.session!.user as any;
    const { budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications } = req.body;
    const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      // Update global preferences
      await db.run(`
        UPDATE notification_preferences 
        SET budget_alerts = ?, subscription_alerts = ?, financial_tips = ?, goal_progress = ?, email_notifications = ?, push_notifications = ?
        WHERE is_global = 1
      `, [budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications]);
    } else {
      // Update user-specific preferences
      await db.run(`
        UPDATE notification_preferences 
        SET budget_alerts = ?, subscription_alerts = ?, financial_tips = ?, goal_progress = ?, email_notifications = ?, push_notifications = ?
        WHERE user_id = ? AND is_global = 0
      `, [budget_alerts, subscription_alerts, financial_tips, goal_progress, email_notifications, push_notifications, userId]);
    }

    res.json({ message: 'Preferences updated' });
  } catch (error: any) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

export default router;
