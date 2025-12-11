import { Router, Request, Response } from 'express';
import * as db from '../db/manager';

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
router.get('/', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const families = await db.all(`
      SELECT 
        f.id,
        f.name,
        f.created_at,
        COUNT(u.id) as member_count
      FROM families f
      LEFT JOIN users u ON f.id = u.family_id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);

    res.json(families);
  } catch (error: any) {
    console.error('Get families error:', error);
    res.status(500).json({ error: 'Failed to fetch families' });
  }
});

// DELETE family (Super Admin only)
router.delete('/:id', requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Don't allow deleting the default admin family
    if (id === 'fam_admin') {
      return res.status(403).json({ error: 'Cannot delete the default admin family' });
    }

    // Check if family exists
    const family = await db.get('SELECT id FROM families WHERE id = ?', [id]);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Delete all transactions of users in this family
    await db.run(`
      DELETE FROM transactions 
      WHERE user_id IN (SELECT id FROM users WHERE family_id = ?)
    `, [id]);

    // Delete all goals of users in this family
    await db.run(`
      DELETE FROM savings_goals 
      WHERE user_id IN (SELECT id FROM users WHERE family_id = ?)
    `, [id]);

    // Delete all users in this family
    await db.run('DELETE FROM users WHERE family_id = ?', [id]);

    // Delete the family
    await db.run('DELETE FROM families WHERE id = ?', [id]);

    res.json({ message: 'Family deleted successfully' });
  } catch (error: any) {
    console.error('Delete family error:', error);
    res.status(500).json({ error: 'Failed to delete family' });
  }
});

export default router;
