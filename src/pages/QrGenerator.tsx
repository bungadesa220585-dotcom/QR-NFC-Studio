import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { QrDataType, WifiData, VCardData } from '../types';
import { QrService } from '../services/QrService';
import { HistoryService } from '../services/HistoryService';
import { ProfileService } from '../services/ProfileService';
import {
  QrCode,
  Link2,
  FileText,
  Phone,
  Mail,
  Wifi,
  Contact2,
  UserSquare2,
  Download,
  Copy,
  RotateCcw,
  BookmarkCheck,
  AlertTriangle,
  Sparkles,
  Palette,
  Sliders,
  Check,
} from 'lucide-react';

export const QrGenerator: React.FC = () => {
  const { showToast, triggerStatsRefresh } = useApp();

  // State tipe QR
  const [qrType, setQrType] = useState<QrDataType>('url');

  // Input states
  const [urlInput, setUrlInput] = useState<string>('https://google.com');
  const [textInput, setTextInput] = useState<string>('Halo dari QR & NFC Studio!');
  const [phoneInput, setPhoneInput] = useState<string>('+6281234567890');
  const [emailInput, setEmailInput] = useState<string>('kontak@perusahaan.com');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [wifiData, setWifiData] = useState<WifiData>({
    ssid: 'Studio-Office-5G',
    password: '',
    encryption: 'WPA',
    hidden: false,
  });
  const [vcardData, setVcardData] = useState<VCardData>({
    firstName: 'Budi',
    lastName: 'Santoso',
    organization: 'Nusantara Tech',
    title: 'Senior Developer',
    phone: '+6281234567890',
    email: 'budi@example.com',
    url: 'https://budisantoso.dev',
    address: 'Jakarta, Indonesia',
  });

  // Profiles list for profile QR type
  const profiles = useMemo(() => ProfileService.getAll(), []);
  const [selectedProfileSlug, setSelectedProfileSlug] = useState<string>(
    profiles[0]?.slug || ''
  );

  // Styling states
  const [fgColor, setFgColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [exportSize, setExportSize] = useState<number>(512);

  // Output states
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentRawPayload, setCurrentRawPayload] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Calculate Contrast
  const contrastCheck = useMemo(() => {
    return QrService.checkContrast(fgColor, bgColor);
  }, [fgColor, bgColor]);

  // Generate payload string according to active type
  const getPayload = (): string => {
    switch (qrType) {
      case 'url':
        return QrService.formatData('url', urlInput);
      case 'text':
        return textInput;
      case 'phone':
        return QrService.formatData('phone', phoneInput);
      case 'email':
        return emailSubject ? `mailto:${emailInput}?subject=${encodeURIComponent(emailSubject)}` : QrService.formatData('email', emailInput);
      case 'wifi':
        return QrService.formatData('wifi', wifiData);
      case 'vcard':
        return QrService.formatData('vcard', vcardData);
      case 'profile': {
        const publicUrl = ProfileService.getPublicUrl(selectedProfileSlug);
        return publicUrl;
      }
      default:
        return '';
    }
  };

  // Re-render QR code whenever inputs, colors or sizes change
  useEffect(() => {
    let isCancelled = false;
    const generate = async () => {
      setErrorMessage('');
      const payload = getPayload();
      setCurrentRawPayload(payload);

      if (!payload.trim()) {
        setQrDataUrl('');
        return;
      }

      // Check validation
      let valCheck: { valid: boolean; message?: string } = { valid: true };
      if (qrType === 'url') valCheck = QrService.validate('url', urlInput);
      else if (qrType === 'email') valCheck = QrService.validate('email', emailInput);
      else if (qrType === 'phone') valCheck = QrService.validate('phone', phoneInput);
      else if (qrType === 'wifi') valCheck = QrService.validate('wifi', wifiData);
      else if (qrType === 'vcard') valCheck = QrService.validate('vcard', vcardData);

      if (!valCheck.valid) {
        setErrorMessage(valCheck.message || 'Input data tidak valid');
        return;
      }

      try {
        setIsGenerating(true);
        const dataUrl = await QrService.generateDataUrl(payload, {
          fgColor,
          bgColor,
          width: exportSize,
          errorCorrectionLevel: 'M',
        });
        if (!isCancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const errObj = err as Error;
          setErrorMessage(errObj.message || 'Gagal menghasilkan QR code');
          setQrDataUrl('');
        }
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    };

    const timeout = setTimeout(generate, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [
    qrType,
    urlInput,
    textInput,
    phoneInput,
    emailInput,
    emailSubject,
    wifiData,
    vcardData,
    selectedProfileSlug,
    fgColor,
    bgColor,
    exportSize,
  ]);

  // Actions
  const handleDownload = () => {
    if (!qrDataUrl) {
      showToast('Tidak ada QR code untuk diunduh', 'error');
      return;
    }

    const filename = `qrcode-${qrType}-${Date.now()}.png`;
    QrService.downloadPng(qrDataUrl, filename);
    showToast(`QR Code ${exportSize}x${exportSize}px berhasil diunduh!`, 'success');

    // Automatically record to history
    HistoryService.addItem({
      category: 'qr',
      title: `QR Code: ${qrType.toUpperCase()}`,
      dataType: qrType,
      value: currentRawPayload.length > 80 ? currentRawPayload.substring(0, 80) + '...' : currentRawPayload,
      status: 'success',
    });
    triggerStatsRefresh();
  };

  const handleCopyPayload = async () => {
    if (!currentRawPayload) return;
    try {
      await navigator.clipboard.writeText(currentRawPayload);
      setIsCopied(true);
      showToast('Data teks QR berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('Gagal menyalin data', 'error');
    }
  };

  const handleSaveToHistory = () => {
    if (!currentRawPayload) {
      showToast('Isi data QR terlebih dahulu', 'error');
      return;
    }

    HistoryService.addItem({
      category: 'qr',
      title: `QR Code: ${qrType.toUpperCase()} - ${getTitleSummary()}`,
      dataType: qrType,
      value: currentRawPayload,
      status: 'tersimpan',
    });
    triggerStatsRefresh();
    showToast('Proyek QR Code berhasil disimpan ke Riwayat!', 'success');
  };

  const handleReset = () => {
    setUrlInput('https://google.com');
    setTextInput('');
    setPhoneInput('');
    setEmailInput('');
    setEmailSubject('');
    setWifiData({ ssid: '', password: '', encryption: 'WPA', hidden: false });
    setFgColor('#0f172a');
    setBgColor('#ffffff');
    showToast('Formulir direset', 'info');
  };

  const getTitleSummary = (): string => {
    switch (qrType) {
      case 'url':
        return urlInput;
      case 'text':
        return textInput.substring(0, 30);
      case 'phone':
        return phoneInput;
      case 'email':
        return emailInput;
      case 'wifi':
        return wifiData.ssid;
      case 'vcard':
        return `${vcardData.firstName} ${vcardData.lastName}`;
      case 'profile':
        return selectedProfileSlug;
      default:
        return 'Data';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          QR Code Generator
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hasilkan QR Code dengan format terstandarisasi, pratinjau instan, dan penyesuaian visual penuh.
        </p>
      </div>

      {/* Main Grid: Left Controls, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* QR Type Selector Buttons */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Pilih Tipe Konten QR
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'url', label: 'URL / Web', icon: Link2 },
                { type: 'text', label: 'Teks Bebas', icon: FileText },
                { type: 'phone', label: 'Telepon', icon: Phone },
                { type: 'email', label: 'Email', icon: Mail },
                { type: 'wifi', label: 'Wi-Fi', icon: Wifi },
                { type: 'vcard', label: 'Kontak vCard', icon: Contact2 },
                { type: 'profile', label: 'Profil Digital', icon: UserSquare2 },
              ].map(item => {
                const Icon = item.icon;
                const active = qrType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setQrType(item.type as QrDataType)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Content Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Parameter Data: {qrType.toUpperCase()}</span>
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Type: URL */}
            {qrType === 'url' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alamat URL Lengkap
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://example.com/portofolio"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Gunakan format protokol lengkap (https:// atau http://).
                </p>
              </div>
            )}

            {/* Type: Text */}
            {qrType === 'text' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Isi Teks Bebas
                </label>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Tuliskan pesan, nomor seri, instruksi, atau catatan di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Mendukung karakter UTF-8 multi-bahasa.</span>
                  <span>{textInput.length} karakter</span>
                </div>
              </div>
            )}

            {/* Type: Phone */}
            {qrType === 'phone' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="+6281234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Format internasional dengan kode negara (+62...) disarankan agar langsung dapat dihubungi.
                </p>
              </div>
            )}

            {/* Type: Email */}
            {qrType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Email Tujuan
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="nama@domain.com"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subjek Email (Opsional)
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Pertanyaan Kerjasama"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Type: Wi-Fi */}
            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Jaringan (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiData.ssid}
                    onChange={e => setWifiData({ ...wifiData, ssid: e.target.value })}
                    placeholder="Kantor-Wi-Fi"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi Wi-Fi
                  </label>
                  <input
                    type="text"
                    value={wifiData.password || ''}
                    onChange={e => setWifiData({ ...wifiData, password: e.target.value })}
                    placeholder="Rahasia123"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Jenis Enkripsi
                    </label>
                    <select
                      value={wifiData.encryption}
                      onChange={e =>
                        setWifiData({
                          ...wifiData,
                          encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                        })
                      }
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Tanpa Sandi (Terbuka)</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={wifiData.hidden}
                        onChange={e => setWifiData({ ...wifiData, hidden: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>SSID Tersembunyi</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Type: vCard */}
            {qrType === 'vcard' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Depan *
                    </label>
                    <input
                      type="text"
                      value={vcardData.firstName}
                      onChange={e => setVcardData({ ...vcardData, firstName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Belakang
                    </label>
                    <input
                      type="text"
                      value={vcardData.lastName}
                      onChange={e => setVcardData({ ...vcardData, lastName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Perusahaan / Organisasi
                    </label>
                    <input
                      type="text"
                      value={vcardData.organization || ''}
                      onChange={e => setVcardData({ ...vcardData, organization: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Jabatan / Profesi
                    </label>
                    <input
                      type="text"
                      value={vcardData.title || ''}
                      onChange={e => setVcardData({ ...vcardData, title: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      value={vcardData.phone || ''}
                      onChange={e => setVcardData({ ...vcardData, phone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={vcardData.email || ''}
                      onChange={e => setVcardData({ ...vcardData, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Type: Digital Profile */}
            {qrType === 'profile' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Profil Digital yang Dituju
                </label>
                {profiles.length === 0 ? (
                  <p className="text-xs text-rose-500">
                    Belum ada profil yang dibuat. Silakan buat profil di menu Profil Digital terlebih dahulu.
                  </p>
                ) : (
                  <select
                    value={selectedProfileSlug}
                    onChange={e => setSelectedProfileSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.slug}>
                        {p.fullName} ({p.slug})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-slate-500">
                  QR Code ini akan langsung mengarahkan pemindai ke halaman profil digital Anda.
                </p>
              </div>
            )}

            {/* Error Message if any */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Visual Styling Customization */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              <span>Desain & Kontras Warna</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Warna Foreground (QR)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={e => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={e => setFgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Warna Latar Belakang (BG)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Quick Palette Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                Palet Cepat:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Klasik', fg: '#0f172a', bg: '#ffffff' },
                  { name: 'Indigo Modern', fg: '#312e81', bg: '#eef2ff' },
                  { name: 'Emerald', fg: '#064e3b', bg: '#ecfdf5' },
                  { name: 'Midnight', fg: '#f8fafc', bg: '#090d16' },
                ].map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFgColor(preset.fg);
                      setBgColor(preset.bg);
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                      style={{ backgroundColor: preset.fg }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast Ratio Feedback */}
            {!contrastCheck.isGood && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Rasio Kontras Rendah: {contrastCheck.ratio}:1</p>
                  <p className="mt-0.5">{contrastCheck.warning}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview & Export Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pratinjau Langsung
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <Sparkles className="w-3 h-3" />
                Standar ISO
              </span>
            </div>

            {/* QR Code Canvas / Image Display */}
            <div className="my-4 flex items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              {isGenerating ? (
                <div className="w-64 h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Menghasilkan kode...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Hasil QR Code"
                  className="w-64 h-64 object-contain rounded-xl shadow-xs transition-transform duration-200 hover:scale-105"
                />
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <QrCode className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300" />
                  <span>Masukkan data valid untuk melihat QR</span>
                </div>
              )}
            </div>

            {/* Export Resolution Picker */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Resolusi Ekspor PNG
              </label>
              <div className="flex justify-center gap-2">
                {[
                  { size: 256, label: '256 px' },
                  { size: 512, label: '512 px (Standar)' },
                  { size: 1024, label: '1024 px (Cetak)' },
                ].map(res => (
                  <button
                    key={res.size}
                    type="button"
                    onClick={() => setExportSize(res.size)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      exportSize === res.size
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar PNG</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  disabled={!currentRawPayload}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin' : 'Salin Data'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  disabled={!qrDataUrl}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Simpan Riwayat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Raw Payload Preview Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-500 block mb-1">
              Data Yang Dikodekan:
            </span>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
              {currentRawPayload || '(kosong)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
