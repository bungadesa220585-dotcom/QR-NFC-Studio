import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HistoryService } from '../services/HistoryService';
import { ProfileService } from '../services/ProfileService';
import {
  QrCode,
  UserSquare2,
  Radio,
  ScanLine,
  ArrowRight,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Clock,
  PlusCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    setCurrentPage,
    isNfcSupported,
    nfcReason,
    refreshStatsTrigger,
    openPublicProfile,
    owner,
    setIsOwnerModalOpen,
  } = useApp();

  const stats = useMemo(() => {
    return HistoryService.getStats();
  }, [refreshStatsTrigger]);

  const recentHistory = useMemo(() => {
    return HistoryService.getAll().slice(0, 5);
  }, [refreshStatsTrigger]);

  const profiles = useMemo(() => {
    return ProfileService.getAll();
  }, [refreshStatsTrigger]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide text-indigo-200 mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Studio Pribadi &bull; {owner.name}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Selamat Datang di Studio Pribadi Anda, {owner.name.split(' ')[0]}!
          </h2>
          <p className="mt-3 text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Pusat kendali eksklusif untuk menghasilkan QR Code berkualitas, membuat kartu nama digital profesional, serta memprogram stiker dan kartu NFC pintar (13.56 MHz).
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setCurrentPage('qr-generator')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-sm shadow-md hover:bg-indigo-50 transition-colors"
            >
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Buat QR Code</span>
            </button>
            <button
              onClick={() => setCurrentPage('nfc-writer')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-sm border border-white/20 transition-colors"
            >
              <Radio className="w-4 h-4" />
              <span>Program Tag NFC</span>
            </button>
          </div>
        </div>

        {/* Decorative watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none select-none">
          <QrCode className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Hardware / NFC Status Notification */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
          isNfcSupported
            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60'
            : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/60'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isNfcSupported
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            {isNfcSupported ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isNfcSupported ? 'Web NFC Siap & Aktif' : 'Status Kompatibilitas Web NFC'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {isNfcSupported
                ? 'Browser ini mendukung Web NFC API. Anda dapat langsung menulis & membaca tag NDEF.'
                : nfcReason || 'Memerlukan browser Chrome di perangkat Android dengan antena NFC aktif.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentPage('settings')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
        >
          Lihat Diagnostik
        </button>
      </div>

      {/* Metrics Row (REAL DATA) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              QR Code Dibuat
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.qrCount}
            </h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <UserSquare2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Profil Digital
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.profileCount}
            </h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Operasi NFC
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.nfcCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 4 Feature Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Fitur Utama Studio
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Pilih modul untuk memulai
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: QR Generator */}
          <div
            onClick={() => setCurrentPage('qr-generator')}
            className="group cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
              <span>QR Code Generator</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Konversi URL, Wi-Fi, vCard, atau teks menjadi QR Code tajam dengan warna kustom.
            </p>
          </div>

          {/* Card 2: Digital Profiles */}
          <div
            onClick={() => setCurrentPage('profiles')}
            className="group cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex items-center justify-between">
              <span>Profil Digital</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Kartu nama digital pintar dengan tautan media sosial, kontak, dan tautan publik langsung.
            </p>
          </div>

          {/* Card 3: NFC Writer */}
          <div
            onClick={() => setCurrentPage('nfc-writer')}
            className="group cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-4 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
              <span>NFC Writer</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tulis URL atau profil ke kartu/stiker NTAG213/215/216 dengan aman dan terverifikasi.
            </p>
          </div>

          {/* Card 4: NFC Reader */}
          <div
            onClick={() => setCurrentPage('nfc-reader')}
            className="group cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <ScanLine className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
              <span>NFC Reader</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pindai tag NFC di dekat perangkat dan periksa isi rekaman NDEF secara aman tanpa otomatis membuka link.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Digital Profiles Preview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quick Profile Access */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <UserSquare2 className="w-4 h-4 text-violet-500" />
              <span>Profil Digital Tersedia ({profiles.length})</span>
            </h3>
            <button
              onClick={() => setCurrentPage('profiles')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Kelola Semua
            </button>
          </div>

          {profiles.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belum ada profil digital yang dibuat.
              </p>
              <button
                onClick={() => setCurrentPage('profiles')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Buat Profil Pertama</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.slice(0, 3).map(profile => (
                <div
                  key={profile.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={profile.fullName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {profile.fullName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {profile.title || 'Profil Pribadi'} {profile.company ? `• ${profile.company}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openPublicProfile(profile.slug)}
                      className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      title="Buka Halaman Publik"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Riwayat Aktivitas Terbaru</span>
            </h3>
            <button
              onClick={() => setCurrentPage('history')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Lihat Riwayat
            </button>
          </div>

          {recentHistory.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belum ada aktivitas tercatat. Mulai buat QR Code atau tulis NFC sekarang.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentHistory.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.category === 'qr'
                          ? 'bg-indigo-500'
                          : item.category === 'nfc'
                          ? 'bg-sky-500'
                          : 'bg-violet-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-200 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.value}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
