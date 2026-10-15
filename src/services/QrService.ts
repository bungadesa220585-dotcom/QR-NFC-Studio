import QRCode from 'qrcode';
import { WifiData, VCardData, QrDataType } from '../types';

export class QrService {
  /**
   * Menghasilkan string terformat berdasarkan tipe data
   */
  static formatData(type: QrDataType, rawData: string | WifiData | VCardData): string {
    switch (type) {
      case 'url':
      case 'profile': {
        const urlStr = typeof rawData === 'string' ? rawData.trim() : '';
        if (urlStr && !/^https?:\/\//i.test(urlStr)) {
          return `https://${urlStr}`;
        }
        return urlStr;
      }

      case 'text':
        return typeof rawData === 'string' ? rawData : '';

      case 'phone': {
        const phone = typeof rawData === 'string' ? rawData.replace(/\s+/g, '') : '';
        return phone ? `tel:${phone}` : '';
      }

      case 'email': {
        const email = typeof rawData === 'string' ? rawData.trim() : '';
        return email ? `mailto:${email}` : '';
      }

      case 'wifi': {
        const wifi = rawData as WifiData;
        const ssid = (wifi.ssid || '').replace(/([\\;,:"])/g, '\\$1');
        const pass = (wifi.password || '').replace(/([\\;,:"])/g, '\\$1');
        const hidden = wifi.hidden ? 'true' : 'false';
        const enc = wifi.encryption || 'WPA';
        return `WIFI:T:${enc};S:${ssid};P:${pass};H:${hidden};;`;
      }

      case 'vcard': {
        const vc = rawData as VCardData;
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${vc.lastName || ''};${vc.firstName || ''};;;`,
          `FN:${[vc.firstName, vc.lastName].filter(Boolean).join(' ')}`,
          vc.organization ? `ORG:${vc.organization}` : '',
          vc.title ? `TITLE:${vc.title}` : '',
          vc.phone ? `TEL;TYPE=CELL:${vc.phone}` : '',
          vc.email ? `EMAIL:${vc.email}` : '',
          vc.url ? `URL:${vc.url}` : '',
          vc.address ? `ADR;TYPE=WORK:;;${vc.address};;;;` : '',
          'END:VCARD',
        ]
          .filter(Boolean)
          .join('\n');
      }

      default:
        return typeof rawData === 'string' ? rawData : '';
    }
  }

  /**
   * Validasi string input untuk pencegahan QR kosong atau format keliru
   */
  static validate(type: QrDataType, rawData: unknown): { valid: boolean; message?: string } {
    if (!rawData) {
      return { valid: false, message: 'Data tidak boleh kosong' };
    }

    if (type === 'url' || type === 'profile') {
      const str = String(rawData).trim();
      if (!str) return { valid: false, message: 'URL tidak boleh kosong' };
      // Pola URL dasar
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/i;
      const localhostPattern = /^(https?:\/\/)?localhost(:\d+)?(\/.*)?$/i;
      if (!urlPattern.test(str) && !localhostPattern.test(str)) {
        return { valid: false, message: 'Format URL tidak valid (misal: https://example.com)' };
      }
    }

    if (type === 'email') {
      const email = String(rawData).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { valid: false, message: 'Format alamat email tidak valid' };
      }
    }

    if (type === 'phone') {
      const phone = String(rawData).trim();
      if (!/^\+?[\d\s-]{6,20}$/.test(phone)) {
        return { valid: false, message: 'Nomor telepon harus memuat 6-20 digit angka' };
      }
    }

    if (type === 'wifi') {
      const wifi = rawData as WifiData;
      if (!wifi.ssid?.trim()) {
        return { valid: false, message: 'Nama jaringan (SSID) wajib diisi' };
      }
    }

    if (type === 'vcard') {
      const vcard = rawData as VCardData;
      if (!vcard.firstName?.trim() && !vcard.lastName?.trim()) {
        return { valid: false, message: 'Nama depan atau nama belakang kontak wajib diisi' };
      }
    }

    return { valid: true };
  }

  /**
   * Menghasilkan DataURL QR Code PNG
   */
  static async generateDataUrl(
    data: string,
    options: {
      fgColor?: string;
      bgColor?: string;
      width?: number;
      margin?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    } = {}
  ): Promise<string> {
    if (!data.trim()) {
      throw new Error('Data teks QR kosong');
    }

    const {
      fgColor = '#0f172a',
      bgColor = '#ffffff',
      width = 512,
      margin = 2,
      errorCorrectionLevel = 'M',
    } = options;

    return QRCode.toDataURL(data, {
      width,
      margin,
      errorCorrectionLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    });
  }

  /**
   * Mengukur rasio kontras antara Foreground dan Background
   * Mengembalikan rasio (1:1 s/d 21:1) dan peringatan jika kurang kontras (< 3:1)
   */
  static checkContrast(fgHex: string, bgHex: string): { ratio: number; isGood: boolean; warning?: string } {
    const parseHex = (hex: string) => {
      let c = hex.replace('#', '');
      if (c.length === 3) {
        c = c.split('').map(x => x + x).join('');
      }
      const num = parseInt(c, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
      };
    };

    const getLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    try {
      const l1 = getLuminance(parseHex(fgHex));
      const l2 = getLuminance(parseHex(bgHex));
      const brighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      const ratio = Number(((brighter + 0.05) / (darker + 0.05)).toFixed(2));

      const isGood = ratio >= 3.0;
      return {
        ratio,
        isGood,
        warning: isGood
          ? undefined
          : 'Peringatan: Rasio kontras rendah (< 3:1). Kamera mungkin kesulitan memindai QR Code ini.',
      };
    } catch {
      return { ratio: 5, isGood: true };
    }
  }

  /**
   * Download Data URL sebagai file gambar PNG
   */
  static downloadPng(dataUrl: string, filename = 'qrcode-studio.png'): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
