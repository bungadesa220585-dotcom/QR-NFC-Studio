import React from 'react';
import { useApp } from '../context/AppContext';
import { PageType } from '../types';
import {
  LayoutDashboard,
  QrCode,
  UserSquare2,
  Radio,
  ScanLine,
  History,
  Settings,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  id: PageType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Beranda', icon: LayoutDashboard },
  { id: 'qr-generator', label: 'QR Generator', shortLabel: 'QR Code', icon: QrCode },
  { id: 'profiles', label: 'Profil Digital', shortLabel: 'Profil', icon: UserSquare2 },
  { id: 'nfc-writer', label: 'Tulis NFC', shortLabel: 'Tulis NFC', icon: Radio },
  { id: 'nfc-reader', label: 'Baca NFC', shortLabel: 'Baca NFC', icon: ScanLine },
  { id: 'history', label: 'Riwayat Proyek', shortLabel: 'Riwayat', icon: History },
  { id: 'settings', label: 'Pengaturan', shortLabel: 'Setelan', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, isNfcSupported } = useApp();

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none min-h-screen">
        {/* Brand */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                QR & NFC Studio
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Alat Digital & Kartu Cerdas
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'nfc-writer' && isNfcSupported && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info card */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-indigo-50/60 to-slate-100 dark:from-slate-800/60 dark:to-slate-800/20 border border-indigo-100/60 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format NDEF Resmi</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            Mendukung stiker NTAG213/215/216 dan QR Code standar ISO/IEC 18004.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (optimized for Android & iOS) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {NAV_ITEMS.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
            </button>
          );
        })}
        {/* Additional mobile buttons for History or Settings */}
        <button
          onClick={() => setCurrentPage(currentPage === 'history' ? 'settings' : 'history')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentPage === 'history' || currentPage === 'settings'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentPage === 'history' || currentPage === 'settings' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
            {currentPage === 'settings' ? <Settings className="w-5 h-5" /> : <History className="w-5 h-5" />}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {currentPage === 'settings' ? 'Setelan' : 'Riwayat'}
          </span>
        </button>
      </nav>
    </>
  );
};
