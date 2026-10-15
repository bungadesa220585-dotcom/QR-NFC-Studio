import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { OwnerProfileModal } from './components/OwnerProfileModal';
import { LockScreen } from './components/LockScreen';

// Pages
import { Dashboard } from './pages/Dashboard';
import { QrGenerator } from './pages/QrGenerator';
import { DigitalProfiles } from './pages/DigitalProfiles';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { NfcWriter } from './pages/NfcWriter';
import { NfcReader } from './pages/NfcReader';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { currentPage, isLocked, owner } = useApp();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'qr-generator':
        return <QrGenerator />;
      case 'profiles':
        return <DigitalProfiles />;
      case 'profile-public':
        return <PublicProfilePage />;
      case 'nfc-writer':
        return <NfcWriter />;
      case 'nfc-reader':
        return <NfcReader />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  // If viewing standalone public profile, offer a focused clean layout without the studio sidebar
  const isPublicProfileView = currentPage === 'profile-public';

  if (isPublicProfileView) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4">
        <PublicProfilePage />
        <ToastContainer />
        <ConfirmModal />
      </div>
    );
  }

  // If studio is locked by owner PIN, show LockScreen
  if (isLocked && owner.pinEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <LockScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Desktop and Mobile Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <OwnerProfileModal />
      <ToastContainer />
      <ConfirmModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
