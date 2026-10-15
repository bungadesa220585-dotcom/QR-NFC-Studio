import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HistoryItem } from '../types';
import { HistoryService } from '../services/HistoryService';
import { QrService } from '../services/QrService';
import {
  History,
  Search,
  Trash2,
  Copy,
  Download,
  Eye,
  Filter,
  Check,
  QrCode,
  Radio,
  UserSquare2,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { showToast, showConfirm, triggerStatsRefresh, refreshStatsTrigger } = useApp();

  const [historyList, setHistoryList] = useState<HistoryItem[]>(() => HistoryService.getAll());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'qr' | 'profile' | 'nfc'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Detail Modal State
  const [activeDetailItem, setActiveDetailItem] = useState<HistoryItem | null>(null);
  const [detailQrDataUrl, setDetailQrDataUrl] = useState<string>('');

  const reloadHistory = () => {
    setHistoryList(HistoryService.getAll());
    triggerStatsRefresh();
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let list = [...historyList];

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(item => item.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.value.toLowerCase().includes(q) ||
          item.dataType.toLowerCase().includes(q)
      );
    }

    // Sort by Date
    list.sort((a, b) => {
      return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
    });

    return list;
  }, [historyList, selectedCategory, searchQuery, sortOrder]);

  // Open Detail
  const handleOpenDetail = async (item: HistoryItem) => {
    setActiveDetailItem(item);
    setDetailQrDataUrl('');

    // Generate preview QR if applicable
    if (item.value && item.value.trim()) {
      try {
        const qrUrl = await QrService.generateDataUrl(item.value, {
          width: 400,
          margin: 2,
        });
        setDetailQrDataUrl(qrUrl);
      } catch {
        setDetailQrDataUrl('');
      }
    }
  };

  // Delete single item
  const handleDeleteItem = (item: HistoryItem) => {
    showConfirm({
      title: 'Hapus Riwayat Ini?',
      message: `Hapus entri riwayat "${item.title}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus',
      isDestructive: true,
      onConfirm: () => {
        HistoryService.deleteItem(item.id);
        reloadHistory();
        showToast('Entri riwayat berhasil dihapus', 'info');
      },
    });
  };

  // Clear all
  const handleClearAll = () => {
    showConfirm({
      title: 'Hapus Semua Riwayat?',
      message: 'Apakah Anda yakin ingin menghapus seluruh rekaman riwayat di perangkat ini? Data tidak dapat dipulihkan.',
      confirmText: 'Hapus Semua',
      isDestructive: true,
      onConfirm: () => {
        HistoryService.clearAll();
        reloadHistory();
        showToast('Seluruh riwayat berhasil dibersihkan', 'info');
      },
    });
  };

  const handleCopyValue = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      showToast('Data berhasil disalin ke clipboard!', 'success');
    } catch {
      showToast('Gagal menyalin', 'error');
    }
  };

  const handleDownloadQr = (val: string, title: string) => {
    if (detailQrDataUrl) {
      QrService.downloadPng(detailQrDataUrl, `${title.replace(/\s+/g, '_')}.png`);
      showToast('QR Code berhasil diunduh!', 'success');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Riwayat Proyek & Operasi
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau dan kelola seluruh catatan pembuatan QR Code, profil digital, serta interaksi tag NFC.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Riwayat</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari riwayat berdasarkan judul, isi data, atau tipe..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 font-semibold">Urutkan:</span>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="desc">Terbaru Pertama</option>
              <option value="asc">Terlama Pertama</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'Semua Kategori', icon: History },
            { id: 'qr', label: 'QR Code', icon: QrCode },
            { id: 'profile', label: 'Profil Digital', icon: UserSquare2 },
            { id: 'nfc', label: 'Operasi NFC', icon: Radio },
          ].map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as 'all' | 'qr' | 'profile' | 'nfc')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* History Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          <History className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            Tidak ada rekaman riwayat yang sesuai.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Setiap pembuatan QR atau pemindaian NFC akan otomatis tercatat di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            let badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
            let Icon = QrCode;

            if (item.category === 'nfc') {
              badgeColor = 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
              Icon = Radio;
            } else if (item.category === 'profile') {
              badgeColor = 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300';
              Icon = UserSquare2;
            }

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${badgeColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {item.title}
                      </h4>
                      {item.status && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.status === 'berhasil' || item.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-lg">
                      {item.value}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>&bull; Tipe: {item.dataType.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Row Action buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Buka Detail & QR"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCopyValue(item.value)}
                    className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Salin Data"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Hapus Entri"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail Modal */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Detail Rekaman Riwayat
              </h3>
              <button
                onClick={() => setActiveDetailItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Judul Proyek
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeDetailItem.title}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Isi Data Rekaman
                </span>
                <div className="mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all max-h-40 overflow-y-auto">
                  {activeDetailItem.value}
                </div>
              </div>

              {/* QR Preview if generated */}
              {detailQrDataUrl && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    QR Code dari Data Ini
                  </span>
                  <img
                    src={detailQrDataUrl}
                    alt="QR Preview"
                    className="w-44 h-44 mx-auto rounded-xl shadow-xs"
                  />
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadQr(activeDetailItem.value, activeDetailItem.title)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh QR PNG</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>
                  Waktu: {new Date(activeDetailItem.createdAt).toLocaleString('id-ID')}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyValue(activeDetailItem.value)}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
