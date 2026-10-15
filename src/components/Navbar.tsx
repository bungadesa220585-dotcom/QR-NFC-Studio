import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, Sun, Moon, Radio, ShieldCheck, Lock, User, Settings, ChevronDown } from 'lucide-react';

export const Navbar: React.FC<{ onMenuToggle?: () => void }> = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    isNfcSupported,
    nfcReason,
    owner,
    lockStudio,
    setIsOwnerModalOpen,
    setCurrentPage,
  } = useApp();

  const [isOwnerMenuOpen, setIsOwnerMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Brand logo for mobile (hidden on desktop where sidebar shows it) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
            QR & NFC Studio
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Studio Pribadi &bull; Khusus Penggunaan Anda &bull; Frekuensi 13.56 MHz</span>
      </div>

      {/* Right side tools */}
      <div className="flex items-center gap-2.5">
        {/* NFC Status Indicator Pill */}
        <div
          title={isNfcSupported ? 'Web NFC API Aktif & Siap Digunakan (13.56 MHz)' : (nfcReason || 'Web NFC tidak didukung')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isNfcSupported
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400'
          }`}
        >
          {isNfcSupported ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>NFC Ready</span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">NFC Terbatas</span>
              <span className="sm:hidden">NFC</span>
            </>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          aria-label="Ganti mode tema"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Lock Button (Quick lock if PIN is active) */}
        {owner.pinEnabled && (
          <button
            onClick={lockStudio}
            title="Kunci Studio Sekarang"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors text-xs font-bold"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kunci</span>
          </button>
        )}

        {/* Owner Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOwnerMenuOpen(!isOwnerMenuOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
          >
            <img
              src={owner.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={owner.name}
              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
              }}
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                {owner.name}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold leading-tight">
                Pemilik Studio
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isOwnerMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOwnerMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {owner.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {owner.email || `@${owner.username}`}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      {owner.pinEnabled ? 'Kunci PIN: Aktif' : 'Kunci PIN: Nonaktif'}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsOwnerMenuOpen(false);
                      setIsOwnerModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Edit Profil Pemilik</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOwnerMenuOpen(false);
                      setCurrentPage('settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Pengaturan & Keamanan</span>
                  </button>

                  {owner.pinEnabled && (
                    <button
                      onClick={() => {
                        setIsOwnerMenuOpen(false);
                        lockStudio();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Kunci Studio Sekarang</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
