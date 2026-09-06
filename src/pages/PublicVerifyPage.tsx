import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Certificate, VerificationResponse, VerificationLog } from '../types';
import { generateCertificatePDF } from '../utils/pdfExport';
import { TamperSimulatorModal } from '../components/TamperSimulatorModal';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  QrCode,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  Clock,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublicVerifyPageProps {
  initialCertId?: string;
}

export const PublicVerifyPage: React.FC<PublicVerifyPageProps> = ({ initialCertId = '' }) => {
  const [query, setQuery] = useState(initialCertId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<VerificationLog[]>([]);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showTamperModal, setShowTamperModal] = useState(false);

  // Load initial verification or default certificate
  useEffect(() => {
    loadRecentLogs();
    if (initialCertId) {
      handleVerify(initialCertId);
    } else {
      // Auto-verify default sample for immediate instant UI presentation
      handleVerify('CERT-2026-NITS-8841');
    }
  }, [initialCertId]);

  const loadRecentLogs = async () => {
    try {
      const logs = await api.getVerificationLogs();
      setRecentLogs(logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load verification logs', err);
    }
  };

  const handleVerify = async (searchParam?: string) => {
    const val = (searchParam || query).trim();
    if (!val) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.verifyCertificate(val);
      setResult(res);

      if (res.verified && res.status === 'Active') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 }
        });
      }

      loadRecentLogs();
    } catch (err: any) {
      console.error('Verification error', err);
      setResult({
        verified: false,
        status: 'Invalid',
        message: 'Could not connect to verification registry. Please re-check the ID or network.'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner / Verification Search */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-700">
        
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Cryptographic Trust & Public Registry</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Verify Digital Certificate Authenticity
          </h1>

          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Enter a unique Certificate ID or SHA-256 cryptographic hash to validate institutional accreditation, examine tampering audits, and inspect immutable credentials.
          </p>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="mt-6 flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="verify-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-2026-NITS-8841) or SHA-256 Hash"
                className="w-full pl-11 pr-4 py-3 bg-white/10 text-white placeholder:text-slate-400 border border-slate-600 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition"
              />
            </div>
            <button
              id="verify-search-btn"
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-md shrink-0"
            >
              <span>{loading ? 'Verifying...' : 'Verify Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Sample quick test pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400">Quick Test:</span>
            <button
              id="test-sample-active"
              onClick={() => {
                setQuery('CERT-2026-NITS-8841');
                handleVerify('CERT-2026-NITS-8841');
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-emerald-500/30 text-emerald-300 rounded-lg transition"
            >
              ✓ Active (NITS Hackathon)
            </button>
            <button
              id="test-sample-revoked"
              onClick={() => {
                setQuery('CERT-2026-REVOKED-9011');
                handleVerify('CERT-2026-REVOKED-9011');
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-red-500/30 text-red-300 rounded-lg transition"
            >
              ✗ Revoked (Plagiarism detected)
            </button>
            <button
              id="test-sample-invalid"
              onClick={() => {
                setQuery('CERT-FAKE-9999');
                handleVerify('CERT-FAKE-9999');
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-slate-500/30 text-slate-300 rounded-lg transition"
            >
              ? Invalid ID
            </button>
          </div>

        </div>
      </div>

      {/* Verification Result Section */}
      {result && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Status Alert Banner */}
          <div
            id="verification-status-banner"
            className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
              result.status === 'Active'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : result.status === 'Revoked'
                ? 'bg-red-50/80 border-red-300 text-red-950'
                : result.status === 'Tampered'
                ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  result.status === 'Active'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 shadow-md'
                    : result.status === 'Revoked'
                    ? 'bg-red-600 text-white shadow-red-600/30 shadow-md'
                    : result.status === 'Tampered'
                    ? 'bg-amber-600 text-white shadow-amber-600/30 shadow-md'
                    : 'bg-slate-500 text-white'
                }`}
              >
                {result.status === 'Active' && <CheckCircle2 className="w-7 h-7" />}
                {result.status === 'Revoked' && <XCircle className="w-7 h-7" />}
                {result.status === 'Tampered' && <AlertTriangle className="w-7 h-7" />}
                {result.status === 'Invalid' && <XCircle className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold">
                    {result.status === 'Active' && 'Certificate Authenticated & Active'}
                    {result.status === 'Revoked' && 'Certificate Has Been Revoked'}
                    {result.status === 'Tampered' && 'Integrity Alert: Tampered Credential'}
                    {result.status === 'Invalid' && 'Invalid Certificate Identifier'}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                      result.status === 'Active'
                        ? 'bg-emerald-200 text-emerald-900'
                        : result.status === 'Revoked'
                        ? 'bg-red-200 text-red-900'
                        : result.status === 'Tampered'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                <p className="text-xs mt-1 text-slate-700 leading-relaxed">
                  {result.status === 'Active' &&
                    'This digital credential is verified against the institutional registry. Cryptographic SHA-256 signature is intact and authorized.'}
                  {result.status === 'Revoked' &&
                    `This credential was officially invalidated by the issuing institution. Revocation reason: ${result.revocationInfo?.reason || 'Administrative action.'}`}
                  {result.status === 'Tampered' &&
                    'Warning: Metadata attributes or signature hash have been modified since issuance. Cryptographic hash check failed!'}
                  {result.status === 'Invalid' &&
                    (result.message || 'No record matches this ID or SHA-256 hash. The certificate may be counterfeit or expired.')}
                </p>
              </div>
            </div>

            {/* Action Buttons if Certificate Object Exists */}
            {result.certificate && (
              <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
                <button
                  id="download-verified-pdf-btn"
                  onClick={() => generateCertificatePDF(result.certificate!)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  id="tamper-sim-trigger-btn"
                  onClick={() => setShowTamperModal(true)}
                  className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition flex items-center space-x-1"
                  title="Test what happens when certificate metadata is altered"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tamper Test</span>
                </button>
              </div>
            )}

          </div>

          {/* Full Certificate Detail Display */}
          {result.certificate && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Certificate Registry Record</h4>
                  <p className="text-xs text-slate-500">Record ID: {result.certificate.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-600">{new Date(result.certificate.issue_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 2 Cols: Main Info */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Credential Title</span>
                    <h3 className="text-lg font-bold text-slate-900">{result.certificate.title}</h3>
                    {result.certificate.event_title && (
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{result.certificate.event_title}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500">Recipient Student:</span>
                      <p className="font-bold text-slate-900">{result.certificate.recipient_name}</p>
                      {result.certificate.recipient_roll && (
                        <p className="text-slate-500 font-mono">Roll: {result.certificate.recipient_roll}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Recipient Email:</span>
                      <p className="font-mono text-slate-800 truncate">{result.certificate.recipient_email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Issuing Institution:</span>
                      <p className="font-semibold text-slate-800">{result.certificate.institution_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Authorized Officer:</span>
                      <p className="font-semibold text-slate-800">{result.certificate.issuer_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Credential Type:</span>
                      <p className="font-semibold text-slate-800">{result.certificate.certificate_type}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Honors / Grade:</span>
                      <p className="font-semibold text-amber-700">{result.certificate.grade || 'Satisfactory'}</p>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Audit Row */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Cryptographic Hash Audit (SHA-256)
                    </span>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono flex items-center justify-between">
                      <span className="truncate pr-2 text-slate-800">{result.certificate.sha256_hash}</span>
                      <button
                        onClick={() => copyHash(result.certificate!.sha256_hash)}
                        className="text-blue-600 hover:text-blue-800 shrink-0 flex items-center space-x-1"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{copiedHash ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Algorithmic check: Calculated dynamically over recipient, event, issuer, and date.
                    </p>
                  </div>
                </div>

                {/* 1 Col: QR Code & Visual Badge */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-xs border border-slate-200">
                    {result.certificate.qr_code_data ? (
                      <img
                        src={result.certificate.qr_code_data}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-full h-full text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">QR Verification Stamp</span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{result.certificate.id}</span>
                  </div>
                  <div className="w-full pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Database Record Active</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* Verification History / Recent Public Audit Logs */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Recent Verification Activity</h3>
          </div>
          <span className="text-xs text-slate-500">Live logs recorded in PostgreSQL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Certificate ID</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Result Status</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <button
                      onClick={() => {
                        if (log.certificate_id) {
                          setQuery(log.certificate_id);
                          handleVerify(log.certificate_id);
                        }
                      }}
                      className="hover:underline text-blue-600"
                    >
                      {log.certificate_id || 'N/A'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-sans font-semibold">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{log.verification_method}</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.result_status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.result_status === 'Revoked'
                          ? 'bg-red-100 text-red-800'
                          : log.result_status === 'Tampered'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.result_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 max-w-xs truncate">
                    {log.details || 'Verification executed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tamper Simulator Modal */}
      {showTamperModal && result?.certificate && (
        <TamperSimulatorModal
          certificate={result.certificate}
          onClose={() => setShowTamperModal(false)}
        />
      )}

    </div>
  );
};
