import { Router } from 'express';
import { db, calculateCertificateHash } from '../db';
import QRCode from 'qrcode';
import crypto from 'crypto';

const router = Router();

// Helper to update student tier based on points
async function updateStudentPointsAndTier(studentId: string, additionalPoints: number) {
  if (!studentId) return;
  
  const userRes = await db.query('SELECT points FROM users WHERE id = $1', [studentId]);
  if (userRes.rows.length === 0) return;

  const currentPoints = (userRes.rows[0] as any).points || 0;
  const newPoints = Math.max(0, currentPoints + additionalPoints);

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

// List certificates
router.get('/', async (req, res) => {
  try {
    const { studentId, studentEmail, issuerId, status, search } = req.query;
    let query = 'SELECT * FROM certificates WHERE 1=1';
    const params: any[] = [];

    if (studentId) {
      params.push(studentId);
      query += ` AND recipient_id = $${params.length}`;
    }

    if (studentEmail) {
      params.push(String(studentEmail).toLowerCase());
      query += ` AND LOWER(recipient_email) = $${params.length}`;
    }

    if (issuerId) {
      params.push(issuerId);
      query += ` AND issuer_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      query += ` AND (LOWER(title) LIKE LOWER($${pIdx}) OR LOWER(recipient_name) LIKE LOWER($${pIdx}) OR LOWER(id) LIKE LOWER($${pIdx}) OR LOWER(event_title) LIKE LOWER($${pIdx}))`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Issue a new digital certificate
router.post('/', async (req, res) => {
  try {
    const {
      title,
      recipient_id,
      recipient_name,
      recipient_email,
      recipient_roll,
      issuer_id,
      issuer_name,
      institution_name,
      event_id,
      event_title,
      issue_date,
      expiry_date,
      grade,
      certificate_type = 'Achievement',
      metadata
    } = req.body;

    if (!title || !recipient_name || !recipient_email || !issuer_name || !institution_name || !issue_date) {
      return res.status(400).json({ error: 'Missing required certificate fields' });
    }

    // Auto-resolve recipient_id if not supplied by searching email or roll number
    let finalRecipientId = recipient_id;
    if (!finalRecipientId && recipient_email) {
      const studentMatch = await db.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
        [recipient_email.trim()]
      );
      if (studentMatch.rows.length > 0) {
        finalRecipientId = (studentMatch.rows[0] as any).id;
      }
    }

    // Generate Unique Certificate ID: e.g. CERT-2026-NITS-A4F9
    const year = new Date(issue_date).getFullYear() || 2026;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const instCode = (institution_name.split(' ').map((w: string) => w[0]).join('').substring(0, 4) || 'CERT').toUpperCase();
    const certificateId = `CERT-${year}-${instCode}-${randomHex}`;

    // Cryptographic SHA-256 Hash
    const sha256_hash = calculateCertificateHash({
      certificateId,
      recipientEmail: recipient_email.trim().toLowerCase(),
      issuerName: issuer_name.trim(),
      eventTitle: event_title || title,
      issueDate: issue_date
    });

    // Generate verification QR code data
    // Contains JSON or clean verification URL string
    const verificationPayload = JSON.stringify({
      id: certificateId,
      hash: sha256_hash,
      recipient: recipient_name,
      org: institution_name,
      verifyUrl: `/verify?id=${certificateId}`
    });

    const qr_code_data = await QRCode.toDataURL(verificationPayload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    // Save to PostgreSQL
    await db.query(
      `INSERT INTO certificates (
        id, title, recipient_id, recipient_name, recipient_email, recipient_roll,
        issuer_id, issuer_name, institution_name, event_id, event_title,
        issue_date, expiry_date, grade, certificate_type, sha256_hash,
        qr_code_data, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'Active', $18)`,
      [
        certificateId,
        title.trim(),
        finalRecipientId || null,
        recipient_name.trim(),
        recipient_email.trim().toLowerCase(),
        recipient_roll || null,
        issuer_id || null,
        issuer_name.trim(),
        institution_name.trim(),
        event_id || null,
        event_title || title.trim(),
        issue_date,
        expiry_date || null,
        grade || 'Distinction',
        certificate_type,
        sha256_hash,
        qr_code_data,
        metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null
      ]
    );

    // Award points to student if associated
    if (finalRecipientId) {
      let pointsAward = 50;
      if (certificate_type === 'Excellence') pointsAward = 100;
      else if (certificate_type === 'Achievement') pointsAward = 75;
      else if (certificate_type === 'Completion') pointsAward = 50;
      else if (certificate_type === 'Participation') pointsAward = 30;

      await updateStudentPointsAndTier(finalRecipientId, pointsAward);
    }

    // Return the created certificate
    const createdCert = await db.query('SELECT * FROM certificates WHERE id = $1', [certificateId]);
    res.status(201).json(createdCert.rows[0]);
  } catch (error: any) {
    console.error('Issue certificate error:', error);
    res.status(500).json({ error: 'Failed to issue digital certificate' });
  }
});

// Public Verification Endpoint
// Accessible by anyone using Certificate ID or SHA-256 Hash
router.get('/verify/:idOrHash', async (req, res) => {
  try {
    const rawParam = req.params.idOrHash.trim();
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const method = req.query.method ? String(req.query.method) : (rawParam.length === 64 ? 'hash' : 'id');

    // Search by ID or SHA-256 Hash
    const result = await db.query(
      `SELECT * FROM certificates WHERE LOWER(id) = LOWER($1) OR LOWER(sha256_hash) = LOWER($1)`,
      [rawParam]
    );

    if (result.rows.length === 0) {
      // Log failed / invalid verification
      const logId = `log-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      await db.query(
        `INSERT INTO verification_logs (id, certificate_id, sha256_hash, verification_method, result_status, verifier_ip, details)
         VALUES ($1, $2, NULL, $3, 'Invalid', $4, 'Certificate query failed: No record found with this identifier.')`,
        [logId, rawParam, method, String(clientIp)]
      );

      return res.status(404).json({
        verified: false,
        status: 'Invalid',
        message: 'No certificate found with the provided Certificate ID or SHA-256 Hash. The document may be fraudulent or expired.'
      });
    }

    const cert = result.rows[0] as any;

    // Cryptographic SHA-256 Integrity Verification:
    // Recompute the expected hash from certificate parameters and verify against stored hash
    const recomputedHash = calculateCertificateHash({
      certificateId: cert.id,
      recipientEmail: cert.recipient_email,
      issuerName: cert.issuer_name,
      eventTitle: cert.event_title || cert.title,
      issueDate: typeof cert.issue_date === 'string' ? cert.issue_date.split('T')[0] : new Date(cert.issue_date).toISOString().split('T')[0]
    });

    let finalStatus = cert.status;
    let tamperDetected = false;

    // If database status is not Revoked, but cryptographic hash has mismatch, mark as Tampered
    if (cert.status !== 'Revoked' && cert.sha256_hash !== recomputedHash) {
      finalStatus = 'Tampered';
      tamperDetected = true;
    }

    // Log verification check
    const logId = `log-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    let logDetail = `Verified via ${method.toUpperCase()} lookup. Status: ${finalStatus}.`;
    if (tamperDetected) {
      logDetail += ' WARNING: Cryptographic hash mismatch detected! Potential tampering.';
    } else if (finalStatus === 'Revoked') {
      logDetail += ` Certificate was revoked on ${cert.revoked_at}. Reason: ${cert.revocation_reason}`;
    }

    await db.query(
      `INSERT INTO verification_logs (id, certificate_id, sha256_hash, verification_method, result_status, verifier_ip, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [logId, cert.id, cert.sha256_hash, method, finalStatus, String(clientIp), logDetail]
    );

    res.json({
      verified: finalStatus === 'Active',
      status: finalStatus,
      certificate: cert,
      cryptographicAudit: {
        storedHash: cert.sha256_hash,
        recomputedHash: recomputedHash,
        hashAlgorithm: 'SHA-256',
        isCryptographicallySound: cert.sha256_hash === recomputedHash,
        verificationTimestamp: new Date().toISOString()
      },
      revocationInfo: finalStatus === 'Revoked' ? {
        revokedAt: cert.revoked_at,
        reason: cert.revocation_reason
      } : null
    });
  } catch (error: any) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// Tamper simulation / custom hash check endpoint
router.post('/verify-tamper-check', async (req, res) => {
  try {
    const { certificateId, recipientEmail, issuerName, eventTitle, issueDate, providedHash } = req.body;

    if (!certificateId || !recipientEmail || !issuerName || !issueDate) {
      return res.status(400).json({ error: 'Missing parameters for hash audit' });
    }

    const calculated = calculateCertificateHash({
      certificateId,
      recipientEmail: recipientEmail.trim().toLowerCase(),
      issuerName: issuerName.trim(),
      eventTitle: eventTitle || '',
      issueDate: issueDate.split('T')[0]
    });

    const isMatch = providedHash ? providedHash.toLowerCase() === calculated.toLowerCase() : true;

    res.json({
      certificateId,
      calculatedSha256: calculated,
      providedHash: providedHash || null,
      isAuthentic: isMatch,
      status: isMatch ? 'Active' : 'Tampered',
      notes: isMatch 
        ? 'Digital signature and content hash match cryptographic record.' 
        : 'Discrepancy detected: content attributes do not generate the claimed SHA-256 hash.'
    });
  } catch (error: any) {
    console.error('Tamper check error:', error);
    res.status(500).json({ error: 'Failed to execute tamper check' });
  }
});

// Update Certificate Status (e.g. Revoke, or mark Tampered / Active)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, revocation_reason } = req.body;

    if (!['Active', 'Revoked', 'Tampered', 'Invalid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const revokedAt = status === 'Revoked' ? new Date().toISOString() : null;

    await db.query(
      `UPDATE certificates 
       SET status = $1, revocation_reason = $2, revoked_at = $3
       WHERE id = $4`,
      [status, revocation_reason || null, revokedAt, id]
    );

    const updated = await db.query('SELECT * FROM certificates WHERE id = $1', [id]);
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(updated.rows[0]);
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update certificate status' });
  }
});

// Delete certificate (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM certificates WHERE id = $1', [id]);
    res.json({ success: true, message: `Certificate ${id} deleted successfully` });
  } catch (error: any) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

export default router;
