import React, { useState } from 'react';
import { Certificate } from '../types';
import { api } from '../api';
import { X, ShieldAlert, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

interface TamperSimulatorModalProps {
  certificate: Certificate;
  onClose: () => void;
}

export const TamperSimulatorModal: React.FC<TamperSimulatorModalProps> = ({ certificate, onClose }) => {
  const [recipientEmail, setRecipientEmail] = useState(certificate.recipient_email);
  const [recipientName, setRecipientName] = useState(certificate.recipient_name);
  const [issueDate, setIssueDate] = useState(certificate.issue_date.split('T')[0]);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const handleTestTamper = async () => {
    setChecking(true);
    try {
      const res = await api.tamperCheck({
        certificateId: certificate.id,
        recipientEmail,
        issuerName: certificate.issuer_name,
        eventTitle: certificate.event_title || certificate.title,
        issueDate,
        providedHash: certificate.sha256_hash
      });
      setAuditResult(res);
    } catch (err) {
      console.error('Tamper check error', err);
    } finally {
      setChecking(false);
    }
  };

  const handleReset = () => {
    setRecipientEmail(certificate.recipient_email);
    setRecipientName(certificate.recipient_name);
    setIssueDate(certificate.issue_date.split('T')[0]);
    setAuditResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold">Cryptographic Tamper Simulator</h3>
              <p className="text-xs text-slate-300">Test SHA-256 mathematical immutability</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Edit any field below to simulate what happens if a malicious actor attempts to forge or tamper with recipient data on a printed or digital certificate:
          </p>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Certificate ID (Immutable)</label>
              <input
                type="text"
                disabled
                value={certificate.id}
                className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded font-mono text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recipient Email (Try changing a single letter):</label>
              <input
                type="text"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recipient Name:</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Date:</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestTamper}
              disabled={checking}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{checking ? 'Computing SHA-256...' : 'Run Cryptographic Integrity Check'}</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs transition"
              title="Reset to original values"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Audit Results */}
          {auditResult && (
            <div
              className={`p-4 rounded-xl border text-xs animate-in fade-in ${
                auditResult.isAuthentic
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-sm">
                {auditResult.isAuthentic ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>STATUS: ACTIVE & CRYPTOGRAPHICALLY SOUND</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-5 h-5 text-red-600" />
                    <span>STATUS: TAMPERED / CORRUPTED INTEGRITY</span>
                  </>
                )}
              </div>

              <p className="mt-1 text-slate-700">{auditResult.notes}</p>

              <div className="mt-3 space-y-1.5 font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200">
                <div className="truncate">
                  <span className="font-semibold text-slate-500">Stored Hash: </span>
                  <span className="text-slate-800">{certificate.sha256_hash}</span>
                </div>
                <div className="truncate">
                  <span className="font-semibold text-slate-500">Computed Hash: </span>
                  <span className={auditResult.isAuthentic ? 'text-emerald-700' : 'text-red-700 font-bold'}>
                    {auditResult.calculatedSha256}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
