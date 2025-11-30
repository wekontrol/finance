import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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
  const user = req.session.user;

  let users;
  if (user.role === 'SUPER_ADMIN') {
    users = db.prepare(`
      SELECT id, username, name, role, avatar, status, created_by, family_id, birth_date, allow_parent_view
      FROM users
    `).all();
  } else if (user.role === 'MANAGER') {
    users = db.prepare(`
      SELECT id, username, name, role, avatar, status, created_by, family_id, birth_date, allow_parent_view
      FROM users WHERE family_id = ?
    `).all(user.familyId);
  } else {
    users = db.prepare(`
      SELECT id, username, name, role, avatar, status, family_id
      FROM users WHERE id = ?
    `).all(req.session.userId);
  }

  const formattedUsers = users.map((u: any) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    avatar: u.avatar,
    status: u.status,
    createdBy: u.created_by,
    familyId: u.family_id,
    birthDate: u.birth_date,
    allowParentView: !!u.allow_parent_view
  }));

  res.json(formattedUsers);
});

router.post('/', (req: Request, res: Response) => {
  const currentUser = req.session.user;
  const { username, password, name, role, birthDate, allowParentView } = req.body;

  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Not authorized to create users' });
  }

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const id = `u${Date.now()}`;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Orçamentos padrão por categoria
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
    { category: 'Juros / Multas', limit: 100 },
    { category: 'Reparações e Manutenção', limit: 150 },
    { category: 'Presentes', limit: 100 },
    { category: 'Eventos', limit: 200 },
    { category: 'Viagens', limit: 300 }
  ];

  db.prepare(`
    INSERT INTO users (id, username, password, name, role, avatar, status, created_by, family_id, birth_date, allow_parent_view)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    username,
    hashedPassword,
    name,
    role || 'MEMBER',
    '/default-avatar.svg',
    'APPROVED',
    req.session.userId,
    currentUser.familyId,
    birthDate || null,
    allowParentView ? 1 : 0
  );

  // Cria orçamentos padrão para o novo usuário
  defaultBudgets.forEach((budget: any) => {
    const budgetId = `bl${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    db.prepare(`
      INSERT INTO budget_limits (id, user_id, category, limit_amount, is_default)
      VALUES (?, ?, ?, ?, 1)
    `).run(budgetId, id, budget.category, budget.limit);
  });

  const user = db.prepare(`
    SELECT id, username, name, role, avatar, status, created_by, family_id, birth_date, allow_parent_view
    FROM users WHERE id = ?
  `).get(id) as any;

  res.status(201).json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    status: user.status,
    createdBy: user.created_by,
    familyId: user.family_id,
    birthDate: user.birth_date,
    allowParentView: !!user.allow_parent_view
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.session.user;
  const { name, role, status, birthDate, allowParentView, password } = req.body;

  const isOwnProfile = id === req.session.userId;
  const canEdit = currentUser.role === 'SUPER_ADMIN' || 
                  currentUser.role === 'MANAGER' || 
                  isOwnProfile;

  if (!canEdit) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  let updateQuery = 'UPDATE users SET name = ?';
  let params: any[] = [name || existing.name];

  if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MANAGER') {
    if (role) {
      updateQuery += ', role = ?';
      params.push(role);
    }
    if (status) {
      updateQuery += ', status = ?';
      params.push(status);
    }
  }

  if (birthDate !== undefined) {
    updateQuery += ', birth_date = ?';
    params.push(birthDate);
  }

  if (allowParentView !== undefined) {
    updateQuery += ', allow_parent_view = ?';
    params.push(allowParentView ? 1 : 0);
  }

  if (password) {
    updateQuery += ', password = ?';
    params.push(bcrypt.hashSync(password, 10));
  }

  updateQuery += ' WHERE id = ?';
  params.push(id);

  db.prepare(updateQuery).run(...params);

  const user = db.prepare(`
    SELECT id, username, name, role, avatar, status, created_by, family_id, birth_date, allow_parent_view
    FROM users WHERE id = ?
  `).get(id) as any;

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    status: user.status,
    createdBy: user.created_by,
    familyId: user.family_id,
    birthDate: user.birth_date,
    allowParentView: !!user.allow_parent_view
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.session.user;

  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  if (id === req.session.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'User deleted' });
});

export default router;
