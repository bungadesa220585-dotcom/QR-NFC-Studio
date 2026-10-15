import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NfcService } from '../services/NfcService';
import { HistoryService } from '../services/HistoryService';
import { NfcRecordData } from '../types';
import {
  ScanLine,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Copy,
  ExternalLink,
  RotateCcw,
  StopCircle,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const NfcReader: React.FC = () => {
  const { isNfcSupported, nfcReason, showToast, triggerStatsRefresh } = useApp();

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [records, setRecords] = useState<NfcRecordData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop scanning when unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartScan = async () => {
    if (!isNfcSupported) {
      showToast(nfcReason || 'Web NFC tidak didukung pada browser ini', 'error');
      return;
    }

    setErrorMessage('');
    setRecords([]);
    setSerialNumber('');
    setIsScanning(true);

    abortControllerRef.current = new AbortController();

    try {
      await NfcService.startScan({
        signal: abortControllerRef.current.signal,
        onReading: (serial, scannedRecords) => {
          setSerialNumber(serial);
          setRecords(scannedRecords);
          setIsScanning(false);
          showToast('Tag NFC berhasil dipindai!', 'success');

          // Record to History
          const primaryData = scannedRecords[0]?.data || 'Tanpa rekaman';
          HistoryService.addItem({
            category: 'nfc',
            title: `Baca NFC (Tag: ${serial || 'N/A'})`,
            dataType: scannedRecords[0]?.recordType || 'unknown',
            value: primaryData,
            status: 'berhasil',
            metadata: { recordsCount: scannedRecords.length },
          });
          triggerStatsRefresh();
        },
        onError: err => {
          setErrorMessage(err.message || 'Gagal membaca tag.');
          showToast('Gagal membaca tag NFC', 'error');
        },
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        setErrorMessage(error.message || 'Gagal memulai pemindai NFC.');
        setIsScanning(false);
      }
    }
  };

  const handleStopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
    showToast('Pemindaian dihentikan', 'info');
  };

  const handleCopyText = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      showToast('Data berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast('Gagal menyalin', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          NFC Reader (Pembaca Tag)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pindai stiker, kartu pintar, atau gantungan kunci NFC NDEF di dekat perangkat Anda secara aman.
        </p>
      </div>

      {/* Hardware check badge */}
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
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isNfcSupported ? 'Sensor Web NFC Siap Membaca' : 'Dukungan Pembacaan NFC Terbatas'}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              13.56 MHz HF &bull; NDEF
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {isNfcSupported
              ? 'Dekatkan kartu atau stiker frekuensi 13.56 MHz (NTAG213/215/216) ke antena perangkat saat pemindai diaktifkan.'
              : (nfcReason || 'Perangkat atau browser ini belum mendukung Web NFC.')}
          </p>
        </div>
      </div>

      {/* Scanner Control & Result Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Scanner Controller (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-6">
          <div className="py-4 flex flex-col items-center justify-center">
            {isScanning ? (
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center animate-pulse">
                  <ScanLine className="w-10 h-10" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                </span>
              </div>
            ) : records.length > 0 ? (
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                <Smartphone className="w-10 h-10" />
              </div>
            )}

            <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
              {isScanning ? 'Mencari Tag di Dekat Anda...' : records.length > 0 ? 'Tag Terbaca!' : 'Pemindai Siap'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {isScanning
                ? 'Dekatkan bagian belakang ponsel ke tag NFC dan tahan sebentar.'
                : 'Klik tombol di bawah untuk mulai memindai rekaman NDEF.'}
            </p>
          </div>

          <div className="space-y-2">
            {!isScanning ? (
              <button
                type="button"
                onClick={handleStartScan}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all"
              >
                <ScanLine className="w-4 h-4" />
                <span>{records.length > 0 ? 'Baca Lagi' : 'Mulai Membaca'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopScan}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all"
              >
                <StopCircle className="w-4 h-4" />
                <span>Hentikan Pembacaan</span>
              </button>
            )}
          </div>

          {/* Security Principle Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-indigo-500" />
              Prinsip Keamanan Data:
            </span>
            Isi tag diperlakukan sebagai data tidak tepercaya. Tautan URL tidak akan dibuka secara otomatis untuk melindungi privasi dan keamanan Anda.
          </div>
        </div>

        {/* Read Records Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Hasil Rekaman NDEF Terbaca
            </h3>
            {serialNumber && (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                UID: {serialNumber}
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Membaca Tag</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {records.length === 0 && !errorMessage ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              <ScanLine className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p>Belum ada data rekaman terbaca.</p>
              <p className="mt-1 text-[11px]">Tekan &ldquo;Mulai Membaca&rdquo; dan dekatkan tag ke perangkat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((rec, idx) => {
                const isUrl = rec.recordType === 'url' || /^https?:\/\//i.test(rec.data);
                const safeUrl = isUrl ? (rec.data.startsWith('http') ? rec.data : `https://${rec.data}`) : null;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        Rekaman #{idx + 1} &bull; {rec.recordType.toUpperCase()}
                      </span>

                      {rec.lang && (
                        <span className="text-[10px] text-slate-400">
                          Bahasa: {rec.lang}
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                      {rec.data || '(Rekaman Kosong)'}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyText(rec.data, idx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedIndex === idx ? 'Tersalin' : 'Salin Data'}</span>
                      </button>

                      {safeUrl && (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Tautan</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
