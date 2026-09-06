import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Certificate, UploadedCertificate, AcademicEvent } from '../types';
import { api } from '../api';
import { CertificateModal } from '../components/CertificateModal';
import { UploadCertificateModal } from '../components/UploadCertificateModal';
import { generateCertificatePDF } from '../utils/pdfExport';
import {
  Award,
  UploadCloud,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  ExternalLink,
  Plus,
  ShieldCheck,
  Search,
  Trophy,
  Filter
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigateToVerify: (id: string) => void;
  onNavigateToEvents: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateToVerify, onNavigateToEvents }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'certificates' | 'uploads' | 'events'>('certificates');
  
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [uploads, setUploads] = useState<UploadedCertificate[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [certs, upls, evts] = await Promise.all([
        api.getCertificates({ studentEmail: user.email }),
        api.getUploads({ studentId: user.id }),
        api.getEvents()
      ]);
      setCertificates(certs);
      setUploads(upls);
      setEvents(evts);
    } catch (err) {
      console.error('Failed to load student dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = certificates.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.event_title && c.event_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Gold': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Silver': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-amber-50 text-amber-900 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Student Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl border-2 border-blue-500/30 object-cover shadow-xs"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getTierColor(user?.tier)}`}>
                  {user?.tier || 'Bronze'} Tier
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.roll_number && <span className="font-mono font-semibold text-slate-700">{user.roll_number} • </span>}
                {user?.department} • {user?.institution_name}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-center min-w-[90px]">
              <span className="text-xs text-blue-700 font-medium block">Total Points</span>
              <span className="text-xl font-extrabold text-blue-900 flex items-center justify-center space-x-1">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{user?.points || 0}</span>
              </span>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[90px]">
              <span className="text-xs text-slate-500 font-medium block">Issued Certs</span>
              <span className="text-xl font-bold text-slate-900">{certificates.length}</span>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[90px]">
              <span className="text-xs text-slate-500 font-medium block">Uploaded Proofs</span>
              <span className="text-xl font-bold text-slate-900">{uploads.length}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex space-x-2">
          <button
            id="tab-my-certs"
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'certificates'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Digital Certificates ({certificates.length})</span>
          </button>

          <button
            id="tab-my-uploads"
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'uploads'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Uploaded Credentials ({uploads.length})</span>
          </button>

          <button
            id="tab-events-opp"
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Earn Points (Events)</span>
          </button>
        </div>

        {activeTab === 'uploads' && (
          <button
            id="student-upload-cert-btn"
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload External Certificate</span>
          </button>
        )}
      </div>

      {/* TAB 1: Digital Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search certificate title, ID, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white"
              />
            </div>
            <p className="text-xs text-slate-500">
              Showing {filteredCerts.length} of {certificates.length} credentials
            </p>
          </div>

          {filteredCerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No Digital Certificates Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Participate in academic hackathons or submit external credentials for review to receive verifiable digital certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-500">{cert.id}</span>
                        {cert.status === 'Active' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800">
                            {cert.status}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-1 leading-snug">{cert.title}</h3>
                      {cert.event_title && (
                        <p className="text-xs text-blue-600 mt-0.5">{cert.event_title}</p>
                      )}
                    </div>

                    {cert.qr_code_data && (
                      <img
                        src={cert.qr_code_data}
                        alt="QR"
                        className="w-14 h-14 border border-slate-200 p-1 rounded-lg bg-white shrink-0 ml-2"
                      />
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Issuer: {cert.issuer_name}</span>
                    <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                      SHA-256: {cert.sha256_hash.substring(0, 10)}...
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => generateCertificatePDF(cert)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => onNavigateToVerify(cert.id)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                        title="Public Verification Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: Uploaded Credentials */}
      {activeTab === 'uploads' && (
        <div className="space-y-4">
          {uploads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No Uploaded Credentials Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Have you earned AWS, Google Cloud, Coursera, or inter-college hackathon awards? Upload your certificate proof to earn points.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Certificate</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((up) => (
                <div
                  key={up.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issuing Org: <strong className="text-slate-700">{up.issuing_organization}</strong> • {up.category}
                      </p>
                      {up.review_notes && (
                        <p className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                          Reviewer note: {up.review_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    {up.status === 'approved' && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        +{up.points_awarded} Points Granted
                      </span>
                    )}

                    <a
                      href={up.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition inline-flex items-center space-x-1"
                    >
                      <span>View File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Academic Events */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                      {ev.event_type}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1.5">{ev.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{ev.institution_name}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 shrink-0">
                    +{ev.points_reward} pts
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {ev.description || 'Academic event offering verified certificate upon successful completion.'}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Scheduled: {new Date(ev.event_date).toLocaleDateString()}</span>
                  <button
                    onClick={onNavigateToEvents}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    View Details & Enroll
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
        />
      )}

      {/* Upload External Modal */}
      {showUploadModal && (
        <UploadCertificateModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={(newUpload) => {
            setUploads([newUpload, ...uploads]);
            refreshUser();
          }}
        />
      )}

    </div>
  );
};
