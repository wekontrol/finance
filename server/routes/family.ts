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

router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const user = req.session.user;

    const tasks = await db.all(`
      SELECT t.*, u.name as assigned_to_name
      FROM family_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.family_id = ?
      ORDER BY t.due_date ASC
    `, [user.familyId]);

    const formattedTasks = tasks.map((t: any) => ({
      id: t.id,
      description: t.description,
      assignedTo: t.assigned_to,
      assignedToName: t.assigned_to_name,
      isCompleted: !!t.is_completed,
      dueDate: t.due_date
    }));

    res.json(formattedTasks);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const user = req.session.user;
    const { description, assignedTo, dueDate } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const id = `task${Date.now()}`;
    
    await db.run(`
      INSERT INTO family_tasks (id, family_id, description, assigned_to, due_date)
      VALUES (?, ?, ?, ?, ?)
    `, [id, user.familyId, description, assignedTo || null, dueDate || null]);

    const task = await db.get(`
      SELECT t.*, u.name as assigned_to_name
      FROM family_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `, [id]);
    
    res.status(201).json({
      id: task.id,
      description: task.description,
      assignedTo: task.assigned_to,
      assignedToName: task.assigned_to_name,
      isCompleted: false,
      dueDate: task.due_date
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, assignedTo, isCompleted, dueDate } = req.body;

    const existing = await db.get('SELECT * FROM family_tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.run(`
      UPDATE family_tasks 
      SET description = ?, assigned_to = ?, is_completed = ?, due_date = ?
      WHERE id = ?
    `, [description, assignedTo || null, isCompleted ? 1 : 0, dueDate || null, id]);

    const task = await db.get(`
      SELECT t.*, u.name as assigned_to_name
      FROM family_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `, [id]);
    
    res.json({
      id: task.id,
      description: task.description,
      assignedTo: task.assigned_to,
      assignedToName: task.assigned_to_name,
      isCompleted: !!task.is_completed,
      dueDate: task.due_date
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM family_tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.run('DELETE FROM family_tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.get('/events', async (req: Request, res: Response) => {
  try {
    const user = req.session.user;

    const events = await db.all(`
      SELECT * FROM family_events WHERE family_id = ? ORDER BY date ASC
    `, [user.familyId]);

    const formattedEvents = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      type: e.type,
      description: e.description
    }));

    res.json(formattedEvents);
  } catch (error: any) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events', async (req: Request, res: Response) => {
  try {
    const user = req.session.user;
    const { title, date, type, description } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const id = `event${Date.now()}`;
    
    await db.run(`
      INSERT INTO family_events (id, family_id, title, date, type, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, user.familyId, title, date, type || 'general', description || null]);

    const event = await db.get('SELECT * FROM family_events WHERE id = ?', [id]);
    
    res.status(201).json({
      id: event.id,
      title: event.title,
      date: event.date,
      type: event.type,
      description: event.description
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, date, type, description } = req.body;

    const existing = await db.get('SELECT * FROM family_events WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await db.run(`
      UPDATE family_events 
      SET title = ?, date = ?, type = ?, description = ?
      WHERE id = ?
    `, [title, date, type, description, id]);

    const event = await db.get('SELECT * FROM family_events WHERE id = ?', [id]);
    
    res.json({
      id: event.id,
      title: event.title,
      date: event.date,
      type: event.type,
      description: event.description
    });
  } catch (error: any) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM family_events WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await db.run('DELETE FROM family_events WHERE id = ?', [id]);
    res.json({ message: 'Event deleted' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
