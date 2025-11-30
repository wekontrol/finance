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

// Subscribe to push notifications
router.post('/subscribe', (req: Request, res: Response) => {
  const userId = req.session!.userId as string;
  const { subscription } = req.body;

  if (!subscription) {
    return res.status(400).json({ error: 'Subscription required' });
  }

  try {
    const id = `ps${Date.now()}`;
    const subscriptionJson = JSON.stringify(subscription);
    
    db.prepare(`
      INSERT INTO push_subscriptions (id, user_id, subscription, user_agent)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, subscription) DO UPDATE SET last_active = CURRENT_TIMESTAMP
    `).run(id, userId, subscriptionJson, req.headers['user-agent'] || '');

    res.json({ message: 'Subscribed to push notifications' });
  } catch (error: any) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', (req: Request, res: Response) => {
  const userId = req.session!.userId as string;
  const { subscription } = req.body;

  if (!subscription) {
    return res.status(400).json({ error: 'Subscription required' });
  }

  try {
    const subscriptionJson = JSON.stringify(subscription);
    db.prepare(`
      DELETE FROM push_subscriptions WHERE user_id = ? AND subscription = ?
    `).run(userId, subscriptionJson);

    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get push subscription status
router.get('/status', (req: Request, res: Response) => {
  const userId = req.session!.userId as string;

  try {
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ?
    `).get(userId) as any;

    res.json({ 
      isSubscribed: count.count > 0,
      subscriptionCount: count.count
    });
  } catch (error: any) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send test notification (Admin only)
router.post('/test', (req: Request, res: Response) => {
  const user = req.session!.user as any;
  
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin only' });
  }

  res.json({ message: 'Test notification triggered (não implementado completamente)' });
});

export default router;
