import React, { useState } from 'react';
import { Certificate } from '../types';
import { generateCertificatePDF } from '../utils/pdfExport';
import { X, Download, ShieldCheck, AlertTriangle, XCircle, Copy, Check, ExternalLink, Ban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
  onStatusChange?: (updatedCert: Certificate) => void;
  onNavigateToVerify?: (certId: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  onStatusChange,
  onNavigateToVerify
}) => {
  const { user } = useAuth();
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showRevokePrompt, setShowRevokePrompt] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  if (!certificate) return null;

  const canRevoke = (user?.role === 'admin' || user?.role === 'issuer') && certificate.status === 'Active';

  const copyToClipboard = (text: string, type: 'hash' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleRevoke = async () => {
    if (!revokeReason.trim()) return;
    setRevoking(true);
    try {
      const updated = await api.updateCertificateStatus(certificate.id, 'Revoked', revokeReason);
      if (onStatusChange) onStatusChange(updated);
      setShowRevokePrompt(false);
    } catch (err) {
      console.error('Failed to revoke certificate', err);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-semibold text-slate-800">{certificate.id}</span>
            <button
              onClick={() => copyToClipboard(certificate.id, 'id')}
              className="text-slate-400 hover:text-slate-600 transition"
              title="Copy ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Status Pill */}
            {certificate.status === 'Active' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active & Verified</span>
              </span>
            )}
            {certificate.status === 'Revoked' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Revoked</span>
              </span>
            )}
            {certificate.status === 'Tampered' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Tampered / Modified</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="modal-pdf-btn"
              onClick={() => generateCertificatePDF(certificate)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {onNavigateToVerify && (
              <button
                id="modal-verify-nav-btn"
                onClick={() => {
                  onClose();
                  onNavigateToVerify(certificate.id);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Verify Online</span>
              </button>
            )}

            {canRevoke && (
              <button
                id="modal-revoke-btn"
                onClick={() => setShowRevokePrompt(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium transition"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Revoke</span>
              </button>
            )}

            <button
              id="modal-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Revoke Prompt Banner */}
        {showRevokePrompt && (
          <div className="bg-red-50 border-b border-red-200 p-4 animate-in fade-in">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900">Revoke this Digital Certificate</h4>
                <p className="text-xs text-red-700 mt-1">
                  Once revoked, public verifications will immediately flag this credential with your provided justification.
                </p>
                <input
                  type="text"
                  placeholder="Enter reason for revocation (e.g., Plagiarism, issued in error, disciplinary)"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 bg-white border border-red-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    id="confirm-revoke-btn"
                    disabled={revoking || !revokeReason.trim()}
                    onClick={handleRevoke}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                  >
                    {revoking ? 'Revoking...' : 'Confirm Revocation'}
                  </button>
                  <button
                    onClick={() => setShowRevokePrompt(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Rendering Area */}
        <div className="p-6 md:p-8 bg-slate-100 flex justify-center">
          <div className="w-full max-w-3xl bg-[#fdfcf9] border-8 border-slate-900 p-6 md:p-8 relative shadow-xl rounded-sm">
            
            {/* Inner Gold Foil Line */}
            <div className="border border-amber-600 p-6 relative">
              
              {/* Corner Emblems */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-amber-600" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600" />

              {/* Institution Header */}
              <div className="text-center">
                <h3 className="text-sm md:text-base font-bold tracking-wider text-slate-900 uppercase">
                  {certificate.institution_name}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                  Decentralized & Cryptographic Verification Bureau
                </p>
                <div className="w-24 h-0.5 bg-amber-500 mx-auto my-2" />
              </div>

              {/* Certificate Award Title */}
              <div className="text-center mt-3">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-700 tracking-wide">
                  CERTIFICATE OF {certificate.certificate_type?.toUpperCase() || 'EXCELLENCE'}
                </h2>
                <p className="text-xs italic text-slate-600 mt-1">
                  This official credential is conferred to
                </p>
              </div>

              {/* Recipient Name */}
              <div className="text-center my-4">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 border-b border-slate-200 pb-1 inline-block px-8">
                  {certificate.recipient_name}
                </h1>
                {certificate.recipient_roll && (
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Student ID: {certificate.recipient_roll}
                  </p>
                )}
              </div>

              {/* Achievement description */}
              <div className="text-center max-w-lg mx-auto text-xs text-slate-700 leading-relaxed">
                For fulfilling all requirements and proving exemplary performance in
                <div className="font-bold text-slate-900 text-sm mt-0.5">{certificate.title}</div>
                {certificate.event_title && (
                  <div className="text-slate-500 text-[11px] italic mt-0.5">at {certificate.event_title}</div>
                )}
              </div>

              {/* Distinction / Grade */}
              {certificate.grade && (
                <div className="text-center mt-2">
                  <span className="inline-block px-3 py-0.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full">
                    Merit: {certificate.grade}
                  </span>
                </div>
              )}

              {/* Bottom Details Row: QR + Metadata + Signature */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-end justify-between">
                
                {/* Left: QR code & Scan notice */}
                <div className="flex items-center space-x-3">
                  {certificate.qr_code_data && (
                    <img
                      src={certificate.qr_code_data}
                      alt="Verification QR"
                      className="w-16 h-16 md:w-20 md:h-20 border border-slate-200 p-1 bg-white rounded shadow-2xs"
                    />
                  )}
                  <div className="text-left text-[10px] text-slate-500">
                    <p className="font-bold text-slate-700">Scan to Verify</p>
                    <p className="font-mono text-slate-600">{certificate.id}</p>
                    <p className="mt-0.5">
                      Issued: {new Date(certificate.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Center: Official Seal Emblem */}
                <div className="hidden sm:flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-100 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-6 h-6 text-amber-700" />
                  </div>
                  <span className="text-[8px] uppercase tracking-widest font-bold text-amber-800 mt-1">Official Seal</span>
                </div>

                {/* Right: Signature */}
                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 pb-1">
                    <p className="font-serif italic text-sm text-slate-800">{certificate.issuer_name}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 uppercase mt-0.5">Authorized Signatory</p>
                  <p className="text-[9px] text-slate-500">{certificate.institution_name}</p>
                </div>

              </div>

            </div>

            {/* Cryptographic SHA-256 Hash Footnote */}
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded p-2 flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span className="truncate pr-2">
                <strong className="text-slate-700">SHA-256:</strong> {certificate.sha256_hash}
              </span>
              <button
                onClick={() => copyToClipboard(certificate.sha256_hash, 'hash')}
                className="text-blue-600 hover:text-blue-800 transition shrink-0 flex items-center space-x-1"
              >
                {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>Cryptographic audit: SHA-256 integrity hash is computed over immutable certificate metadata.</span>
          <span className="font-mono text-slate-700">{certificate.id}</span>
        </div>

      </div>
    </div>
  );
};
