import { NfcRecordData, NfcSupportState } from '../types';

// Definisi antarmuka Web NFC API untuk TypeScript
interface NDEFRecordInit {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: unknown;
  encoding?: string;
  lang?: string;
}

interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView;
  encoding?: string;
  lang?: string;
  toRecords?: () => NDEFRecord[];
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: {
    records: NDEFRecord[];
  };
}

interface NDEFReaderInstance extends EventTarget {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  write: (message: NDEFMessageInit | string, options?: { signal?: AbortSignal }) => Promise<void>;
  makeReadOnly?: (options?: { signal?: AbortSignal }) => Promise<void>;
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
}

type NDEFReaderConstructor = new () => NDEFReaderInstance;

declare global {
  interface Window {
    NDEFReader?: NDEFReaderConstructor;
  }
}

export class NfcService {
  /**
   * Memeriksa ketersediaan dan kapabilitas Web NFC pada browser/perangkat
   */
  static checkSupport(): NfcSupportState {
    const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
    const hasNDEFReader = typeof window !== 'undefined' && 'NDEFReader' in window;

    if (!isSecureContext) {
      return {
        isSupported: false,
        isSecureContext: false,
        reason: 'Web NFC mewajibkan koneksi aman (HTTPS atau localhost). Halaman ini saat ini tidak berjalan di lingkungan aman.',
      };
    }

    if (!hasNDEFReader) {
      const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
      let reason = 'Web NFC API tidak didukung oleh browser ini.';
      if (isAndroid) {
        reason = 'Web NFC API memerlukan Google Chrome atau browser berbasis Chromium di Android dengan fitur NFC aktif.';
      } else {
        reason = 'Web NFC API saat ini hanya didukung pada perangkat Android yang menggunakan Chrome/Chromium.';
      }

      return {
        isSupported: false,
        isSecureContext: true,
        reason,
      };
    }

    return {
      isSupported: true,
      isSecureContext: true,
    };
  }

  /**
   * Menulis data ke Tag NFC (NDEF)
   */
  static async write(
    type: 'url' | 'text',
    data: string,
    options: { signal?: AbortSignal } = {}
  ): Promise<{ success: boolean; message: string }> {
    const support = this.checkSupport();
    if (!support.isSupported) {
      throw new Error(support.reason || 'Web NFC tidak didukung pada browser ini.');
    }

    if (!window.NDEFReader) {
      throw new Error('NDEFReader tidak tersedia.');
    }

    const ndef = new window.NDEFReader();
    let messageInit: NDEFMessageInit;

    if (type === 'url') {
      const trimmedUrl = data.trim();
      const validUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
      messageInit = {
        records: [
          {
            recordType: 'url',
            data: validUrl,
          },
        ],
      };
    } else {
      messageInit = {
        records: [
          {
            recordType: 'text',
            data: data,
          },
        ],
      };
    }

    try {
      await ndef.write(messageInit, { signal: options.signal });
      return {
        success: true,
        message: 'Data berhasil ditulis ke tag NFC!',
      };
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Operasi penulisan NFC dibatalkan oleh pengguna.');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Izin akses NFC ditolak oleh pengguna atau sistem.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Tag NFC ini tidak kompatibel atau memiliki format yang tidak didukung.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Akses NFC diblokir oleh kebijakan keamanan.');
      } else if (error.name === 'NetworkError') {
        throw new Error('Koneksi terputus saat menulis. Pastikan tag tidak berpindah posisi.');
      }
      throw new Error(error.message || 'Gagal menulis data ke tag NFC.');
    }
  }

  /**
   * Mulai memindai Tag NFC
   */
  static async startScan(callbacks: {
    onReading: (serialNumber: string, records: NfcRecordData[]) => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
  }): Promise<void> {
    const support = this.checkSupport();
    if (!support.isSupported) {
      throw new Error(support.reason || 'Web NFC tidak didukung.');
    }

    if (!window.NDEFReader) {
      throw new Error('NDEFReader tidak tersedia.');
    }

    const ndef = new window.NDEFReader();

    ndef.onreading = (event: NDEFReadingEvent) => {
      try {
        const decodedRecords: NfcRecordData[] = [];
        const records = event.message?.records || [];

        for (const record of records) {
          const decoded = this.decodeRecord(record);
          if (decoded) {
            decodedRecords.push(decoded);
          }
        }

        callbacks.onReading(event.serialNumber || 'N/A', decodedRecords);
      } catch (decodeErr: unknown) {
        callbacks.onError(decodeErr instanceof Error ? decodeErr : new Error('Gagal mengurai rekaman NDEF'));
      }
    };

    ndef.onreadingerror = () => {
      callbacks.onError(new Error('Tag NFC terdeteksi tetapi gagal dibaca. Coba tempelkan kembali.'));
    };

    try {
      await ndef.scan({ signal: callbacks.signal });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        return; // Normal cancellation
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Izin pemindaian NFC ditolak.');
      }
      throw new Error(error.message || 'Gagal memulai pemindaian NFC.');
    }
  }

  /**
   * Mengurai rekaman NDEF mentah menjadi data yang aman ditampilkan
   */
  private static decodeRecord(record: NDEFRecord): NfcRecordData | null {
    try {
      const textDecoder = new TextDecoder(record.encoding || 'utf-8');

      if (record.recordType === 'text') {
        const text = record.data ? textDecoder.decode(record.data) : '';
        return {
          recordType: 'text',
          data: text,
          encoding: record.encoding,
          lang: record.lang,
        };
      }

      if (record.recordType === 'url') {
        const url = record.data ? textDecoder.decode(record.data) : '';
        return {
          recordType: 'url',
          data: url,
        };
      }

      if (record.recordType === 'mime') {
        const raw = record.data ? textDecoder.decode(record.data) : '';
        return {
          recordType: 'mime',
          data: raw,
        };
      }

      // fallback
      const fallbackData = record.data ? textDecoder.decode(record.data) : '';
      return {
        recordType: 'unknown',
        data: fallbackData,
      };
    } catch {
      return {
        recordType: 'unknown',
        data: '[Data biner tidak dapat diuraikan]',
      };
    }
  }
}
