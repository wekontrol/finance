import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

router.use(requireAuth);

router.get('/', (req: Request, res: Response) => {
  const userId = req.session.userId;
  const user = req.session.user;

  let goals;
  if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
    goals = db.prepare(`
      SELECT g.* FROM savings_goals g
      JOIN users u ON g.user_id = u.id
      WHERE u.family_id = ? OR g.user_id = ?
    `).all(user.familyId, userId);
  } else {
    goals = db.prepare('SELECT * FROM savings_goals WHERE user_id = ?').all(userId);
  }

  const formattedGoals = goals.map((g: any) => {
    const history = db.prepare(`
      SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY date DESC
    `).all(g.id);

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
  });

  res.json(formattedGoals);
});

router.post('/', (req: Request, res: Response) => {
  const userId = req.session.userId;
  const { name, targetAmount, deadline, color, interestRate } = req.body;

  if (!name || !targetAmount) {
    return res.status(400).json({ error: 'Name and target amount are required' });
  }

  const id = `g${Date.now()}`;
  
  db.prepare(`
    INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, deadline, color, interest_rate)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `).run(id, userId, name, targetAmount, deadline || null, color || '#10B981', interestRate || null);

  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
  
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
});

router.post('/:id/contribute', (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const { amount, note } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const transactionId = `gt${Date.now()}`;
  const newAmount = goal.current_amount + amount;

  db.prepare(`
    INSERT INTO goal_transactions (id, goal_id, user_id, date, amount, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(transactionId, id, userId, new Date().toISOString().split('T')[0], amount, note || null);

  db.prepare('UPDATE savings_goals SET current_amount = ? WHERE id = ?').run(newAmount, id);

  const updatedGoal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
  const history = db.prepare('SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY date DESC').all(id);

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
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, targetAmount, deadline, color, interestRate } = req.body;

  const existing = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  db.prepare(`
    UPDATE savings_goals 
    SET name = ?, target_amount = ?, deadline = ?, color = ?, interest_rate = ?
    WHERE id = ?
  `).run(name, targetAmount, deadline, color, interestRate, id);

  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
  const history = db.prepare('SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY date DESC').all(id);

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
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const user = req.session.user;

  const existing = db.prepare('SELECT g.*, u.family_id FROM savings_goals g JOIN users u ON g.user_id = u.id WHERE g.id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const canDelete = existing.user_id === userId || 
                    user.role === 'SUPER_ADMIN' || 
                    (user.role === 'MANAGER' && existing.family_id === user.familyId);
  
  if (!canDelete) {
    return res.status(403).json({ error: 'Not authorized to delete this goal' });
  }

  db.prepare('DELETE FROM savings_goals WHERE id = ?').run(id);
  res.json({ message: 'Goal deleted' });
});

export default router;
