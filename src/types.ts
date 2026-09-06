export type UserRole = 'student' | 'issuer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  institution_name?: string;
  roll_number?: string;
  points: number;
  tier: string;
  avatar_url?: string;
  status: 'active' | 'pending' | 'suspended';
  created_at?: string;
}

export type CertificateStatus = 'Active' | 'Revoked' | 'Tampered' | 'Invalid';
export type CertificateType = 'Achievement' | 'Participation' | 'Excellence' | 'Completion' | 'Appreciation';

export interface Certificate {
  id: string;
  title: string;
  recipient_id?: string;
  recipient_name: string;
  recipient_email: string;
  recipient_roll?: string;
  issuer_id?: string;
  issuer_name: string;
  institution_name: string;
  event_id?: string;
  event_title?: string;
  issue_date: string;
  expiry_date?: string;
  grade?: string;
  certificate_type: CertificateType;
  sha256_hash: string;
  qr_code_data: string;
  status: CertificateStatus;
  revocation_reason?: string;
  revoked_at?: string;
  metadata?: string;
  created_at?: string;
}

export interface UploadedCertificate {
  id: string;
  student_id?: string;
  student_name: string;
  title: string;
  issuing_organization: string;
  issue_date: string;
  category: string;
  file_url: string;
  file_name: string;
  file_type: string;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
}

export interface AcademicEvent {
  id: string;
  title: string;
  description?: string;
  issuer_id?: string;
  institution_name: string;
  event_type: string;
  event_date: string;
  points_reward: number;
  created_at?: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  category: string;
  contact_email: string;
  website?: string;
  logo_url?: string;
  verified: boolean;
  created_at?: string;
}

export interface VerificationLog {
  id: string;
  certificate_id?: string;
  sha256_hash?: string;
  verification_method: 'id' | 'qr' | 'file' | 'hash';
  result_status: CertificateStatus;
  verified_at: string;
  verifier_ip?: string;
  details?: string;
}

export interface VerificationResponse {
  verified: boolean;
  status: CertificateStatus;
  certificate?: Certificate;
  message?: string;
  cryptographicAudit?: {
    storedHash: string;
    recomputedHash: string;
    hashAlgorithm: string;
    isCryptographicallySound: boolean;
    verificationTimestamp: string;
  };
  revocationInfo?: {
    revokedAt: string;
    reason: string;
  } | null;
}

export interface LeaderboardUser extends User {
  rank: number;
  certificates_count: number;
  approved_external_count: number;
}

export interface DashboardStats {
  certificates: {
    total_certs: number;
    active_certs: number;
    revoked_certs: number;
    tampered_certs: number;
  };
  users: {
    total_students: number;
    total_issuers: number;
    total_admins: number;
  };
  institutions: {
    total_institutions: number;
  };
  events: {
    total_events: number;
  };
  verifications: {
    total_verifications: number;
    successful_verifications: number;
    flagged_verifications: number;
  };
  pendingUploads: number;
}
