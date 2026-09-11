import { Pool } from 'pg';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Supabase / PostgreSQL connection.
// Add DATABASE_URL in Render Environment Variables.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

// Compatibility wrapper for the existing routes.
export const db = {
  query: (text: string, values?: unknown[]) => pool.query(text, values),
  exec: (text: string) => pool.query(text),
};

export function calculateCertificateHash(data: {
  certificateId: string;
  recipientEmail: string;
  issuerName: string;
  eventTitle: string;
  issueDate: string;
  secretSalt?: string;
}): string {
  const salt = data.secretSalt || 'CERT_SALT_2026_SECURE_KEY';
  const payload = `${data.certificateId}|${data.recipientEmail}|${data.issuerName}|${data.eventTitle}|${data.issueDate}|${salt}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function initDatabase() {
  console.log('Initializing PostgreSQL database...');

  // Create Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'issuer', 'admin')),
      department TEXT,
      institution_name TEXT,
      roll_number TEXT,
      points INTEGER DEFAULT 0,
      tier TEXT DEFAULT 'Bronze',
      avatar_url TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Institutions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      website TEXT,
      logo_url TEXT,
      verified BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      issuer_id TEXT REFERENCES users(id),
      institution_name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_date DATE NOT NULL,
      points_reward INTEGER DEFAULT 50,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Certificates table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      recipient_id TEXT REFERENCES users(id),
      recipient_name TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      recipient_roll TEXT,
      issuer_id TEXT REFERENCES users(id),
      issuer_name TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      event_id TEXT REFERENCES events(id),
      event_title TEXT,
      issue_date DATE NOT NULL,
      expiry_date DATE,
      grade TEXT,
      certificate_type TEXT NOT NULL,
      sha256_hash TEXT NOT NULL UNIQUE,
      qr_code_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Revoked', 'Tampered', 'Invalid')),
      revocation_reason TEXT,
      revoked_at TIMESTAMP WITH TIME ZONE,
      metadata TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Uploaded Certificates table (student external uploads)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS uploaded_certificates (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id),
      student_name TEXT NOT NULL,
      title TEXT NOT NULL,
      issuing_organization TEXT NOT NULL,
      issue_date DATE NOT NULL,
      category TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      points_awarded INTEGER DEFAULT 0,
      review_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Verification Logs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS verification_logs (
      id TEXT PRIMARY KEY,
      certificate_id TEXT,
      sha256_hash TEXT,
      verification_method TEXT NOT NULL,
      result_status TEXT NOT NULL,
      verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verifier_ip TEXT,
      details TEXT
    );
  `);

  // Seed sample data if empty
  const userCheck = await db.query('SELECT count(*) as count FROM users');
  const userCount = parseInt((userCheck.rows[0] as any).count, 10);

  if (userCount === 0) {
    console.log('Seeding initial database with sample data...');

    // Seed Institutions
    await db.query(`
      INSERT INTO institutions (id, name, code, category, contact_email, website, logo_url, verified)
      VALUES 
        ('inst-1', 'National Institute of Technology & Sciences', 'NITS-01', 'University', 'registrar@nits.edu', 'https://nits.edu', 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150', true),
        ('inst-2', 'SRIT College of Engineering & Research', 'SRIT-02', 'Autonomous College', 'verify@sritcbe.ac.in', 'https://sritcbe.ac.in', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150', true),
        ('inst-3', 'Global AI & Cloud Academy', 'GAICA-03', 'Accredited Academy', 'certifications@gaica.org', 'https://gaica.org', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150', true)
    `);

    // Seed Users (Admin, Issuers, Students)
    await db.query(`
      INSERT INTO users (id, name, email, password, role, department, institution_name, roll_number, points, tier, avatar_url, status)
      VALUES
        ('usr-admin-1', 'Dr. Eleanor Vance', 'admin@certverify.gov', 'admin123', 'admin', 'Central Verification Bureau', 'National Accreditation Council', 'ADM-001', 0, 'Admin', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'active'),
        ('usr-issuer-1', 'Prof. Marcus Brody', 'issuer@nits.edu', 'issuer123', 'issuer', 'Computer Science & Engineering', 'National Institute of Technology & Sciences', 'FAC-CS-101', 120, 'Issuer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'active'),
        ('usr-issuer-2', 'Dr. Priya Sundaram', 'priya@sritcbe.ac.in', 'issuer123', 'issuer', 'Information Technology', 'SRIT College of Engineering & Research', 'FAC-IT-204', 95, 'Issuer', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', 'active'),
        ('usr-student-1', 'Alex Johnson', 'alex.johnson@student.edu', 'student123', 'student', 'Computer Science & Engineering', 'National Institute of Technology & Sciences', '22CS1045', 280, 'Platinum', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'active'),
        ('usr-student-2', 'Ramya Krishnan', '71382502129.ramya@sritcbe.ac.in', 'student123', 'student', 'Information Technology', 'SRIT College of Engineering & Research', '71382502129', 350, 'Diamond', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'active'),
        ('usr-student-3', 'David Chen', 'david.chen@student.edu', 'student123', 'student', 'Data Science & AI', 'National Institute of Technology & Sciences', '22DS2012', 190, 'Gold', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'active'),
        ('usr-student-4', 'Sophia Martinez', 'sophia.m@student.edu', 'student123', 'student', 'Cybersecurity', 'SRIT College of Engineering & Research', '22CY3088', 140, 'Silver', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'active')
    `);

    // Seed Events
    await db.query(`
      INSERT INTO events (id, title, description, issuer_id, institution_name, event_type, event_date, points_reward)
      VALUES
        ('evt-1', 'National Smart India Hackathon 2026', '48-hour state-of-the-art hackathon tackling real-world sustainability and AI challenges.', 'usr-issuer-1', 'National Institute of Technology & Sciences', 'Hackathon', '2026-04-15', 100),
        ('evt-2', 'Advanced Full-Stack Cloud Architecture Workshop', 'Comprehensive hands-on workshop covering microservices, containerization, and distributed databases.', 'usr-issuer-2', 'SRIT College of Engineering & Research', 'Workshop', '2026-05-10', 60),
        ('evt-3', 'Annual AI & Machine Learning Symposium', 'Premier academic symposium presenting cutting-edge research in deep learning and generative models.', 'usr-issuer-1', 'National Institute of Technology & Sciences', 'Conference', '2026-03-20', 80),
        ('evt-4', 'Quantum Computing Fundamentals Certification', 'Rigorous 6-week certification covering qubits, quantum algorithms, and Qiskit programming.', 'usr-issuer-2', 'Global AI & Cloud Academy', 'Course', '2026-02-28', 120)
    `);

    // Seed Certificates with genuine calculated SHA-256 hashes
    const cert1Id = 'CERT-2026-NITS-8841';
    const cert1Hash = calculateCertificateHash({
      certificateId: cert1Id,
      recipientEmail: '71382502129.ramya@sritcbe.ac.in',
      issuerName: 'Dr. Priya Sundaram',
      eventTitle: 'National Smart India Hackathon 2026',
      issueDate: '2026-04-18'
    });

    const cert2Id = 'CERT-2026-SRIT-4920';
    const cert2Hash = calculateCertificateHash({
      certificateId: cert2Id,
      recipientEmail: 'alex.johnson@student.edu',
      issuerName: 'Prof. Marcus Brody',
      eventTitle: 'Advanced Full-Stack Cloud Architecture Workshop',
      issueDate: '2026-05-12'
    });

    const cert3Id = 'CERT-2026-NITS-1102';
    const cert3Hash = calculateCertificateHash({
      certificateId: cert3Id,
      recipientEmail: '71382502129.ramya@sritcbe.ac.in',
      issuerName: 'Prof. Marcus Brody',
      eventTitle: 'Annual AI & Machine Learning Symposium',
      issueDate: '2026-03-22'
    });

    const cert4Id = 'CERT-2026-REVOKED-9011';
    const cert4Hash = calculateCertificateHash({
      certificateId: cert4Id,
      recipientEmail: 'david.chen@student.edu',
      issuerName: 'Prof. Marcus Brody',
      eventTitle: 'Quantum Computing Fundamentals Certification',
      issueDate: '2026-03-01'
    });

    await db.query(`
      INSERT INTO certificates (
        id, title, recipient_id, recipient_name, recipient_email, recipient_roll,
        issuer_id, issuer_name, institution_name, event_id, event_title,
        issue_date, expiry_date, grade, certificate_type, sha256_hash,
        qr_code_data, status, revocation_reason, revoked_at, metadata
      )
      VALUES
        (
          '${cert1Id}',
          'Certificate of Excellence - 1st Place Winner',
          'usr-student-2',
          'Ramya Krishnan',
          '71382502129.ramya@sritcbe.ac.in',
          '71382502129',
          'usr-issuer-2',
          'Dr. Priya Sundaram',
          'SRIT College of Engineering & Research',
          'evt-1',
          'National Smart India Hackathon 2026',
          '2026-04-18',
          NULL,
          'Distinction (1st Rank)',
          'Excellence',
          '${cert1Hash}',
          'CERT_ID:${cert1Id}|HASH:${cert1Hash}',
          'Active',
          NULL,
          NULL,
          '{"track": "Autonomous AI Systems", "mentor": "Dr. K. Raman", "seal": "Gold Seal of Verification"}'
        ),
        (
          '${cert2Id}',
          'Certificate of Mastery & Completion',
          'usr-student-1',
          'Alex Johnson',
          'alex.johnson@student.edu',
          '22CS1045',
          'usr-issuer-1',
          'Prof. Marcus Brody',
          'National Institute of Technology & Sciences',
          'evt-2',
          'Advanced Full-Stack Cloud Architecture Workshop',
          '2026-05-12',
          NULL,
          'Grade A+',
          'Completion',
          '${cert2Hash}',
          'CERT_ID:${cert2Id}|HASH:${cert2Hash}',
          'Active',
          NULL,
          NULL,
          '{"credits": "4.0 CEU", "topics": "Kubernetes, PostgreSQL, GraphQL"}'
        ),
        (
          '${cert3Id}',
          'Certificate of Outstanding Paper Presentation',
          'usr-student-2',
          'Ramya Krishnan',
          '71382502129.ramya@sritcbe.ac.in',
          '71382502129',
          'usr-issuer-1',
          'Prof. Marcus Brody',
          'National Institute of Technology & Sciences',
          'evt-3',
          'Annual AI & Machine Learning Symposium',
          '2026-03-22',
          NULL,
          'Best Technical Paper',
          'Achievement',
          '${cert3Hash}',
          'CERT_ID:${cert3Id}|HASH:${cert3Hash}',
          'Active',
          NULL,
          NULL,
          '{"paperId": "AIML-2026-441", "citations": 3}'
        ),
        (
          '${cert4Id}',
          'Certificate of Course Completion (Revoked)',
          'usr-student-3',
          'David Chen',
          'david.chen@student.edu',
          '22DS2012',
          'usr-issuer-1',
          'Prof. Marcus Brody',
          'National Institute of Technology & Sciences',
          'evt-4',
          'Quantum Computing Fundamentals Certification',
          '2026-03-01',
          NULL,
          'Grade B',
          'Completion',
          '${cert4Hash}',
          'CERT_ID:${cert4Id}|HASH:${cert4Hash}',
          'Revoked',
          'Revoked due to code plagiarism detected in final capstone assignment review.',
          CURRENT_TIMESTAMP,
          '{"audit_case": "CASE-2026-89"}'
        )
    `);

    // Seed Uploaded Certificates (student external submissions)
    await db.query(`
      INSERT INTO uploaded_certificates (
        id, student_id, student_name, title, issuing_organization, issue_date,
        category, file_url, file_name, file_type, status, points_awarded,
        review_notes, reviewed_by, reviewed_at
      )
      VALUES
        (
          'upl-1',
          'usr-student-2',
          'Ramya Krishnan',
          'Google Cloud Certified Professional Cloud Architect',
          'Google Cloud Platform',
          '2026-01-15',
          'Industry Certification',
          '/uploads/sample-gcp-cert.pdf',
          'ramya_gcp_cloud_architect.pdf',
          'application/pdf',
          'approved',
          100,
          'Verified via Google Cloud certification badge credential ID: GCP-99214.',
          'Prof. Marcus Brody',
          CURRENT_TIMESTAMP
        ),
        (
          'upl-2',
          'usr-student-1',
          'Alex Johnson',
          'AWS Certified Solutions Architect Associate',
          'Amazon Web Services',
          '2026-02-10',
          'Industry Certification',
          '/uploads/sample-aws-cert.pdf',
          'alex_aws_solutions_architect.pdf',
          'application/pdf',
          'approved',
          80,
          'Official validation number verified on AWS credential portal.',
          'Dr. Priya Sundaram',
          CURRENT_TIMESTAMP
        ),
        (
          'upl-3',
          'usr-student-2',
          'Ramya Krishnan',
          'Deep Learning Specialization by Andrew Ng',
          'Coursera / DeepLearning.AI',
          '2026-05-01',
          'Online Course Specialization',
          '/uploads/sample-coursera-cert.pdf',
          'ramya_deeplearning_specialization.pdf',
          'application/pdf',
          'pending',
          0,
          NULL,
          NULL,
          NULL
        ),
        (
          'upl-4',
          'usr-student-4',
          'Sophia Martinez',
          'Certified Ethical Hacker (CEH v12)',
          'EC-Council',
          '2026-04-20',
          'Cybersecurity Certification',
          '/uploads/sample-ceh-cert.pdf',
          'sophia_ceh_credential.pdf',
          'application/pdf',
          'pending',
          0,
          NULL,
          NULL,
          NULL
        )
    `);

    // Seed initial Verification Logs
    await db.query(`
      INSERT INTO verification_logs (id, certificate_id, sha256_hash, verification_method, result_status, verifier_ip, details)
      VALUES
        ('log-1', '${cert1Id}', '${cert1Hash}', 'qr', 'Active', '192.168.1.45', 'Public QR Code scan verification successful. Integrity verified.'),
        ('log-2', '${cert2Id}', '${cert2Hash}', 'id', 'Active', '172.56.21.10', 'Certificate ID lookup verified by hiring manager at Tech Corp.'),
        ('log-3', '${cert4Id}', '${cert4Hash}', 'id', 'Revoked', '10.0.0.8', 'Verification flagged: Certificate has been revoked by issuing institution.')
    `);

    console.log('Sample database successfully seeded!');
  }
}
