import { Router, Request, Response } from 'express';
import * as db from '../db/manager';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const user = req.session.user;

    let goals;
    if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
      goals = await db.all(`
        SELECT g.* FROM savings_goals g
        JOIN users u ON g.user_id = u.id
        WHERE u.family_id = ? OR g.user_id = ?
      `, [user.familyId, userId]);
    } else {
      goals = await db.all('SELECT * FROM savings_goals WHERE user_id = ?', [userId]);
    }

    const formattedGoals = await Promise.all(goals.map(async (g: any) => {
      const history = await db.all(`
        SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY date DESC
      `, [g.id]);

      return {
        id: g.id,
        name: g.name,
        targetAmount: g.target_amount,
        currentAmount: g.current_amount,
        deadline: g.deadline,
        color: g.color,
        interestRate: g.interest_rate,
        history: history.map((h: any) => ({
          id: h.id,
          userId: h.user_id,
          date: h.date,
          amount: h.amount,
          note: h.note
        }))
      };
    }));

    res.json(formattedGoals);
  } catch (error: any) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { name, targetAmount, deadline, color, interestRate } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Name and target amount are required' });
    }

    const id = `g${Date.now()}`;
    
    await db.run(`
      INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, deadline, color, interest_rate)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    `, [id, userId, name, targetAmount, deadline || null, color || '#10B981', interestRate || null]);

    const goal = await db.get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    
    res.status(201).json({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      deadline: goal.deadline,
      color: goal.color,
      interestRate: goal.interest_rate,
      history: []
    });
  } catch (error: any) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.post('/:id/contribute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const goal = await db.get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const transactionId = `gt${Date.now()}`;
    const newAmount = goal.current_amount + amount;

    await db.run(`
      INSERT INTO goal_transactions (id, goal_id, user_id, date, amount, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [transactionId, id, userId, new Date().toISOString().split('T')[0], amount, note || null]);

    await db.run('UPDATE savings_goals SET current_amount = ? WHERE id = ?', [newAmount, id]);

    const updatedGoal = await db.get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    const history = await db.all('SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY date DESC', [id]);

    res.json({
      id: updatedGoal.id,
      name: updatedGoal.name,
      targetAmount: updatedGoal.target_amount,
      currentAmount: updatedGoal.current_amount,
      deadline: updatedGoal.deadline,
      color: updatedGoal.color,
      interestRate: updatedGoal.interest_rate,
      history: history.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        date: h.date,
        amount: h.amount,
        note: h.note
      }))
    });
  } catch (error: any) {
    console.error('Contribute to goal error:', error);
    res.status(500).json({ error: 'Failed to contribute to goal' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, deadline, color, interestRate } = req.body;

    const existing = await db.get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await db.run(`
      UPDATE savings_goals 
      SET name = ?, target_amount = ?, deadline = ?, color = ?, interest_rate = ?
      WHERE id = ?
    `, [name, targetAmount, deadline, color, interestRate, id]);

    const goal = await db.get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    const history = await db.all('SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY date DESC', [id]);

    res.json({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      deadline: goal.deadline,
      color: goal.color,
      interestRate: goal.interest_rate,
      history: history.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        date: h.date,
        amount: h.amount,
        note: h.note
      }))
    });
  } catch (error: any) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const user = req.session.user;

    const existing = await db.get('SELECT g.*, u.family_id FROM savings_goals g JOIN users u ON g.user_id = u.id WHERE g.id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const canDelete = existing.user_id === userId || 
                      user.role === 'SUPER_ADMIN' || 
                      (user.role === 'MANAGER' && existing.family_id === user.familyId);
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this goal' });
    }

    await db.run('DELETE FROM savings_goals WHERE id = ?', [id]);
    res.json({ message: 'Goal deleted' });
  } catch (error: any) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
