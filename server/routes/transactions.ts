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

  let transactions;
  if (user.role === 'SUPER_ADMIN') {
    transactions = db.prepare(`
      SELECT t.*, u.name as user_name 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.date DESC
    `).all();
  } else if (user.role === 'MANAGER') {
    transactions = db.prepare(`
      SELECT t.*, u.name as user_name 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE u.family_id = ?
      ORDER BY t.date DESC
    `).all(user.familyId);
  } else {
    transactions = db.prepare(`
      SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC
    `).all(userId);
  }

  const formattedTransactions = transactions.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    description: t.description,
    amount: t.amount,
    date: t.date,
    category: t.category,
    type: t.type,
    isRecurring: !!t.is_recurring,
    frequency: t.frequency,
    nextDueDate: t.next_due_date,
    userName: t.user_name
  }));

  res.json(formattedTransactions);
});

router.post('/', (req: Request, res: Response) => {
  const userId = req.session.userId;
  const { description, amount, date, category, type, isRecurring, frequency } = req.body;

  if (!description || !amount || !date || !category || !type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const id = `t${Date.now()}`;
  
  db.prepare(`
    INSERT INTO transactions (id, user_id, description, amount, date, category, type, is_recurring, frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, description, amount, date, category, type, isRecurring ? 1 : 0, frequency || null);

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  
  res.status(201).json({
    id: transaction.id,
    userId: transaction.user_id,
    description: transaction.description,
    amount: transaction.amount,
    date: transaction.date,
    category: transaction.category,
    type: transaction.type,
    isRecurring: !!transaction.is_recurring,
    frequency: transaction.frequency
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const user = req.session.user;
  const { description, amount, date, category, type, isRecurring, frequency } = req.body;

  const existing = db.prepare('SELECT t.*, u.family_id FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const canEdit = existing.user_id === userId || 
                  user.role === 'SUPER_ADMIN' || 
                  (user.role === 'MANAGER' && existing.family_id === user.familyId);
  
  if (!canEdit) {
    return res.status(403).json({ error: 'Not authorized to edit this transaction' });
  }

  db.prepare(`
    UPDATE transactions 
    SET description = ?, amount = ?, date = ?, category = ?, type = ?, is_recurring = ?, frequency = ?
    WHERE id = ?
  `).run(description, amount, date, category, type, isRecurring ? 1 : 0, frequency || null, id);

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  
  res.json({
    id: transaction.id,
    userId: transaction.user_id,
    description: transaction.description,
    amount: transaction.amount,
    date: transaction.date,
    category: transaction.category,
    type: transaction.type,
    isRecurring: !!transaction.is_recurring,
    frequency: transaction.frequency
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const user = req.session.user;

  const existing = db.prepare('SELECT t.*, u.family_id FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const canDelete = existing.user_id === userId || 
                    user.role === 'SUPER_ADMIN' || 
                    (user.role === 'MANAGER' && existing.family_id === user.familyId);
  
  if (!canDelete) {
    return res.status(403).json({ error: 'Not authorized to delete this transaction' });
  }

  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  res.json({ message: 'Transaction deleted' });
});

export default router;
