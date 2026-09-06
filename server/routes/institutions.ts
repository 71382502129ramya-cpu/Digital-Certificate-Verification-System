import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get all institutions
router.get('/', async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM institutions ORDER BY name ASC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch institutions error:', error);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

// Create new institution
router.post('/', async (req, res) => {
  try {
    const { name, code, category, contact_email, website, logo_url, verified = true } = req.body;
    if (!name || !code || !contact_email) {
      return res.status(400).json({ error: 'Name, code, and contact email are required' });
    }

    const id = `inst-${Date.now().toString(36)}`;
    await db.query(
      `INSERT INTO institutions (id, name, code, category, contact_email, website, logo_url, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, name.trim(), code.trim().toUpperCase(), category || 'Autonomous College', contact_email.trim(), website || null, logo_url || null, verified]
    );

    const created = await db.query('SELECT * FROM institutions WHERE id = $1', [id]);
    res.status(201).json(created.rows[0]);
  } catch (error: any) {
    console.error('Create institution error:', error);
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

// Update verification status
router.patch('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    await db.query('UPDATE institutions SET verified = $1 WHERE id = $2', [verified, id]);
    const updated = await db.query('SELECT * FROM institutions WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (error: any) {
    console.error('Update institution error:', error);
    res.status(500).json({ error: 'Failed to update institution' });
  }
});

export default router;
