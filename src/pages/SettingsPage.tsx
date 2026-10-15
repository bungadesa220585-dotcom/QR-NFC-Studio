import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/StorageService';
import { NfcService } from '../services/NfcService';
import { AuthService } from '../services/AuthService';
import { 
  auth, 
  signInWithPopup, 
  googleProvider, 
  firebaseSignOut, 
  onAuthStateChanged, 
  type User 
} from '../services/firebase';
import { FirestoreSyncService } from '../services/FirestoreSyncService';
import {
  Settings,
  Sun,
  Moon,
  Database,
  Cloud,
  Download,
  Upload,
  Radio,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Cpu,
  User as UserIcon,
  Lock,
  Unlock,
  KeyRound,
  Shield,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    isNfcSupported,
    nfcReason,
    showToast,
    showConfirm,
    triggerStatsRefresh,
    owner,
    lockStudio,
    togglePinLock,
    changePin,
    setIsOwnerModalOpen,
  } = useApp();

  const [importJsonText, setImportJsonText] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Firebase Auth & Cloud Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const res = await signInWithPopup(auth, googleProvider);
      showToast(`Berhasil masuk sebagai ${res.user.displayName || res.user.email}!`, 'success');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal login dengan Google';
      showToast(msg, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      showToast('Berhasil keluar dari akun Google.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal keluar';
      showToast(msg, 'error');
    }
  };

  const handleSyncToCloud = async () => {
    if (!firebaseUser) {
      showToast('Silakan login dengan Google terlebih dahulu untuk sinkronisasi.', 'info');
      return;
    }
    try {
      setIsSyncing(true);
      const res = await FirestoreSyncService.syncAllLocalProfilesToCloud();
      showToast(`Sinkronisasi sukses! ${res.uploaded} profil tersimpan di Cloud Firestore.`, 'success');
      triggerStatsRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal sinkronisasi data';
      showToast(msg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!firebaseUser) {
      showToast('Silakan login dengan Google terlebih dahulu.', 'info');
      return;
    }
    try {
      setIsSyncing(true);
      const count = await FirestoreSyncService.pullProfilesFromCloud();
      showToast(`Berhasil mengunduh ${count} profil dari Cloud Firestore!`, 'success');
      triggerStatsRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunduh data cloud';
      showToast(msg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Form ganti PIN
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [oldPinInput, setOldPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');


  // Storage Stats (LocalStorage rough usage)
  const storageUsage = useMemo(() => {
    let totalLength = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        totalLength += (localStorage[x].length * 2);
      }
    }
    const kb = (totalLength / 1024).toFixed(2);
    return `${kb} KB`;
  }, []);

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-nfc-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Cadangan data berhasil diekspor (JSON)', 'success');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      showToast('Masukkan isi teks JSON cadangan', 'error');
      return;
    }

    const res = StorageService.importAllData(importJsonText);
    if (res.success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
      triggerStatsRefresh();
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleClearAllStorage = () => {
    showConfirm({
      title: 'Reset Seluruh Data Aplikasi?',
      message: 'Perhatian: Tindakan ini akan menghapus semua profil lokal, riwayat QR, dan catatan NFC yang tersimpan di perangkat ini.',
      confirmText: 'Reset Data Sekarang',
      isDestructive: true,
      onConfirm: () => {
        StorageService.clearAll();
        triggerStatsRefresh();
        showToast('Seluruh data lokal telah dibersihkan', 'info');
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Pengaturan Studio & Arsitektur
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi tampilan antarmuka, autentikasi akun lokal, status penyimpanan data, serta diagnostik hardware Web NFC.
        </p>
      </div>

      {/* Owner Profile & Security Lock (Option B: Single Owner Mode) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Profil Pemilik & Kunci Keamanan Studio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mode Pengguna Tunggal &bull; Khusus untuk Anda pribadi di perangkat ini
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            Pemilik Tunggal Aktif
          </span>
        </div>

        {/* Owner Details Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center gap-3.5">
            <img
              src={owner.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={owner.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {owner.name}
                </h4>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                  @{owner.username}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {owner.role || 'Pemilik Studio'} {owner.email ? `• ${owner.email}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  owner.pinEnabled 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' 
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  <Lock className="w-3 h-3" />
                  {owner.pinEnabled ? 'PIN Terlindungi' : 'Kunci PIN Belum Aktif'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsOwnerModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors"
            >
              Edit Profil Pemilik
            </button>
          </div>
        </div>

        {/* PIN Security Controls */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Pengamanan Kunci PIN</span>
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
                Kunci studio dengan PIN agar kartu NFC dan profil digital Anda tidak dapat diubah oleh orang lain saat meminjam ponsel.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextState = !owner.pinEnabled;
                togglePinLock(nextState);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                owner.pinEnabled
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
              }`}
            >
              {owner.pinEnabled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aktif</span>
                </>
              ) : (
                <span>Nonaktif</span>
              )}
            </button>
          </div>

          {owner.pinEnabled && (
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={lockStudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Studio Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(!isChangingPin)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  {isChangingPin ? 'Tutup Ubah PIN' : 'Ubah PIN Pemilik'}
                </button>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                PIN default awal: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">1234</span>
              </span>
            </div>
          )}

          {/* Changing PIN Form */}
          {isChangingPin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPinInput !== confirmPinInput) {
                  showToast('Konfirmasi PIN baru tidak cocok', 'error');
                  return;
                }
                const res = changePin(oldPinInput, newPinInput);
                if (res.success) {
                  setIsChangingPin(false);
                  setOldPinInput('');
                  setNewPinInput('');
                  setConfirmPinInput('');
                }
              }}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 space-y-3 animate-in fade-in duration-150"
            >
              <h6 className="text-xs font-bold text-slate-900 dark:text-white">
                Formulir Perubahan PIN Pemilik
              </h6>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    PIN Lama
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPinInput}
                    onChange={(e) => setOldPinInput(e.target.value)}
                    placeholder="PIN saat ini"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    PIN Baru (min 4 digit)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="PIN baru"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Konfirmasi PIN Baru
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Ulangi PIN baru"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                >
                  Simpan PIN Baru
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          <span>Tema & Tampilan Antarmuka</span>
        </h3>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Mode Gelap (Dark Mode)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mengurangi kelelahan mata dan menghemat konsumsi daya baterai layar OLED/AMOLED ponsel.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-800 shadow-xs'
            }`}
          >
            {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{isDarkMode ? 'Aktif' : 'Nonaktif'}</span>
          </button>
        </div>
      </div>

      {/* Hardware / Web NFC Diagnostics */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-500" />
          <span>Diagnostik Perangkat & Web NFC API</span>
        </h3>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Status Antarmuka Web NFC:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold ${
                  isNfcSupported
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {isNfcSupported ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                <span>{isNfcSupported ? 'Tersedia & Didukung' : 'Tidak Tersedia'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Koneksi Aman (HTTPS):
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {window.isSecureContext ? 'Ya (Secure Context)' : 'Tidak (Insecure)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                User Agent Browser:
              </span>
              <span className="font-mono text-[11px] text-slate-500 max-w-xs truncate">
                {navigator.userAgent}
              </span>
            </div>

            {!isNfcSupported && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-amber-800 dark:text-amber-300 text-[11px]">
                <p className="font-bold">Panduan Kompatibilitas:</p>
                <p className="mt-0.5 leading-relaxed">
                  Web NFC API memerlukan perangkat Android dengan modul NFC fisik dan browser Google Chrome versi 89 ke atas. Jika menggunakan desktop atau browser non-Chromium, fitur QR Code dan Profil tetap berfungsi 100%.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Database (Firebase Firestore) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Cloud Database (Firebase Firestore)</span>
          </h3>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Terhubung ke Firebase (Active)</span>
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Database Cloud Firestore memungkinkan kartu nama digital Anda dapat diakses dan dilihat langsung oleh orang lain secara publik saat stiker NFC ditempelkan atau kode QR discan di ponsel manapun, tanpa perlu satu jaringan lokal.
        </p>

        {/* Firebase Authentication Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {firebaseUser?.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {firebaseUser ? (firebaseUser.displayName || 'Pengguna Google') : 'Belum Masuk Akun Cloud'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {firebaseUser ? firebaseUser.email : 'Masuk dengan Google untuk sinkronisasi cloud real-time'}
                </p>
              </div>
            </div>

            {firebaseUser ? (
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Keluar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto disabled:opacity-50"
              >
                {isLoggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Masuk dengan Google</span>
              </button>
            )}
          </div>

          {/* Sync actions if logged in */}
          {firebaseUser && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Unggah Profil ke Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromCloud}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs disabled:opacity-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tarik Profil dari Cloud</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Storage Architecture & Local Backup */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          <span>Cadangan Lokal & Pengaturan Memori</span>
        </h3>

        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-950 dark:text-indigo-200">
              Penyimpanan Cepat Perangkat:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-bold">
              Aktif (Offline First)
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Aplikasi tetap bekerja seketika walau tanpa sinyal internet menggunakan penyimpanan lokal.
          </p>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <span>Perkiraan Memori Lokal Digunakan:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {storageUsage}
            </span>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cadangan & Pemulihan Berkas (JSON)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-500" />
              <span>Ekspor Cadangan (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>Impor Cadangan (JSON)</span>
            </button>
          </div>
        </div>

        {/* Destructive Reset */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Reset Data Perangkat
            </h4>
            <p className="text-[11px] text-slate-500">
              Hapus seluruh riwayat, profil lokal, dan preferensi tersimpan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAllStorage}
            className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            Reset Bersih
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">
              Impor Cadangan Data JSON
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Tempelkan teks data JSON yang sebelumnya diekspor dari aplikasi QR & NFC Studio.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                rows={8}
                value={importJsonText}
                onChange={e => setImportJsonText(e.target.value)}
                placeholder='{"exportDate": "...", "profiles": [...], "history": [...]}'
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Proses Impor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
