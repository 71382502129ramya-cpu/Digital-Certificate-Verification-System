import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';

const router = Router();

// Setup Multer storage
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `cert-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are accepted.'));
    }
  }
});

// Helper to award student points
async function awardStudentPoints(studentId: string, points: number) {
  if (!studentId || points <= 0) return;
  const userRes = await db.query('SELECT points FROM users WHERE id = $1', [studentId]);
  if (userRes.rows.length === 0) return;

  const currentPoints = (userRes.rows[0] as any).points || 0;
  const newPoints = currentPoints + points;

  let newTier = 'Bronze';
  if (newPoints >= 500) newTier = 'Diamond';
  else if (newPoints >= 350) newTier = 'Platinum';
  else if (newPoints >= 250) newTier = 'Gold';
  else if (newPoints >= 150) newTier = 'Silver';

  await db.query(
    'UPDATE users SET points = $1, tier = $2 WHERE id = $3',
    [newPoints, newTier, studentId]
  );
}

// Get uploaded certificates (filter by student_id or status)
router.get('/', async (req, res) => {
  try {
    const { studentId, status } = req.query;
    let query = 'SELECT * FROM uploaded_certificates WHERE 1=1';
    const params: any[] = [];

    if (studentId) {
      params.push(studentId);
      query += ` AND student_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch uploaded certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch uploaded certificates' });
  }
});

// Student upload certificate
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { student_id, student_name, title, issuing_organization, issue_date, category } = req.body;

    if (!title || !issuing_organization || !issue_date) {
      return res.status(400).json({ error: 'Title, issuing organization, and issue date are required' });
    }

    let fileUrl = '/uploads/sample-gcp-cert.pdf';
    let fileName = 'certificate-proof.pdf';
    let fileType = 'application/pdf';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
    }

    const id = `upl-${Date.now().toString(36)}`;
    await db.query(
      `INSERT INTO uploaded_certificates (
        id, student_id, student_name, title, issuing_organization, issue_date,
        category, file_url, file_name, file_type, status, points_awarded
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 0)`,
      [
        id,
        student_id || null,
        student_name || 'Student',
        title.trim(),
        issuing_organization.trim(),
        issue_date,
        category || 'External Credential',
        fileUrl,
        fileName,
        fileType
      ]
    );

    const created = await db.query('SELECT * FROM uploaded_certificates WHERE id = $1', [id]);
    res.status(201).json(created.rows[0]);
  } catch (error: any) {
    console.error('Upload certificate error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload certificate' });
  }
});

// Review uploaded certificate (Admin or Issuer approval/rejection)
router.patch('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, points_awarded = 0, review_notes, reviewer_name } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved, rejected, or pending' });
    }

    const currentRes = await db.query('SELECT * FROM uploaded_certificates WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Uploaded certificate record not found' });
    }

    const cert = currentRes.rows[0] as any;
    const numericPoints = Number(points_awarded) || 0;

    await db.query(
      `UPDATE uploaded_certificates 
       SET status = $1, points_awarded = $2, review_notes = $3, reviewed_by = $4, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [status, numericPoints, review_notes || null, reviewer_name || 'Administrator', id]
    );

    // If approved and has points, award to student!
    if (status === 'approved' && numericPoints > 0 && cert.student_id) {
      await awardStudentPoints(cert.student_id, numericPoints);
    }

    const updated = await db.query('SELECT * FROM uploaded_certificates WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (error: any) {
    console.error('Review upload error:', error);
    res.status(500).json({ error: 'Failed to review certificate' });
  }
});

export default router;
