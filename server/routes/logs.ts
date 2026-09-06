import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get recent verification logs
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = 'SELECT * FROM verification_logs WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` AND result_status = $${params.length}`;
    }

    query += ` ORDER BY verified_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit) || 50);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch logs error:', error);
    res.status(500).json({ error: 'Failed to fetch verification logs' });
  }
});

export default router;
