import React, { useState, useEffect } from 'react';
import { AcademicEvent } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CreateEventModal } from '../components/CreateEventModal';
import { IssueCertificateModal } from '../components/IssueCertificateModal';
import { Calendar, Plus, Trophy, Building2, Search, CheckCircle, Award } from 'lucide-react';

interface EventsPageProps {
  onNavigateToVerify?: (id: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('All');
  const [search, setSearch] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [enrolledEvents, setEnrolledEvents] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = (eventId: string) => {
    if (!enrolledEvents.includes(eventId)) {
      setEnrolledEvents([...enrolledEvents, eventId]);
    }
  };

  const filtered = events.filter(e => {
    const matchesType = filterType === 'All' || e.event_type === filterType;
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.institution_name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const canHost = user?.role === 'issuer' || user?.role === 'admin';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Events & Hackathons</h1>
          <p className="text-xs text-slate-500 mt-1">
            Participate in verified collegiate hackathons, symposiums, and courses to earn digital credentials.
          </p>
        </div>

        {canHost && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Host New Event</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['All', 'Hackathon', 'Workshop', 'Conference', 'Course'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ev) => {
          const isEnrolled = enrolledEvents.includes(ev.id);
          return (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 uppercase">
                    {ev.event_type}
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                    +{ev.points_reward} pts
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{ev.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.institution_name}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {ev.description || 'Inter-institutional academic challenge offering cryptographically signed credentials.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(ev.event_date).toLocaleDateString()}</span>
                </div>

                {canHost ? (
                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                  >
                    Issue Certificates
                  </button>
                ) : (
                  <button
                    onClick={() => handleEnroll(ev.id)}
                    disabled={isEnrolled}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                      isEnrolled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                    }`}
                  >
                    {isEnrolled ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Registered</span>
                      </>
                    ) : (
                      <span>Register for Event</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newEvent) => {
            setEvents([newEvent, ...events]);
          }}
        />
      )}

      {showIssueModal && (
        <IssueCertificateModal
          onClose={() => setShowIssueModal(false)}
          onIssued={() => {
            loadEvents();
          }}
        />
      )}

    </div>
  );
};
