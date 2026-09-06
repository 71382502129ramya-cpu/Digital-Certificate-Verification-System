import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const { issuerId, search } = req.query;
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];

    if (issuerId) {
      params.push(issuerId);
      query += ` AND issuer_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (LOWER(title) LIKE LOWER($${params.length}) OR LOWER(institution_name) LIKE LOWER($${params.length}))`;
    }

    query += ' ORDER BY event_date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const { title, description, issuer_id, institution_name, event_type, event_date, points_reward = 50 } = req.body;
    
    if (!title || !institution_name || !event_type || !event_date) {
      return res.status(400).json({ error: 'Missing required event fields' });
    }

    const id = `evt-${Date.now().toString(36)}`;
    await db.query(
      `INSERT INTO events (id, title, description, issuer_id, institution_name, event_type, event_date, points_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, title.trim(), description || null, issuer_id || null, institution_name.trim(), event_type, event_date, points_reward]
    );

    const created = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    res.status(201).json(created.rows[0]);
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
