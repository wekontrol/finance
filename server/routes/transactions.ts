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

    let transactions;
    if (user.role === 'SUPER_ADMIN') {
      transactions = await db.all(`
        SELECT t.*, u.name as user_name 
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.date DESC
      `);
    } else if (user.role === 'MANAGER') {
      transactions = await db.all(`
        SELECT t.*, u.name as user_name 
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE u.family_id = ?
        ORDER BY t.date DESC
      `, [user.familyId]);
    } else {
      transactions = await db.all(`
        SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC
      `, [userId]);
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
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { description, amount, date, category, type, isRecurring, frequency } = req.body;

    if (!description || !amount || !date || !category || !type) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const id = `t${Date.now()}`;
    
    await db.run(`
      INSERT INTO transactions (id, user_id, description, amount, date, category, type, is_recurring, frequency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, description, amount, date, category, type, isRecurring ? 1 : 0, frequency || null]);

    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
    
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
  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const user = req.session.user;
    const { description, amount, date, category, type, isRecurring, frequency } = req.body;

    const existing = await db.get('SELECT t.*, u.family_id FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const canEdit = existing.user_id === userId || 
                    user.role === 'SUPER_ADMIN' || 
                    (user.role === 'MANAGER' && existing.family_id === user.familyId);
    
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this transaction' });
    }

    await db.run(`
      UPDATE transactions 
      SET description = ?, amount = ?, date = ?, category = ?, type = ?, is_recurring = ?, frequency = ?
      WHERE id = ?
    `, [description, amount, date, category, type, isRecurring ? 1 : 0, frequency || null, id]);

    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
    
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
  } catch (error: any) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const user = req.session.user;

    const existing = await db.get('SELECT t.*, u.family_id FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const canDelete = existing.user_id === userId || 
                      user.role === 'SUPER_ADMIN' || 
                      (user.role === 'MANAGER' && existing.family_id === user.familyId);
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this transaction' });
    }

    await db.run('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ message: 'Transaction deleted' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
