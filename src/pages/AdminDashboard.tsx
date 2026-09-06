import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Certificate, Institution, VerificationLog } from '../types';
import { api } from '../api';
import { CertificateModal } from '../components/CertificateModal';
import { CreateInstitutionModal } from '../components/CreateInstitutionModal';
import { generateCertificatePDF } from '../utils/pdfExport';
import {
  ShieldAlert,
  Building2,
  Award,
  Users,
  Search,
  Plus,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToVerify: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToVerify }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'certificates' | 'institutions' | 'logs'>('certificates');

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showAddInstModal, setShowAddInstModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certs, insts, auditLogs, systemStats] = await Promise.all([
        api.getCertificates(),
        api.getInstitutions(),
        api.getVerificationLogs(),
        api.getStats()
      ]);
      setCertificates(certs);
      setInstitutions(insts);
      setLogs(auditLogs);
      setStats(systemStats);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = certificates.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.institution_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>Super Admin & System Authority Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Administration & Audit</h2>
          <p className="text-xs text-slate-300 mt-1">
            Logged in as <strong>{user?.name}</strong> • Global cryptographic certificate governance & institution accreditation
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowAddInstModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Accredit Institution</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Issued</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
            {stats?.certificates?.total || certificates.length}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Across all institutions</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-emerald-600 font-medium block">Active Credentials</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
            {stats?.certificates?.active || certificates.filter(c => c.status === 'Active').length}
          </span>
          <span className="text-[10px] text-emerald-600 mt-1 block">Valid & unmodified</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-red-600 font-medium block">Revoked</span>
          <span className="text-2xl font-extrabold text-red-700 mt-0.5 block">
            {stats?.certificates?.revoked || certificates.filter(c => c.status === 'Revoked').length}
          </span>
          <span className="text-[10px] text-red-500 mt-1 block">Revoked by authority</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-blue-600 font-medium block">Accredited Bodies</span>
          <span className="text-2xl font-extrabold text-blue-700 mt-0.5 block">
            {stats?.institutions || institutions.length}
          </span>
          <span className="text-[10px] text-blue-500 mt-1 block">Verified institutions</span>
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
          <span>Global Certificates ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('institutions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'institutions'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Accredited Institutions ({institutions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Verification Audit Trail ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: Global Certificates */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, ID, institution..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <span className="text-xs text-slate-500">{filteredCerts.length} certificates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Credential Title</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <button onClick={() => setSelectedCert(cert)} className="hover:text-blue-600">
                        {cert.id}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{cert.recipient_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">{cert.recipient_email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {cert.institution_name}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {cert.title}
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
                          title="View"
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
                          title="Verify"
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

      {/* TAB 2: Institutions Directory */}
      {activeTab === 'institutions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Accredited Academic Bodies & Universities</h3>
            <button
              onClick={() => setShowAddInstModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Institution</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {institutions.map((inst) => (
              <div key={inst.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-slate-900">{inst.name}</h4>
                        {inst.verified && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {inst.code} • {inst.category}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Contact: {inst.contact_email}</span>
                  {inst.website && (
                    <a
                      href={inst.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium hover:underline inline-flex items-center space-x-1"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Verification Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs overflow-hidden">
          <h3 className="font-bold text-sm text-slate-900 mb-3">Verification History & Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Certificate ID</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.verified_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {log.certificate_id || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-sans font-semibold">
                      <span className="px-2 py-0.5 rounded bg-slate-100">{log.verification_method}</span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.result_status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.result_status === 'Revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.result_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 max-w-sm truncate">
                      {log.details || 'Verification logged'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
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

      {showAddInstModal && (
        <CreateInstitutionModal
          onClose={() => setShowAddInstModal(false)}
          onCreated={(newInst) => {
            setInstitutions([newInst, ...institutions]);
          }}
        />
      )}

    </div>
  );
};
