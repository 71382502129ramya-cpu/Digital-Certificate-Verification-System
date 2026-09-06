import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get student points leaderboard
router.get('/', async (req, res) => {
  try {
    const { department, institution } = req.query;
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.department,
        u.institution_name,
        u.roll_number,
        u.points,
        u.tier,
        u.avatar_url,
        (SELECT COUNT(*) FROM certificates c WHERE c.recipient_id = u.id AND c.status = 'Active') as certificates_count,
        (SELECT COUNT(*) FROM uploaded_certificates uc WHERE uc.student_id = u.id AND uc.status = 'approved') as approved_external_count
      FROM users u
      WHERE u.role = 'student' AND u.status = 'active'
    `;
    const params: any[] = [];

    if (department) {
      params.push(department);
      query += ` AND u.department = $${params.length}`;
    }

    if (institution) {
      params.push(institution);
      query += ` AND u.institution_name = $${params.length}`;
    }

    query += ' ORDER BY u.points DESC, certificates_count DESC LIMIT 50';

    const result = await db.query(query, params);
    
    // Add rank numbering
    const ranked = result.rows.map((row: any, index) => ({
      ...(row as Record<string, any>),
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
