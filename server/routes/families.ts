import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.user || req.session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only Super Admin can access families' });
  }
  next();
}

// GET all families (Super Admin only)
router.get('/', requireAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const families = db.prepare(`
    SELECT 
      f.id,
      f.name,
      f.created_at,
      COUNT(u.id) as member_count
    FROM families f
    LEFT JOIN users u ON f.id = u.family_id
    GROUP BY f.id
    ORDER BY f.created_at DESC
  `).all();

  res.json(families);
});

// DELETE family (Super Admin only)
router.delete('/:id', requireAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;

  // Don't allow deleting the default admin family
  if (id === 'fam_admin') {
    return res.status(403).json({ error: 'Cannot delete the default admin family' });
  }

  // Check if family exists
  const family = db.prepare('SELECT id FROM families WHERE id = ?').get(id);
  if (!family) {
    return res.status(404).json({ error: 'Family not found' });
  }

  // Delete all transactions of users in this family
  db.prepare(`
    DELETE FROM transactions 
    WHERE user_id IN (SELECT id FROM users WHERE family_id = ?)
  `).run(id);

  // Delete all goals of users in this family
  db.prepare(`
    DELETE FROM savings_goals 
    WHERE user_id IN (SELECT id FROM users WHERE family_id = ?)
  `).run(id);

  // Delete all users in this family
  db.prepare('DELETE FROM users WHERE family_id = ?').run(id);

  // Delete the family
  db.prepare('DELETE FROM families WHERE id = ?').run(id);

  res.json({ message: 'Family deleted successfully' });
});

export default router;
