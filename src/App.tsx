import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PublicVerifyPage } from './pages/PublicVerifyPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { IssuerDashboard } from './pages/IssuerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { EventsPage } from './pages/EventsPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ShieldCheck, Database, Lock, Award, Heart } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('verify');
  const [verifyCertId, setVerifyCertId] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const navigateToVerify = (certId: string) => {
    setVerifyCertId(certId);
    setCurrentTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToEvents = () => {
    setCurrentTab('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'verify' && (
          <PublicVerifyPage initialCertId={verifyCertId} />
        )}

        {currentTab === 'dashboard' && (
          <>
            {user?.role === 'student' && (
              <StudentDashboard
                onNavigateToVerify={navigateToVerify}
                onNavigateToEvents={navigateToEvents}
              />
            )}
            {user?.role === 'issuer' && (
              <IssuerDashboard onNavigateToVerify={navigateToVerify} />
            )}
            {user?.role === 'admin' && (
              <AdminDashboard onNavigateToVerify={navigateToVerify} />
            )}
          </>
        )}

        {currentTab === 'events' && (
          <EventsPage onNavigateToVerify={navigateToVerify} />
        )}

        {currentTab === 'institutions' && (
          <InstitutionsPage />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardPage />
        )}
      </main>

      {/* Global Security & Infrastructure Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Digital Certificate Verification System</span>
            </div>
            <span>•</span>
            <span className="flex items-center space-x-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Embedded Database Active</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>SHA-256 Cryptographic Assurance</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>ISO & Academic Standards</span>
            </span>
          </div>

        </div>
      </footer>

      {/* Login & Student Registration Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
