import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProfileService } from '../services/ProfileService';
import { FirestoreSyncService } from '../services/FirestoreSyncService';
import { DigitalProfile } from '../types';
import {
  UserSquare2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Share2,
  Download,
  ArrowLeft,
  Linkedin,
  Instagram,
  Github,
  MessageCircle,
  Twitter,
  Send,
  Video,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const PublicProfilePage: React.FC = () => {
  const { activeProfileSlug, setCurrentPage, showToast } = useApp();
  const [profile, setProfile] = useState<DigitalProfile | undefined>(() => {
    if (!activeProfileSlug) return undefined;
    return ProfileService.getBySlug(activeProfileSlug);
  });
  const [isLoading, setIsLoading] = useState<boolean>(!profile && Boolean(activeProfileSlug));

  useEffect(() => {
    if (!activeProfileSlug) return;
    const local = ProfileService.getBySlug(activeProfileSlug);
    if (local) {
      setProfile(local);
    }

    let isMounted = true;
    FirestoreSyncService.getPublicProfileBySlug(activeProfileSlug)
      .then(cloudProfile => {
        if (!isMounted) return;
        if (cloudProfile) {
          setProfile(cloudProfile);
        }
      })
      .catch(err => {
        console.warn('Gagal memuat profil dari cloud:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeProfileSlug]);

  const handleShare = async () => {
    if (!profile) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profil Digital: ${profile.fullName}`,
          text: `Kartu nama digital resmi untuk ${profile.fullName}`,
          url,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Tautan profil disalin ke clipboard!', 'success');
    }
  };

  const handleDownloadVCard = () => {
    if (!profile) return;
    ProfileService.downloadVCard(profile);
    showToast('Kontak vCard (.vcf) berhasil diunduh!', 'success');
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Memuat Profil Digital...</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Menghubungkan ke Cloud Firestore</p>
      </div>
    );
  }

  // State if profile not found
  if (!profile) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Profil Tidak Ditemukan
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Slug profil &ldquo;{activeProfileSlug || 'N/A'}&rdquo; tidak terdaftar di perangkat ini atau telah dihapus.
        </p>
        <button
          onClick={() => setCurrentPage('profiles')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Studio</span>
        </button>
      </div>
    );
  }

  // State if profile is marked as private
  if (!profile.isPublic) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Profil Ini Bersifat Privat
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Pemilik profil telah menyetel visibilitas ke mode privat sehingga tidak dapat dilihat secara publik.
        </p>
        <button
          onClick={() => setCurrentPage('profiles')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Studio</span>
        </button>
      </div>
    );
  }

  const socials = profile.socials || {};

  return (
    <div className="max-w-lg mx-auto py-4 sm:py-8 animate-in fade-in duration-200">
      {/* Top Studio Back Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentPage('profiles')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pengelola Profil</span>
        </button>

        <span className="text-[11px] font-semibold text-slate-400">
          Tampilan Kartu Publik
        </span>
      </div>

      {/* Main Digital Card */}
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Card Header Cover Gradient */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 relative">
          <div className="absolute top-3 right-3">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
              title="Bagikan Tautan"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Avatar and Identity */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="relative">
              <img
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                alt={profile.fullName}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-lg bg-slate-100 dark:bg-slate-800"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <button
              onClick={handleDownloadVCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan Kontak</span>
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {profile.fullName}
            </h1>
            {profile.title && (
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {profile.title}
              </p>
            )}
            {profile.company && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile.company}
              </p>
            )}
          </div>

          {/* Short Bio */}
          {profile.bio && (
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {profile.bio}
            </div>
          )}

          {/* Contact Direct Actions Grid */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs font-semibold"
              >
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-slate-400">Telepon</span>
                  <span className="truncate">{profile.phone}</span>
                </div>
              </a>
            )}

            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs font-semibold"
              >
                <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-slate-400">Email</span>
                  <span className="truncate">{profile.email}</span>
                </div>
              </a>
            )}

            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs font-semibold"
              >
                <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-slate-400">Website</span>
                  <span className="truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                </div>
              </a>
            )}

            {profile.address && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[10px] text-slate-400">Lokasi</span>
                  <span className="truncate">{profile.address}</span>
                </div>
              </div>
            )}
          </div>

          {/* Social Links Section */}
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Tautan Media Sosial & Jejaring
            </h3>
            <div className="flex flex-wrap gap-2">
              {socials.whatsapp && (
                <a
                  href={socials.whatsapp.startsWith('http') ? socials.whatsapp : `https://wa.me/${socials.whatsapp.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}

              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}

              {socials.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}

              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/50 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 text-xs font-semibold transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}

              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  <span>X (Twitter)</span>
                </a>
              )}

              {socials.telegram && (
                <a
                  href={socials.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </a>
              )}

              {socials.tiktok && (
                <a
                  href={socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Video className="w-4 h-4" />
                  <span>TikTok</span>
                </a>
              )}
            </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-8 text-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium">
              Ditenagai oleh QR & NFC Studio &bull; Profil Pintar Terverifikasi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
