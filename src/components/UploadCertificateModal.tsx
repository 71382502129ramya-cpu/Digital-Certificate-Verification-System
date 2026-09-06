import React, { useState } from 'react';
import { UploadedCertificate } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { X, UploadCloud, FileText, CheckCircle } from 'lucide-react';

interface UploadCertificateModalProps {
  onClose: () => void;
  onUploaded: (upload: UploadedCertificate) => void;
}

export const UploadCertificateModal: React.FC<UploadCertificateModalProps> = ({ onClose, onUploaded }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Industry Certification');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !issuingOrg || !issueDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('student_id', user?.id || '');
      formData.append('student_name', user?.name || 'Student');
      formData.append('title', title);
      formData.append('issuing_organization', issuingOrg);
      formData.append('issue_date', issueDate);
      formData.append('category', category);
      if (file) {
        formData.append('file', file);
      }

      const res = await api.uploadCertificate(formData);
      onUploaded(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload certificate');
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
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Upload External Certificate</h3>
              <p className="text-xs text-slate-300">Submit external credentials for institution review & student points</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate / Credential Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect / NPTEL Gold Medal"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Organization / Authority *</label>
            <input
              type="text"
              required
              value={issuingOrg}
              onChange={(e) => setIssuingOrg(e.target.value)}
              placeholder="e.g. Amazon Web Services / Coursera / IIT Madras"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Industry Certification">Industry Certification</option>
                <option value="Online Course Specialization">Online Course / Specialization</option>
                <option value="Academic Competition">Academic Competition</option>
                <option value="Workshop & Training">Workshop & Training</option>
                <option value="Extracurricular">Extracurricular & Leadership</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Issue *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Document (PDF, PNG, JPG)</label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50 relative">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1">
                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-blue-600" />
                    <p className="text-xs font-semibold text-slate-800">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Click or drag & drop to upload certificate</p>
                    <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Once approved by college faculty or administrators, this certificate will award activity points and boost your leaderboard standing!
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
              id="submit-upload-cert-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
            >
              <span>{loading ? 'Submitting...' : 'Submit for Verification'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
