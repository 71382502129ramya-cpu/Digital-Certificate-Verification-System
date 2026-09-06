import React, { useState, useEffect } from 'react';
import { Certificate, AcademicEvent, User } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { X, Award, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface IssueCertificateModalProps {
  onClose: () => void;
  onIssued: (newCert: Certificate) => void;
}

export const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({ onClose, onIssued }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientRoll, setRecipientRoll] = useState('');
  const [title, setTitle] = useState('Certificate of Excellence');
  const [certificateType, setCertificateType] = useState<any>('Excellence');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [grade, setGrade] = useState('Distinction (1st Place)');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function loadData() {
      try {
        const [evts, demos] = await Promise.all([
          api.getEvents(),
          api.getDemoUsers()
        ]);
        setEvents(evts);
        const stuOnly = demos.filter(u => u.role === 'student');
        setStudents(stuOnly);

        if (evts.length > 0) {
          setSelectedEventId(evts[0].id);
          setEventTitle(evts[0].title);
        }

        if (stuOnly.length > 0) {
          handleSelectStudent(stuOnly[0].id, stuOnly);
        }
      } catch (err) {
        console.error('Failed to load events or students', err);
      }
    }
    loadData();
  }, []);

  const handleSelectStudent = (id: string, list: User[] = students) => {
    setSelectedStudentId(id);
    const stu = list.find(s => s.id === id);
    if (stu) {
      setRecipientName(stu.name);
      setRecipientEmail(stu.email);
      setRecipientRoll(stu.roll_number || '');
    }
  };

  const handleEventChange = (eId: string) => {
    setSelectedEventId(eId);
    const ev = events.find(item => item.id === eId);
    if (ev) {
      setEventTitle(ev.title);
      setTitle(`Certificate of Achievement - ${ev.title}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const newCert = await api.issueCertificate({
        title,
        recipient_id: selectedStudentId || undefined,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_roll: recipientRoll,
        issuer_id: user?.id,
        issuer_name: user?.name || 'Academic Dean',
        institution_name: user?.institution_name || 'National Institute of Technology & Sciences',
        event_id: selectedEventId || undefined,
        event_title: eventTitle,
        issue_date: issueDate,
        grade,
        certificate_type: certificateType
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onIssued(newCert);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Issue New Digital Certificate</h3>
              <p className="text-xs text-slate-300">Generates unique ID, SHA-256 hash & verification QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Quick Student Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Registered Student (or type manually)
            </label>
            <select
              id="student-select"
              value={selectedStudentId}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Custom Recipient / Manual Entry --</option>
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.name} ({stu.roll_number ? `${stu.roll_number} - ` : ''}{stu.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Full Name *</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Ramya Krishnan"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Email *</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="e.g. ramya@sritcbe.ac.in"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Roll / ID Number</label>
              <input
                type="text"
                value={recipientRoll}
                onChange={(e) => setRecipientRoll(e.target.value)}
                placeholder="e.g. 71382502129"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Type</label>
              <select
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Excellence">Excellence (+100 pts)</option>
                <option value="Achievement">Achievement (+75 pts)</option>
                <option value="Completion">Completion (+50 pts)</option>
                <option value="Participation">Participation (+30 pts)</option>
                <option value="Appreciation">Appreciation (+40 pts)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Academic Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Standalone Certificate / Custom Event --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.event_type} - {ev.institution_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Certificate of Excellence - Smart India Hackathon"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / Distinction</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 1st Place / Grade A+"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Issue</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Issuer Info Footnote */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Issuing as <strong>{user?.name || 'Authorized Officer'}</strong> ({user?.institution_name || 'Academic Institution'}).
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              id="submit-issue-cert-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Issuing Certificate...' : 'Generate & Issue Certificate'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
