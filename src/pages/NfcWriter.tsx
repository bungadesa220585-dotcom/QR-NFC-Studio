import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NfcService } from '../services/NfcService';
import { ProfileService } from '../services/ProfileService';
import { HistoryService } from '../services/HistoryService';
import {
  Radio,
  Link2,
  FileText,
  UserSquare2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Info,
  RefreshCw,
  X,
} from 'lucide-react';

export const NfcWriter: React.FC = () => {
  const {
    isNfcSupported,
    nfcReason,
    showToast,
    showConfirm,
    triggerStatsRefresh,
    setCurrentPage,
  } = useApp();

  // Mode: 'url' | 'profile' | 'text'
  const [writeType, setWriteType] = useState<'url' | 'profile' | 'text'>('url');
  const [urlInput, setUrlInput] = useState<string>('https://google.com');
  const [textInput, setTextInput] = useState<string>('Halo dari tag NFC pintar!');

  const profiles = useMemo(() => ProfileService.getAll(), []);
  const [selectedProfileSlug, setSelectedProfileSlug] = useState<string>(
    profiles[0]?.slug || ''
  );

  // NFC Operation State
  const [status, setStatus] = useState<'idle' | 'waiting' | 'writing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Compute actual payload string
  const getPayload = (): { type: 'url' | 'text'; value: string; displaySummary: string } => {
    if (writeType === 'url') {
      const u = urlInput.trim();
      const fullUrl = /^https?:\/\//i.test(u) ? u : `https://${u}`;
      return { type: 'url', value: fullUrl, displaySummary: fullUrl };
    }
    if (writeType === 'profile') {
      const publicUrl = ProfileService.getPublicUrl(selectedProfileSlug);
      return {
        type: 'url',
        value: publicUrl,
        displaySummary: `Profil: /p/${selectedProfileSlug} (${publicUrl})`,
      };
    }
    return { type: 'text', value: textInput, displaySummary: textInput };
  };

  const payload = getPayload();
  const estimatedByteSize = new TextEncoder().encode(payload.value).length;

  // Start Writing flow with confirmation
  const handleInitiateWrite = () => {
    if (!isNfcSupported) {
      showToast(nfcReason || 'Web NFC tidak didukung pada browser ini', 'error');
      return;
    }

    if (!payload.value.trim()) {
      showToast('Data yang akan ditulis tidak boleh kosong', 'error');
      return;
    }

    // Show explicit confirmation dialog as required by guidelines
    showConfirm({
      title: 'Konfirmasi Penulisan Tag NFC',
      message: `Anda akan menulis data [${payload.type.toUpperCase()}]: "${payload.value}". Pastikan Anda siap menempelkan tag NFC pada bagian belakang perangkat.`,
      confirmText: 'Mulai Menulis',
      onConfirm: () => {
        executeWrite();
      },
    });
  };

  const executeWrite = async () => {
    setStatus('waiting');
    setStatusMessage('Mendekatkan tag NFC ke bagian belakang perangkat Android Anda...');
    setErrorMessage('');

    abortControllerRef.current = new AbortController();

    try {
      await NfcService.write(payload.type, payload.value, {
        signal: abortControllerRef.current.signal,
      });

      setStatus('success');
      setStatusMessage('Data berhasil ditulis ke tag NFC secara permanen!');
      showToast('Penulisan tag NFC berhasil!', 'success');

      // Record to history
      HistoryService.addItem({
        category: 'nfc',
        title: `Tulis NFC: ${writeType.toUpperCase()}`,
        dataType: payload.type,
        value: payload.value,
        status: 'berhasil',
      });
      triggerStatsRefresh();
    } catch (err: unknown) {
      const errObj = err as Error;
      if (errObj.message.includes('dibatalkan')) {
        setStatus('idle');
        setStatusMessage('Penulisan dibatalkan.');
        showToast('Operasi NFC dibatalkan', 'info');
      } else {
        setStatus('error');
        setErrorMessage(errObj.message || 'Gagal menulis ke tag NFC.');
        setStatusMessage('Gagal menyelesaikan penulisan.');
        showToast('Gagal menulis tag NFC', 'error');

        // Record failure in history
        HistoryService.addItem({
          category: 'nfc',
          title: `Gagal Tulis NFC: ${writeType.toUpperCase()}`,
          dataType: payload.type,
          value: payload.value,
          status: 'gagal',
          metadata: { error: errObj.message },
        });
        triggerStatsRefresh();
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setStatusMessage('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          NFC Writer (Penulis Tag)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tulis URL, tautan profil digital, atau pesan teks langsung ke stiker atau kartu NFC NDEF.
        </p>
      </div>

      {/* Hardware readiness notice */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
          isNfcSupported
            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
            : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isNfcSupported
              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700'
              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700'
          }`}
        >
          {isNfcSupported ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {isNfcSupported ? 'Browser Mendukung Web NFC' : 'Perangkat Tidak Mendukung Web NFC Secara Penuh'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            {isNfcSupported
              ? 'Fitur Web NFC aktif dan dapat berinteraksi dengan tag NTAG213, NTAG215, NTAG216, serta Mifare Ultralight.'
              : (nfcReason || 'Pastikan Anda menggunakan Google Chrome di Android dan mengaktifkan saklar NFC di pengaturan perangkat.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Type Selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Pilih Jenis Data NFC
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWriteType('url')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  writeType === 'url'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Link2 className="w-4 h-4 mb-1" />
                <span>URL / Web</span>
              </button>

              <button
                type="button"
                onClick={() => setWriteType('profile')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  writeType === 'profile'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <UserSquare2 className="w-4 h-4 mb-1" />
                <span>Profil Digital</span>
              </button>

              <button
                type="button"
                onClick={() => setWriteType('text')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  writeType === 'text'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4 mb-1" />
                <span>Teks Bebas</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Rincian Konten NDEF
            </h3>

            {writeType === 'url' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  URL Tujuan
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://perusahaan.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Saat kartu ditempelkan ke ponsel pengguna lain, peramban akan otomatis membuka tautan ini.
                </p>
              </div>
            )}

            {writeType === 'profile' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Profil Digital
                </label>
                {profiles.length === 0 ? (
                  <p className="text-xs text-rose-500">
                    Belum ada profil digital. Buat profil terlebih dahulu di menu Profil Digital.
                  </p>
                ) : (
                  <select
                    value={selectedProfileSlug}
                    onChange={e => setSelectedProfileSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.slug}>
                        {p.fullName} ({p.slug})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-slate-500">
                  Menulis URL kartu digital publik ke tag NFC untuk interaksi kartu nama pintar (Smart Business Card).
                </p>
              </div>
            )}

            {writeType === 'text' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pesan Teks NDEF
                </label>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Ketik teks yang ingin disimpan dalam memori tag NFC..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

              {/* Tag Memory Capacity & 13.56 MHz Frequency Guide */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                    <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Frekuensi Kartu: 13.56 MHz (HF)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    ISO/IEC 14443A
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                  <span>Ukuran Data Yang Ditulis:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {estimatedByteSize} Bytes
                  </span>
                </div>

                {/* Chip memory capacity indicators */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className={`p-2 rounded-xl border text-center transition-all ${
                    estimatedByteSize <= 144
                      ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300'
                  }`}>
                    <span className="block font-bold">NTAG213</span>
                    <span className="text-[10px] text-slate-500">144 Bytes</span>
                    <span className="block text-[9px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {estimatedByteSize <= 144 ? 'Muat' : 'Penuh'}
                    </span>
                  </div>

                  <div className={`p-2 rounded-xl border text-center transition-all ${
                    estimatedByteSize <= 504
                      ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300'
                  }`}>
                    <span className="block font-bold">NTAG215</span>
                    <span className="text-[10px] text-slate-500">504 Bytes</span>
                    <span className="block text-[9px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {estimatedByteSize <= 504 ? 'Muat' : 'Penuh'}
                    </span>
                  </div>

                  <div className={`p-2 rounded-xl border text-center transition-all ${
                    estimatedByteSize <= 888
                      ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300'
                  }`}>
                    <span className="block font-bold">NTAG216</span>
                    <span className="text-[10px] text-slate-500">888 Bytes</span>
                    <span className="block text-[9px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {estimatedByteSize <= 888 ? 'Muat' : 'Penuh'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  Kartu frekuensi 13.56 MHz (NTAG213/215/216) adalah standar resmi NFC smartphone. Pastikan kartu Anda memiliki format NDEF.
                </p>
              </div>
            </div>

          {/* Safety & Permanent Lock Policy Note */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>Kebijakan Keamanan Tag</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              Aplikasi ini secara sengaja <strong>tidak mengunci (lock)</strong> tag secara permanen, sehingga stiker atau kartu NFC Anda tetap dapat ditimpa dan digunakan kembali kapan saja.
            </p>
          </div>
        </div>

        {/* Right Status & Action Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center">
            {/* Status Visual Animation */}
            <div className="py-6 flex flex-col items-center justify-center">
              {status === 'idle' && (
                <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                  <Radio className="w-10 h-10" />
                </div>
              )}

              {status === 'waiting' && (
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center animate-pulse">
                    <Smartphone className="w-10 h-10" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                  </span>
                </div>
              )}

              {status === 'success' && (
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              )}

              {status === 'error' && (
                <div className="w-24 h-24 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-12 h-12" />
                </div>
              )}

              <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
                {status === 'idle' && 'Siap Memprogram Tag'}
                {status === 'waiting' && 'Mendekatkan Tag NFC...'}
                {status === 'success' && 'Penulisan Berhasil!'}
                {status === 'error' && 'Penulisan Gagal'}
              </h3>

              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                {status === 'idle' && 'Tempelkan stiker atau kartu NFC ke bagian belakang antena perangkat saat proses dimulai.'}
                {status === 'waiting' && statusMessage}
                {status === 'success' && statusMessage}
                {status === 'error' && errorMessage}
              </p>
            </div>

            {/* Pre-write payload summary box */}
            <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Ringkasan Data yang Akan Ditulis:
              </span>
              <p className="font-mono text-slate-800 dark:text-slate-200 break-all text-[11px]">
                {payload.displaySummary}
              </p>
            </div>

            {/* Control buttons */}
            <div className="space-y-2">
              {status === 'idle' || status === 'success' || status === 'error' ? (
                <button
                  type="button"
                  onClick={handleInitiateWrite}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all"
                >
                  <Radio className="w-4 h-4" />
                  <span>{status === 'success' ? 'Tulis ke Tag Lain' : 'Mulai Menulis ke Tag'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Batalkan Penulisan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
