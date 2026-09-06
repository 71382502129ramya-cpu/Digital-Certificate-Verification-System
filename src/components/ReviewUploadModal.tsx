import React, { useState } from 'react';
import { UploadedCertificate } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle, XCircle, FileText, ExternalLink, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewUploadModalProps {
  upload: UploadedCertificate | null;
  onClose: () => void;
  onReviewed: (updated: UploadedCertificate) => void;
}

export const ReviewUploadModal: React.FC<ReviewUploadModalProps> = ({ upload, onClose, onReviewed }) => {
  const { user } = useAuth();
  const [points, setPoints] = useState(50);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!upload) return null;

  const handleAction = async (status: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const res = await api.reviewUpload(upload.id, {
        status,
        points_awarded: status === 'approved' ? Number(points) : 0,
        review_notes: notes || (status === 'approved' ? 'Credential verified against issuing authority database.' : 'Credential proof could not be verified.'),
        reviewer_name: user?.name || 'Review Committee'
      });

      if (status === 'approved') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      }

      onReviewed(res);
      onClose();
    } catch (err) {
      console.error('Failed to review upload', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Review Uploaded Certificate</h3>
              <p className="text-xs text-slate-300">Validate student credential authenticity & grant points</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <span className="font-semibold text-slate-800">{upload.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Title:</span>
              <span className="font-semibold text-slate-800 text-right">{upload.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Issuing Organization:</span>
              <span className="font-medium text-slate-800">{upload.issuing_organization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-medium text-slate-800">{upload.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date of Issue:</span>
              <span className="font-medium text-slate-800">{new Date(upload.issue_date).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Document Preview Link */}
          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">{upload.file_name || 'certificate-proof.pdf'}</p>
                <p className="text-[10px] text-slate-500">Uploaded Document Proof</p>
              </div>
            </div>
            <a
              href={upload.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              <span>View Proof</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Points Allocation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Points to Award (if Approved)
            </label>
            <div className="flex items-center space-x-2">
              {[25, 50, 75, 100].map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPoints(pt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    points === pt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  +{pt} pts
                </button>
              ))}
              <input
                type="number"
                min="0"
                max="500"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center"
              />
            </div>
          </div>

          {/* Review Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Review Comments / Verification Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified via official verification link or badge URL."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('rejected')}
              className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Submission</span>
            </button>
            <button
              id="approve-upload-btn"
              type="button"
              disabled={loading}
              onClick={() => handleAction('approved')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve & Grant {points} Points</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
