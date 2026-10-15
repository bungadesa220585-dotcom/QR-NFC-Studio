import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DigitalProfile, SocialLinks } from '../types';
import { ProfileService } from '../services/ProfileService';
import { HistoryService } from '../services/HistoryService';
import { auth } from '../services/firebase';
import { FirestoreSyncService } from '../services/FirestoreSyncService';
import {
  UserSquare2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  QrCode,
  Share2,
  Copy,
  Download,
  Eye,
  Globe,
  Lock,
  Camera,
  Check,
  X,
  Phone,
  Mail,
  Building,
  Briefcase,
  MapPin,
} from 'lucide-react';

const EMPTY_PROFILE_FORM: Omit<DigitalProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  slug: '',
  fullName: '',
  avatarUrl: '',
  title: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  bio: '',
  isPublic: true,
  socials: {},
};

export const DigitalProfiles: React.FC = () => {
  const {
    showToast,
    showConfirm,
    openPublicProfile,
    setCurrentPage,
    triggerStatsRefresh,
  } = useApp();

  const [profiles, setProfiles] = useState<DigitalProfile[]>(() => ProfileService.getAll());
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<DigitalProfile, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_PROFILE_FORM);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const reloadProfiles = () => {
    const list = ProfileService.getAll();
    setProfiles(list);
    triggerStatsRefresh();
  };

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return profiles;
    return profiles.filter(
      p =>
        p.fullName.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.company && p.company.toLowerCase().includes(query))
    );
  }, [profiles, searchQuery]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_PROFILE_FORM,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (profile: DigitalProfile) => {
    setEditingId(profile.id);
    setFormData({
      slug: profile.slug,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl || '',
      title: profile.title || '',
      company: profile.company || '',
      phone: profile.phone || '',
      email: profile.email || '',
      website: profile.website || '',
      address: profile.address || '',
      bio: profile.bio || '',
      isPublic: profile.isPublic,
      socials: { ...(profile.socials || {}) },
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Slug auto-generation when full name changes (if not editing existing custom slug)
  const handleFullNameChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, fullName: val };
      if (!editingId && !prev.slug) {
        updated.slug = ProfileService.generateSlug(val);
      }
      return updated;
    });
  };

  // Image upload handling (local file to data URL)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto maksimal 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setFormData(prev => ({ ...prev, avatarUrl: String(reader.result) }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Nama lengkap wajib diisi';
    }

    const cleanSlug = formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!cleanSlug) {
      errors.slug = 'Slug unik wajib diisi';
    } else {
      // Check duplicate slug among other profiles
      const existing = profiles.find(p => p.slug === cleanSlug && p.id !== editingId);
      if (existing) {
        errors.slug = 'Slug ini sudah digunakan oleh profil lain. Gunakan slug berbeda.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const id = editingId || `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const saved = ProfileService.save({
      id,
      slug: cleanSlug,
      fullName: formData.fullName.trim(),
      avatarUrl: formData.avatarUrl?.trim(),
      title: formData.title?.trim(),
      company: formData.company?.trim(),
      phone: formData.phone?.trim(),
      email: formData.email?.trim(),
      website: formData.website?.trim(),
      address: formData.address?.trim(),
      bio: formData.bio?.trim(),
      isPublic: formData.isPublic,
      socials: formData.socials || {},
      createdAt: editingId ? (ProfileService.getById(editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    });

    HistoryService.addItem({
      category: 'profile',
      title: `${editingId ? 'Edit' : 'Buat'} Profil: ${saved.fullName}`,
      dataType: 'profile',
      value: ProfileService.getPublicUrl(saved.slug),
      status: 'berhasil',
    });

    setIsModalOpen(false);
    reloadProfiles();

    if (auth.currentUser) {
      FirestoreSyncService.uploadProfile(saved)
        .then(() => showToast(`Profil ${saved.fullName} tersimpan & tersinkron ke Cloud!`, 'success'))
        .catch(err => {
          console.warn('Gagal sinkron cloud:', err);
          showToast(`Profil tersimpan di lokal (Cloud pending)`, 'info');
        });
    } else {
      showToast(`Profil ${saved.fullName} berhasil disimpan!`, 'success');
    }
  };

  // Delete profile with confirmation
  const handleDeleteProfile = (profile: DigitalProfile) => {
    showConfirm({
      title: 'Hapus Profil Digital?',
      message: `Apakah Anda yakin ingin menghapus profil "${profile.fullName}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Profil',
      isDestructive: true,
      onConfirm: () => {
        ProfileService.delete(profile.id);
        if (auth.currentUser) {
          FirestoreSyncService.deleteProfile(profile.id).catch(e => console.warn('Cloud delete failed:', e));
        }
        reloadProfiles();
        showToast('Profil berhasil dihapus.', 'info');
      },
    });
  };

  const handleCopyPublicUrl = async (slug: string) => {
    const url = ProfileService.getPublicUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Tautan profil disalin ke clipboard!', 'success');
    } catch {
      showToast('Gagal menyalin tautan', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Profil Digital
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola kartu nama dan portofolio digital yang siap dipadukan dengan QR Code dan stiker NFC.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Profil Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari profil berdasarkan nama, profesi, perusahaan, atau slug..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
        />
      </div>

      {/* Profiles Cards Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
            <UserSquare2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Tidak Ada Profil Ditemukan
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'Coba kata kunci pencarian yang lain.' : 'Buat kartu digital pertama Anda untuk dibagikan ke klien atau rekan kerja.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Profil Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => (
            <div
              key={profile.id}
              className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              {/* Card Header Strip */}
              <div className="h-20 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 relative p-3">
                <div className="flex justify-between items-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      profile.isPublic
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    {profile.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{profile.isPublic ? 'Publik' : 'Privat'}</span>
                  </span>

                  <span className="text-[10px] text-white/80 font-mono">
                    /{profile.slug}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 pt-0 relative flex-1">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <img
                    src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                    alt={profile.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-3 border-white dark:border-slate-900 shadow-md bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openPublicProfile(profile.slug)}
                      className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Lihat Pratinjau Publik"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopyPublicUrl(profile.slug)}
                      className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Salin Tautan Publik"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {profile.fullName}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {profile.title || 'Tidak ada jabatan'}
                </p>
                {profile.company && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {profile.company}
                  </p>
                )}

                {profile.bio && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  {profile.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {profile.phone}</span>}
                  {profile.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {profile.email}</span>}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setCurrentPage('qr-generator');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    title="Buat QR Code dari Profil"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Buat QR</span>
                  </button>

                  <button
                    onClick={() => ProfileService.downloadVCard(profile)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    title="Unduh vCard (.vcf)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>vCard</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(profile)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    title="Edit Profil"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    title="Hapus Profil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Form Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingId ? 'Edit Profil Digital' : 'Buat Profil Digital Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lengkapi data kartu digital yang akan ditampilkan kepada publik.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar and Basic info row */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <img
                      src={formData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                      alt="Foto profil"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 bg-slate-100"
                    />
                    <label className="absolute inset-0 bg-slate-900/60 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs">
                      <Camera className="w-5 h-5 mb-1" />
                      <span>Ganti</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400">Unggah foto (Maks. 2MB)</span>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => handleFullNameChange(e.target.value)}
                      placeholder="Contoh: Rian Pratama"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-rose-500 mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Slug URL Publik (/p/slug) *
                    </label>
                    <div className="flex items-center mt-1">
                      <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-500 font-mono">
                        /p/
                      </span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="rian-pratama"
                        className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {formErrors.slug && (
                      <p className="text-[11px] text-rose-500 mt-1">{formErrors.slug}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Jabatan / Profesi
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Chief Technology Officer"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Perusahaan / Instansi
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="PT Digital Kreasi Mandiri"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Phone, Email, Website */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+6281234567890"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rian@example.com"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Situs Web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://rianpratama.com"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Address & Bio */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Alamat / Kota Domisili
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Bandung, Jawa Barat, Indonesia"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Deskripsi Singkat / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Ceritakan ringkasan keahlian, visi, atau penawaran profesional Anda..."
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Social Media Links Accordion/Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Tautan Media Sosial (Opsional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500">LinkedIn URL</span>
                    <input
                      type="url"
                      value={formData.socials?.linkedin || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, linkedin: e.target.value },
                        })
                      }
                      placeholder="https://linkedin.com/in/username"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Instagram URL</span>
                    <input
                      type="url"
                      value={formData.socials?.instagram || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, instagram: e.target.value },
                        })
                      }
                      placeholder="https://instagram.com/username"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">GitHub URL</span>
                    <input
                      type="url"
                      value={formData.socials?.github || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, github: e.target.value },
                        })
                      }
                      placeholder="https://github.com/username"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">WhatsApp Link</span>
                    <input
                      type="text"
                      value={formData.socials?.whatsapp || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, whatsapp: e.target.value },
                        })
                      }
                      placeholder="https://wa.me/6281234567890"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Public Visibility Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Visibilitas Kartu Digital Publik
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Izinkan siapa saja yang memindai QR Code atau tap kartu NFC untuk melihat halaman ini.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-colors"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
