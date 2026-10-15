import { DigitalProfile } from '../types';
import { StorageService } from './StorageService';

export class ProfileService {
  private static STORAGE_KEY = StorageService.getKeys().PROFILES;

  /**
   * Mengambil semua profil yang tersimpan secara lokal
   */
  static getAll(): DigitalProfile[] {
    const list = StorageService.getItem<DigitalProfile[]>(this.STORAGE_KEY, []);
    if (list.length === 0) {
      // Inisialisasi contoh profil default jika belum ada
      const initialProfile = this.createDefaultProfile();
      StorageService.setItem(this.STORAGE_KEY, [initialProfile]);
      return [initialProfile];
    }
    return list;
  }

  /**
   * Menemukan profil berdasarkan ID
   */
  static getById(id: string): DigitalProfile | undefined {
    return this.getAll().find(p => p.id === id);
  }

  /**
   * Menemukan profil berdasarkan Slug
   */
  static getBySlug(slug: string): DigitalProfile | undefined {
    const clean = slug.toLowerCase().trim();
    return this.getAll().find(p => p.slug.toLowerCase() === clean);
  }

  /**
   * Menyimpan profil baru atau memperbarui yang lama
   */
  static save(profile: DigitalProfile): DigitalProfile {
    const profiles = StorageService.getItem<DigitalProfile[]>(this.STORAGE_KEY, []);
    const index = profiles.findIndex(p => p.id === profile.id);
    const updatedProfile = {
      ...profile,
      updatedAt: Date.now(),
    };

    if (index >= 0) {
      profiles[index] = updatedProfile;
    } else {
      profiles.unshift(updatedProfile);
    }

    StorageService.setItem(this.STORAGE_KEY, profiles);
    return updatedProfile;
  }

  /**
   * Menghapus profil
   */
  static delete(id: string): boolean {
    const profiles = StorageService.getItem<DigitalProfile[]>(this.STORAGE_KEY, []);
    const filtered = profiles.filter(p => p.id !== id);
    if (filtered.length !== profiles.length) {
      StorageService.setItem(this.STORAGE_KEY, filtered);
      return true;
    }
    return false;
  }

  /**
   * Membuat slug unik dari nama
   */
  static generateSlug(fullName: string): string {
    const base = fullName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = this.getAll();
    let slug = base || 'user';
    let counter = 1;

    while (existing.some(p => p.slug === slug)) {
      counter++;
      slug = `${base || 'user'}-${counter}`;
    }

    return slug;
  }

  /**
   * Menghasilkan URL publik untuk profil
   */
  static getPublicUrl(slug: string): string {
    const base = window.location.origin + window.location.pathname;
    return `${base}?p=${encodeURIComponent(slug)}`;
  }

  /**
   * Menghasilkan string vCard 3.0 dari Profil
   */
  static generateVCard(profile: DigitalProfile): string {
    const nameParts = profile.fullName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const firstName = nameParts[0] || '';

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.fullName}`,
      `N:${lastName};${firstName};;;`,
      profile.company ? `ORG:${profile.company}` : '',
      profile.title ? `TITLE:${profile.title}` : '',
      profile.phone ? `TEL;TYPE=CELL,VOICE:${profile.phone}` : '',
      profile.email ? `EMAIL;TYPE=PREF,INTERNET:${profile.email}` : '',
      profile.website ? `URL:${profile.website}` : '',
      profile.address ? `ADR;TYPE=WORK:;;${profile.address};;;;` : '',
      profile.bio ? `NOTE:${profile.bio.replace(/\n/g, '\\n')}` : '',
      'END:VCARD',
    ];

    return lines.filter(Boolean).join('\r\n');
  }

  /**
   * Mengunduh vCard sebagai file kontak .vcf
   */
  static downloadVCard(profile: DigitalProfile): void {
    const vcardContent = this.generateVCard(profile);
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFilename = profile.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'kontak';
    link.download = `${cleanFilename}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Profil default bawaan untuk contoh
   */
  private static createDefaultProfile(): DigitalProfile {
    return {
      id: 'demo-profile-1',
      slug: 'budi-santoso',
      fullName: 'Budi Santoso',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      title: 'Senior Software Engineer & IoT Maker',
      company: 'Nusantara Tech Studio',
      phone: '+6281234567890',
      email: 'budi.santoso@example.com',
      website: 'https://budisantoso.dev',
      address: 'Jakarta Selatan, DKI Jakarta',
      bio: 'Spesialis integrasi Web NFC, QR pintar, dan ekosistem IoT modern. Terbuka untuk kolaborasi proyek digital.',
      isPublic: true,
      socials: {
        linkedin: 'https://linkedin.com/in/budisantoso',
        github: 'https://github.com/budisantoso',
        instagram: 'https://instagram.com/budisantoso',
        whatsapp: 'https://wa.me/6281234567890',
      },
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    };
  }
}
