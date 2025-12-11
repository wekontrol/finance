import { Router, Request, Response } from 'express';
import * as db from '../db/manager';

const router = Router();

// Função para salvar automaticamente histórico do mês anterior ao final do mês
export async function autoSaveMonthlyHistory(userId: string) {
  try {
    const lastSave = await db.get(`
      SELECT value FROM app_settings WHERE key = ?
    `, [`budget_history_saved_${userId}`]);

    const lastMonth = lastSave?.value || '2000-01';
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Se mudou de mês, salva histórico do mês anterior
    if (lastMonth !== currentMonth) {
      const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
      
      const limits = await db.all(`
        SELECT * FROM budget_limits WHERE user_id = ?
      `, [userId]);

      const transactions = await db.all(`
        SELECT category, SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'DESPESA' AND date LIKE ?
        GROUP BY category
      `, [userId, `${previousMonth}%`]);

      // Adiciona também as assinaturas ativas no mês anterior
      const recurringTransactions = await db.all(`
        SELECT category, SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'DESPESA' AND is_recurring = 1 AND date LIKE ?
        GROUP BY category
      `, [userId, `${previousMonth}%`]);

      let saved = 0;
      for (const limit of limits) {
        const spent = transactions.find(t => t.category === limit.category);
        const recurring = recurringTransactions.find(t => t.category === limit.category);
        const totalSpent = (spent?.total || 0) + (recurring?.total || 0);
        const id = `bh${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        
        await db.run(`
          INSERT OR REPLACE INTO budget_history (id, user_id, category, month, limit_amount, spent_amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id, userId, limit.category, previousMonth, limit.limit_amount, totalSpent]);
        
        saved++;
      }

      // Atualiza a data do último salvamento
      await db.run(`
        INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)
      `, [`budget_history_saved_${userId}`, currentMonth]);

      console.log(`Auto-saved budget history for user ${userId}: ${limits.length} categories from ${previousMonth}`);
    }
  } catch (error) {
    console.error('Error in autoSaveMonthlyHistory:', error);
  }
}

// Background scheduler - executa a cada 30 minutos para salvar históricos automáticamente
export function startMonthlyHistoryScheduler() {
  // Executa a cada 30 minutos (1800000 ms)
  const interval = setInterval(async () => {
    try {
      // Pega todos os usuários que têm orçamentos definidos
      const users = await db.all(`
        SELECT DISTINCT user_id FROM budget_limits
      `);

      if (users.length > 0) {
        console.log(`[Budget Scheduler] Verificando ${users.length} usuários para auto-save do histórico...`);
        for (const user of users) {
          await autoSaveMonthlyHistory(user.user_id);
        }
      }
    } catch (error) {
      console.error('[Budget Scheduler] Error:', error);
    }
  }, 30 * 60 * 1000); // 30 minutos

  // Também executa uma vez na inicialização (após 1 segundo de delay)
  setTimeout(async () => {
    try {
      const users = await db.all(`
        SELECT DISTINCT user_id FROM budget_limits
      `);
      
      if (users.length > 0) {
        console.log(`[Budget Scheduler] Execução inicial: verificando ${users.length} usuários...`);
        for (const user of users) {
          await autoSaveMonthlyHistory(user.user_id);
        }
      }
    } catch (error) {
      console.error('[Budget Scheduler] Initial run error:', error);
    }
  }, 1000);

  console.log('📅 [Budget Scheduler] Started - auto-saves history every 30 minutes');
  
  return interval;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

router.use(requireAuth);

router.get('/limits', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    const user = req.session?.user;

    if (!userId) {
      console.warn('[Budget GET] No userId in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let limits;
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') {
      limits = await db.all(`
        SELECT bl.* FROM budget_limits bl
        JOIN users u ON bl.user_id = u.id
        WHERE u.family_id = ? OR bl.user_id = ?
      `, [user.familyId, userId]);
    } else {
      limits = await db.all(`
        SELECT * FROM budget_limits WHERE user_id = ?
      `, [userId]);
    }

    console.log(`[Budget GET] User ${userId}: Found ${limits.length} budgets`);
    
    const formattedLimits = limits.map((l: any) => ({
      category: l.category,
      limit: l.limit_amount,
      isDefault: l.is_default === 1
    }));

    res.json(formattedLimits);
  } catch (error: any) {
    console.error('Get budget limits error:', error);
    res.status(500).json({ error: 'Failed to fetch budget limits' });
  }
});

// Criar orçamentos padrão se não existirem
router.post('/create-defaults', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      console.warn('Create default budgets: No userId in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const defaultBudgets = [
      { category: 'Renda', limit: 0 },
      { category: 'Energia', limit: 150 },
      { category: 'Água', limit: 80 },
      { category: 'Transporte', limit: 200 },
      { category: 'Alimentação', limit: 300 },
      { category: 'Combustível', limit: 200 },
      { category: 'Compras domésticas', limit: 150 },
      { category: 'Lazer', limit: 150 },
      { category: 'Roupas', limit: 100 },
      { category: 'Saúde', limit: 200 },
      { category: 'Cuidados pessoais', limit: 80 },
      { category: 'Reparação', limit: 150 },
      { category: 'Manutenção', limit: 150 },
      { category: 'Presentes', limit: 100 },
      { category: 'Eventos', limit: 200 },
      { category: 'Viagens', limit: 300 }
    ];

    let created = 0;
    let updated = 0;
    for (const budget of defaultBudgets) {
      try {
        const existing = await db.get(`
          SELECT id, limit_amount FROM budget_limits WHERE user_id = ? AND category = ?
        `, [userId, budget.category]);

        if (!existing) {
          const budgetId = `bl${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
          await db.run(`
            INSERT INTO budget_limits (id, user_id, category, limit_amount, is_default)
            VALUES (?, ?, ?, ?, 1)
          `, [budgetId, userId, budget.category, budget.limit]);
          created++;
          console.log(`Created default budget: ${budget.category} = ${budget.limit} for user ${userId}`);
        } else if (existing.limit_amount !== budget.limit) {
          // Update with correct default value if different
          await db.run(`
            UPDATE budget_limits SET limit_amount = ?, is_default = 1 
            WHERE user_id = ? AND category = ?
          `, [budget.limit, userId, budget.category]);
          updated++;
          console.log(`Updated default budget: ${budget.category} from ${existing.limit_amount} to ${budget.limit} for user ${userId}`);
        }
      } catch (e) {
        console.error(`Failed to create/update budget for ${budget.category}:`, e);
      }
    }

    console.log(`✅ Created ${created}/${defaultBudgets.length} default budgets, Updated ${updated} for user ${userId}`);
    res.json({ message: `Created ${created}, Updated ${updated} default budgets`, created, updated });
  } catch (error: any) {
    console.error('Create default budgets error:', error);
    res.status(500).json({ error: 'Failed to create default budgets', details: error.message });
  }
});

router.post('/limits', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { category, limit } = req.body;

    if (!category || limit === undefined) {
      return res.status(400).json({ error: 'Category and limit are required' });
    }

    const existing = await db.get(`
      SELECT * FROM budget_limits WHERE user_id = ? AND category = ?
    `, [userId, category]);

    if (existing) {
      await db.run(`
        UPDATE budget_limits SET limit_amount = ? WHERE user_id = ? AND category = ?
      `, [limit, userId, category]);
    } else {
      const id = `bl${Date.now()}`;
      await db.run(`
        INSERT INTO budget_limits (id, user_id, category, limit_amount)
        VALUES (?, ?, ?, ?)
      `, [id, userId, category, limit]);
    }

    res.json({ category, limit });
  } catch (error: any) {
    console.error('Set budget limit error:', error);
    res.status(500).json({ error: 'Failed to set budget limit' });
  }
});

router.delete('/limits/:category', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category);

    // Verifica se é um orçamento padrão (não pode deletar)
    const budget = await db.get(`
      SELECT is_default FROM budget_limits WHERE user_id = ? AND category = ?
    `, [userId, decodedCategory]);

    if (budget?.is_default === 1) {
      return res.status(403).json({ error: 'Não pode deletar orçamentos padrão' });
    }

    // Realoca todas as transações desta categoria para "Geral"
    await db.run(`
      UPDATE transactions SET category = ? WHERE user_id = ? AND category = ?
    `, ['Geral', userId, decodedCategory]);

    // Deleta o orçamento
    await db.run(`
      DELETE FROM budget_limits WHERE user_id = ? AND category = ?
    `, [userId, decodedCategory]);

    res.json({ message: 'Budget deleted and transactions moved to Geral' });
  } catch (error: any) {
    console.error('Delete budget limit error:', error);
    res.status(500).json({ error: 'Failed to delete budget limit' });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const user = req.session.user;

    const currentMonth = new Date().toISOString().slice(0, 7);

    let transactions;
    // Despesas simples + assinaturas/recorrências do mês atual
    if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
      transactions = await db.all(`
        SELECT category, SUM(amount) as total
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE u.family_id = ? AND type = 'DESPESA' AND (date LIKE ? OR (is_recurring = 1 AND date <= ?))
        GROUP BY category
      `, [user.familyId, `${currentMonth}%`, new Date().toISOString().split('T')[0]]);
    } else {
      transactions = await db.all(`
        SELECT category, SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'DESPESA' AND (date LIKE ? OR (is_recurring = 1 AND date <= ?))
        GROUP BY category
      `, [userId, `${currentMonth}%`, new Date().toISOString().split('T')[0]]);
    }

    const limits = await db.all(`
      SELECT * FROM budget_limits WHERE user_id = ?
    `, [userId]);

    const summary = limits.map((l: any) => {
      const spent = (transactions as any[]).find(t => t.category === l.category);
      return {
        category: l.category,
        limit: l.limit_amount,
        spent: spent ? spent.total : 0,
        percentage: spent ? Math.round((spent.total / l.limit_amount) * 100) : 0
      };
    });

    res.json(summary);
  } catch (error: any) {
    console.error('Get budget summary error:', error);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
});

// Get budget history for all months
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    
    const history = await db.all(`
      SELECT * FROM budget_history 
      WHERE user_id = ? 
      ORDER BY month DESC 
      LIMIT 12
    `, [userId]);

    const grouped = history.reduce((acc: any, row: any) => {
      if (!acc[row.month]) {
        acc[row.month] = [];
      }
      acc[row.month].push({
        category: row.category,
        limit: row.limit_amount,
        spent: row.spent_amount
      });
      return acc;
    }, {});

    res.json(grouped);
  } catch (error: any) {
    console.error('Get budget history error:', error);
    res.status(500).json({ error: 'Failed to fetch budget history' });
  }
});

// Save current month to history (called at end of month or manually)
router.post('/history/save', async (req: Request, res: Response) => {
  const userId = req.session.userId;
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const limits = await db.all(`
      SELECT * FROM budget_limits WHERE user_id = ?
    `, [userId]);

    const transactions = await db.all(`
      SELECT category, SUM(amount) as total
      FROM transactions
      WHERE user_id = ? AND type = 'DESPESA' AND date LIKE ?
      GROUP BY category
    `, [userId, `${currentMonth}%`]);

    let saved = 0;
    for (const limit of limits) {
      const spent = transactions.find(t => t.category === limit.category);
      const id = `bh${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      await db.run(`
        INSERT OR REPLACE INTO budget_history (id, user_id, category, month, limit_amount, spent_amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, userId, limit.category, currentMonth, limit.limit_amount, spent ? spent.total : 0]);
      
      saved++;
    }

    res.json({ message: `Histórico de ${saved} categorias salvo para ${currentMonth}` });
  } catch (error) {
    console.error('Save budget history error:', error);
    res.status(500).json({ error: 'Erro ao salvar histórico' });
  }
});

// Get system default budget categories (Super Admin only)
router.get('/defaults', async (req: Request, res: Response) => {
  if (req.session?.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin only' });
  }

  try {
    const defaults = await db.all(`
      SELECT key, value FROM app_settings WHERE key LIKE 'budget_default_%' ORDER BY key
    `);
    
    const formatted = defaults.map(d => {
      const [_, category] = d.key.split('budget_default_');
      return {
        category: decodeURIComponent(category),
        limit: parseInt(d.value)
      };
    });

    res.json(formatted.length > 0 ? formatted : getSystemDefaults());
  } catch (error: any) {
    console.error('Get budget defaults error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save system default budget categories (Super Admin only)
router.post('/defaults', async (req: Request, res: Response) => {
  if (req.session?.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin only' });
  }

  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Invalid format' });
    }

    // Clear existing defaults
    await db.run(`DELETE FROM app_settings WHERE key LIKE 'budget_default_%'`);

    // Save new defaults
    for (const cat of categories) {
      const key = `budget_default_${encodeURIComponent(cat.category)}`;
      await db.run(`
        INSERT INTO app_settings (key, value) VALUES (?, ?)
      `, [key, cat.limit.toString()]);
    }

    console.log(`✅ Updated ${categories.length} system budget defaults`);
    res.json({ success: true, message: `Updated ${categories.length} defaults` });
  } catch (error: any) {
    console.error('Save budget defaults error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset budgets - delete all duplicates and recreate from scratch
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Delete ALL budgets for this user
    await db.run(`DELETE FROM budget_limits WHERE user_id = ?`, [userId]);
    
    // Recreate the 16 default budgets
    const defaultBudgets = getSystemDefaults();
    let created = 0;

    for (const budget of defaultBudgets) {
      const budgetId = `bl${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      await db.run(`
        INSERT INTO budget_limits (id, user_id, category, limit_amount, is_default)
        VALUES (?, ?, ?, ?, 1)
      `, [budgetId, userId, budget.category, budget.limit]);
      created++;
    }

    console.log(`✅ Reset budgets for user ${userId}: Deleted old, created ${created} new budgets`);
    res.json({ message: `Reset complete. Created ${created} default budgets`, created });
  } catch (error: any) {
    console.error('Reset budgets error:', error);
    res.status(500).json({ error: 'Failed to reset budgets', details: error.message });
  }
});

function getSystemDefaults() {
  return [
    { category: 'Renda', limit: 0 },
    { category: 'Energia', limit: 150 },
    { category: 'Água', limit: 80 },
    { category: 'Transporte', limit: 200 },
    { category: 'Alimentação', limit: 300 },
    { category: 'Combustível', limit: 200 },
    { category: 'Compras domésticas', limit: 150 },
    { category: 'Lazer', limit: 150 },
    { category: 'Roupas', limit: 100 },
    { category: 'Saúde', limit: 200 },
    { category: 'Cuidados pessoais', limit: 80 },
    { category: 'Reparação', limit: 150 },
    { category: 'Manutenção', limit: 150 },
    { category: 'Presentes', limit: 100 },
    { category: 'Eventos', limit: 200 },
    { category: 'Viagens', limit: 300 }
  ];
}

export default router;
