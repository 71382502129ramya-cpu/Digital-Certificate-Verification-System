import {
  Certificate,
  UploadedCertificate,
  AcademicEvent,
  Institution,
  VerificationLog,
  VerificationResponse,
  LeaderboardUser,
  DashboardStats,
  User
} from './types';

const API_BASE = '/api';

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ success: boolean; user: User; token: string }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  register: async (userData: Partial<User> & { password: string }): Promise<{ success: boolean; user: User; token: string }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  getDemoUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    if (!res.ok) throw new Error('Failed to load demo accounts');
    return res.json();
  },

  getMe: async (userId: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Certificates
  getCertificates: async (params?: { studentId?: string; studentEmail?: string; issuerId?: string; status?: string; search?: string }): Promise<Certificate[]> => {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.studentEmail) query.set('studentEmail', params.studentEmail);
    if (params?.issuerId) query.set('issuerId', params.issuerId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/certificates?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch certificates');
    return res.json();
  },

  issueCertificate: async (data: Partial<Certificate>): Promise<Certificate> => {
    const res = await fetch(`${API_BASE}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to issue certificate');
    }
    return res.json();
  },

  verifyCertificate: async (idOrHash: string, method: string = 'id'): Promise<VerificationResponse> => {
    const res = await fetch(`${API_BASE}/certificates/verify/${encodeURIComponent(idOrHash)}?method=${method}`);
    const data = await res.json();
    return data;
  },

  tamperCheck: async (payload: {
    certificateId: string;
    recipientEmail: string;
    issuerName: string;
    eventTitle: string;
    issueDate: string;
    providedHash?: string;
  }) => {
    const res = await fetch(`${API_BASE}/certificates/verify-tamper-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  updateCertificateStatus: async (id: string, status: string, revocationReason?: string): Promise<Certificate> => {
    const res = await fetch(`${API_BASE}/certificates/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, revocation_reason: revocationReason })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  deleteCertificate: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/certificates/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete certificate');
  },

  // Events
  getEvents: async (issuerId?: string): Promise<AcademicEvent[]> => {
    const query = issuerId ? `?issuerId=${issuerId}` : '';
    const res = await fetch(`${API_BASE}/events${query}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  createEvent: async (data: Partial<AcademicEvent>): Promise<AcademicEvent> => {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  deleteEvent: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete event');
  },

  // Institutions
  getInstitutions: async (): Promise<Institution[]> => {
    const res = await fetch(`${API_BASE}/institutions`);
    if (!res.ok) throw new Error('Failed to fetch institutions');
    return res.json();
  },

  createInstitution: async (data: Partial<Institution>): Promise<Institution> => {
    const res = await fetch(`${API_BASE}/institutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create institution');
    return res.json();
  },

  verifyInstitution: async (id: string, verified: boolean): Promise<Institution> => {
    const res = await fetch(`${API_BASE}/institutions/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified })
    });
    if (!res.ok) throw new Error('Failed to update institution');
    return res.json();
  },

  // Student Certificate Uploads
  getUploads: async (params?: { studentId?: string; status?: string }): Promise<UploadedCertificate[]> => {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/uploads?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch uploaded certificates');
    return res.json();
  },

  uploadCertificate: async (formData: FormData): Promise<UploadedCertificate> => {
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload certificate');
    }
    return res.json();
  },

  reviewUpload: async (id: string, data: { status: 'approved' | 'rejected'; points_awarded: number; review_notes?: string; reviewer_name?: string }): Promise<UploadedCertificate> => {
    const res = await fetch(`${API_BASE}/uploads/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },

  // Leaderboard
  getLeaderboard: async (department?: string): Promise<LeaderboardUser[]> => {
    const query = department ? `?department=${encodeURIComponent(department)}` : '';
    const res = await fetch(`${API_BASE}/leaderboard${query}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  // Logs
  getVerificationLogs: async (status?: string): Promise<VerificationLog[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/verification-logs${query}`);
    if (!res.ok) throw new Error('Failed to fetch verification logs');
    return res.json();
  },

  // Stats
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/stats/overview`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }
};
