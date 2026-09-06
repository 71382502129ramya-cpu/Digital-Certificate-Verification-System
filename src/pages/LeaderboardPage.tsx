import React, { useState, useEffect } from 'react';
import { LeaderboardUser } from '../types';
import { api } from '../api';
import { Trophy, Medal, Award, Search, Sparkles, Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.roll_number && e.roll_number.toLowerCase().includes(search.toLowerCase())) ||
    e.institution_name.toLowerCase().includes(search.toLowerCase())
  );

  const top3 = entries.slice(0, 3);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Gold': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Silver': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-amber-50 text-amber-900 border-amber-200';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-15">
          <Trophy className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Merit & Activity Points</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Student Academic Leaderboard</h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-2 leading-relaxed">
            Earn activity points by earning verified digital certificates, winning national hackathons, and uploading accredited external industry credentials.
          </p>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          {/* 2nd Place */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs order-2 md:order-1 relative">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-extrabold flex items-center justify-center mx-auto -mt-10 shadow-xs">
              2
            </div>
            <img
              src={top3[1].avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${top3[1].name}`}
              alt={top3[1].name}
              className="w-16 h-16 rounded-full mx-auto my-3 border-2 border-slate-300 shadow-xs"
            />
            <h3 className="font-bold text-sm text-slate-900">{top3[1].name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{top3[1].roll_number || 'Student'}</p>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTierColor(top3[1].tier)}`}>
              {top3[1].tier}
            </span>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-lg font-black text-slate-800">{top3[1].points} pts</span>
              <p className="text-[10px] text-slate-500">{top3[1].verified_certificates_count} verified credentials</p>
            </div>
          </div>

          {/* 1st Place Gold */}
          <div className="bg-white rounded-2xl border-2 border-amber-400 p-6 text-center shadow-md order-1 md:order-2 relative md:-translate-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-400 text-white font-extrabold flex items-center justify-center mx-auto -mt-12 shadow-md">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <img
              src={top3[0].avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${top3[0].name}`}
              alt={top3[0].name}
              className="w-20 h-20 rounded-full mx-auto my-3 border-4 border-amber-400 shadow-md"
            />
            <div className="flex items-center justify-center space-x-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="font-bold text-base text-slate-900">{top3[0].name}</h3>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{top3[0].roll_number}</p>
            <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold border ${getTierColor(top3[0].tier)}`}>
              {top3[0].tier} Rank #1
            </span>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-2xl font-black text-amber-600">{top3[0].points} pts</span>
              <p className="text-xs text-slate-500 mt-0.5">{top3[0].verified_certificates_count} verified credentials</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs order-3 relative">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-extrabold flex items-center justify-center mx-auto -mt-10 shadow-xs">
              3
            </div>
            <img
              src={top3[2].avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${top3[2].name}`}
              alt={top3[2].name}
              className="w-16 h-16 rounded-full mx-auto my-3 border-2 border-amber-300 shadow-xs"
            />
            <h3 className="font-bold text-sm text-slate-900">{top3[2].name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{top3[2].roll_number || 'Student'}</p>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTierColor(top3[2].tier)}`}>
              {top3[2].tier}
            </span>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-lg font-black text-slate-800">{top3[2].points} pts</span>
              <p className="text-[10px] text-slate-500">{top3[2].verified_certificates_count} verified credentials</p>
            </div>
          </div>

        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name, roll number, or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <span className="text-xs text-slate-500">Ranking updated in real-time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Institution & Dept</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4 text-center">Verified Certs</th>
                <th className="py-3 px-4 text-right">Activity Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isCurrentUser = user?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition ${isCurrentUser ? 'bg-blue-50/60 font-semibold' : ''}`}
                  >
                    <td className="py-3 px-4 text-center">
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs">
                          1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs">
                          2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                          3
                        </span>
                      ) : (
                        <span className="font-mono text-slate-500 text-xs font-bold">{item.rank}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`}
                          alt={item.name}
                          className="w-8 h-8 rounded-full border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.name} {isCurrentUser && <span className="text-[10px] text-blue-600 font-bold">(You)</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{item.roll_number || item.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-medium text-slate-800 truncate max-w-[200px]">{item.institution_name}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.department}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierColor(item.tier)}`}>
                        {item.tier}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {item.verified_certificates_count}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-sm text-blue-600">{item.points} pts</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Points Scoring Rules Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>How Activity Points Are Earned & Audited</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-amber-600 block">+100 Points</span>
            <strong className="text-slate-800">Hackathon Winner / 1st Place</strong>
            <p className="text-slate-500 text-[11px] mt-0.5">Digital Certificate of Excellence issued by verified college.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-blue-600 block">+75 Points</span>
            <strong className="text-slate-800">Achievement & Runner-Up</strong>
            <p className="text-slate-500 text-[11px] mt-0.5">Academic competition or symposium presentation award.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-emerald-600 block">+50 Points</span>
            <strong className="text-slate-800">External Certification</strong>
            <p className="text-slate-500 text-[11px] mt-0.5">Approved AWS, Coursera, NPTEL, or Oracle certificate upload.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-purple-600 block">+30 Points</span>
            <strong className="text-slate-800">Workshop & Participation</strong>
            <p className="text-slate-500 text-[11px] mt-0.5">Verified attendance at institutional hands-on tech events.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
