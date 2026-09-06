import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Certificate, UploadedCertificate, AcademicEvent } from '../types';
import { api } from '../api';
import { CertificateModal } from '../components/CertificateModal';
import { IssueCertificateModal } from '../components/IssueCertificateModal';
import { ReviewUploadModal } from '../components/ReviewUploadModal';
import { CreateEventModal } from '../components/CreateEventModal';
import { generateCertificatePDF } from '../utils/pdfExport';
import {
  Award,
  Plus,
  Calendar,
  FileCheck,
  Search,
  Eye,
  Download,
  Ban,
  CheckCircle,
  Clock,
  Building2,
  Filter,
  ExternalLink
} from 'lucide-react';

interface IssuerDashboardProps {
  onNavigateToVerify: (id: string) => void;
}

export const IssuerDashboard: React.FC<IssuerDashboardProps> = ({ onNavigateToVerify }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'certificates' | 'uploads' | 'events'>('certificates');
  
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [uploads, setUploads] = useState<UploadedCertificate[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [reviewingUpload, setReviewingUpload] = useState<UploadedCertificate | null>(null);
  
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certs, upls, evts] = await Promise.all([
        api.getCertificates(),
        api.getUploads(),
        api.getEvents()
      ]);
      setCertificates(certs);
      setUploads(upls);
      setEvents(evts);
    } catch (err) {
      console.error('Failed to load issuer dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = certificates.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.event_title && c.event_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingUploadsCount = uploads.filter(u => u.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Institution / Faculty Portal
            </span>
            <span className="text-xs text-slate-500">• {user?.department}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{user?.institution_name || 'Academic Institution'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized Issuer: <strong className="text-slate-800">{user?.name}</strong> • Official Cryptographic Signatory
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="issuer-create-event-btn"
            onClick={() => setShowEventModal(true)}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Host Event</span>
          </button>

          <button
            id="issuer-issue-cert-btn"
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Certificate</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Issued</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{certificates.length}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">In database registry</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-emerald-600 font-medium block">Active & Verified</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
            {certificates.filter(c => c.status === 'Active').length}
          </span>
          <span className="text-[10px] text-emerald-600 mt-1 block">Cryptographically valid</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-red-600 font-medium block">Revoked</span>
          <span className="text-2xl font-extrabold text-red-700 mt-0.5 block">
            {certificates.filter(c => c.status === 'Revoked').length}
          </span>
          <span className="text-[10px] text-red-500 mt-1 block">Flagged credentials</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-amber-600 font-medium block">Review Queue</span>
          <span className="text-2xl font-extrabold text-amber-700 mt-0.5 block">{pendingUploadsCount}</span>
          <span className="text-[10px] text-amber-600 mt-1 block">Pending approval</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'certificates'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Issued Registry ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('uploads')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'uploads'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>External Approvals Queue ({pendingUploadsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'events'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Events ({events.length})</span>
        </button>
      </div>

      {/* TAB 1: Issued Certificates Registry */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, ID, or certificate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowIssueModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Certificate</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Credential Title</th>
                  <th className="py-3 px-4">Type / Grade</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="hover:text-blue-600 text-left"
                      >
                        {cert.id}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{cert.recipient_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{cert.recipient_email}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {cert.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                        {cert.certificate_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cert.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cert.status === 'Revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="View Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => generateCertificatePDF(cert)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateToVerify(cert.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Public Verification"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: External Approvals Queue */}
      {activeTab === 'uploads' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900">Student Submitted External Credentials</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and authenticate external certifications (AWS, Coursera, NPTEL, Hackathon awards) uploaded by students.
            </p>
          </div>

          <div className="space-y-3">
            {uploads.map((up) => (
              <div
                key={up.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{up.title}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          up.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : up.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {up.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5">
                      Submitted by: <strong className="text-slate-900">{up.student_name}</strong> • Issuing Org: <strong>{up.issuing_organization}</strong>
                    </p>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Issued: {new Date(up.issue_date).toLocaleDateString()} • Category: {up.category}
                    </p>

                    {up.review_notes && (
                      <p className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded">
                        Notes: {up.review_notes} (by {up.reviewed_by})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <a
                    href={up.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition inline-flex items-center space-x-1"
                  >
                    <span>View File</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => setReviewingUpload(up)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
                  >
                    {up.status === 'pending' ? 'Review & Approve' : 'Re-Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Academic Events */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Events Hosted by Your Institution</h3>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                      {ev.event_type}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{ev.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{ev.institution_name}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 shrink-0">
                    +{ev.points_reward} pts
                  </span>
                </div>

                <p className="text-xs text-slate-600">{ev.description || 'No description provided.'}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Scheduled: {new Date(ev.event_date).toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      setShowIssueModal(true);
                    }}
                    className="text-blue-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <span>Issue Certificates for this Event</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Detailed Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onNavigateToVerify={onNavigateToVerify}
          onStatusChange={(updated) => {
            setCertificates(certificates.map(c => c.id === updated.id ? updated : c));
            setSelectedCert(updated);
          }}
        />
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <IssueCertificateModal
          onClose={() => setShowIssueModal(false)}
          onIssued={(newCert) => {
            setCertificates([newCert, ...certificates]);
          }}
        />
      )}

      {/* Review Upload Modal */}
      {reviewingUpload && (
        <ReviewUploadModal
          upload={reviewingUpload}
          onClose={() => setReviewingUpload(null)}
          onReviewed={(updated) => {
            setUploads(uploads.map(u => u.id === updated.id ? updated : u));
          }}
        />
      )}

      {/* Create Event Modal */}
      {showEventModal && (
        <CreateEventModal
          onClose={() => setShowEventModal(false)}
          onCreated={(newEvent) => {
            setEvents([newEvent, ...events]);
          }}
        />
      )}

    </div>
  );
};
