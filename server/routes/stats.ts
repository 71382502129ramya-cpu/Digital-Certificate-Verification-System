import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/overview', async (_req, res) => {
  try {
    const certCountRes = await db.query(`
      SELECT 
        COUNT(*) as total_certs,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_certs,
        COUNT(CASE WHEN status = 'Revoked' THEN 1 END) as revoked_certs,
        COUNT(CASE WHEN status = 'Tampered' THEN 1 END) as tampered_certs
      FROM certificates
    `);

    const userCountRes = await db.query(`
      SELECT 
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'issuer' THEN 1 END) as total_issuers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
      FROM users
    `);

    const institutionCountRes = await db.query('SELECT COUNT(*) as total_institutions FROM institutions');
    const eventCountRes = await db.query('SELECT COUNT(*) as total_events FROM events');
    const logsCountRes = await db.query(`
      SELECT 
        COUNT(*) as total_verifications,
        COUNT(CASE WHEN result_status = 'Active' THEN 1 END) as successful_verifications,
        COUNT(CASE WHEN result_status IN ('Invalid', 'Tampered', 'Revoked') THEN 1 END) as flagged_verifications
      FROM verification_logs
    `);

    const pendingUploadsRes = await db.query(`
      SELECT COUNT(*) as pending_uploads FROM uploaded_certificates WHERE status = 'pending'
    `);

    res.json({
      certificates: certCountRes.rows[0],
      users: userCountRes.rows[0],
      institutions: institutionCountRes.rows[0],
      events: eventCountRes.rows[0],
      verifications: logsCountRes.rows[0],
      pendingUploads: (pendingUploadsRes.rows[0] as any)?.pending_uploads || 0
    });
  } catch (error: any) {
    console.error('Stats overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
