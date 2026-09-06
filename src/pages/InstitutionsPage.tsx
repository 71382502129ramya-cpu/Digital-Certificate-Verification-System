import React, { useState, useEffect } from 'react';
import { Institution } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CreateInstitutionModal } from '../components/CreateInstitutionModal';
import { Building2, Plus, Search, ExternalLink, ShieldCheck, Mail } from 'lucide-react';

export const InstitutionsPage: React.FC = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const data = await api.getInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error('Failed to load institutions', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accredited Academic Institutions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered universities, autonomous engineering colleges, and credential authorities recognized in the verification network.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Accredit Institution</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search institution name, code, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((inst) => (
          <div
            key={inst.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                {inst.verified && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Accredited</span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">{inst.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded">
                    {inst.code}
                  </span>
                  <span className="text-xs text-slate-500">{inst.category}</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-600 space-y-1">
                <p className="flex items-center space-x-1.5 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{inst.contact_email}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Authorized Credential Issuer</span>
              {inst.website ? (
                <a
                  href={inst.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-semibold hover:underline inline-flex items-center space-x-1"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-slate-400">Internal</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateInstitutionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newInst) => {
            setInstitutions([newInst, ...institutions]);
          }}
        />
      )}

    </div>
  );
};
