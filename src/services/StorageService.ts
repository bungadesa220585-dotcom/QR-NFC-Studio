/**
 * StorageService
 * Mengelola penyimpanan data lokal (localStorage) dengan antarmuka yang siap
 * diperluas ke Cloud Firestore / backend Firebase.
 */

const STORAGE_KEYS = {
  PROFILES: 'qr_nfc_profiles_v1',
  QR_RECORDS: 'qr_nfc_qr_records_v1',
  HISTORY: 'qr_nfc_history_v1',
  SETTINGS: 'qr_nfc_settings_v1',
  OWNER: 'qr_nfc_owner_v1',
  ACCOUNTS: 'qr_nfc_accounts_v1',
  CURRENT_USER: 'qr_nfc_current_user_v1',
};

export interface AppSettings {
  darkMode: boolean;
  cloudSyncEnabled: boolean;
  firebaseConfig?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  cloudSyncEnabled: false,
};

export class StorageService {
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`[StorageService] Gagal membaca key ${key}:`, e);
      return defaultValue;
    }
  }

  static setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[StorageService] Gagal menyimpan key ${key}:`, e);
      return false;
    }
  }

  static getKeys() {
    return STORAGE_KEYS;
  }

  static getSettings(): AppSettings {
    return this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  static exportAllData(): string {
    const backup = {
      exportDate: new Date().toISOString(),
      profiles: this.getItem(STORAGE_KEYS.PROFILES, []),
      qrRecords: this.getItem(STORAGE_KEYS.QR_RECORDS, []),
      history: this.getItem(STORAGE_KEYS.HISTORY, []),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static importAllData(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.profiles)) {
        this.setItem(STORAGE_KEYS.PROFILES, data.profiles);
      }
      if (Array.isArray(data.qrRecords)) {
        this.setItem(STORAGE_KEYS.QR_RECORDS, data.qrRecords);
      }
      if (Array.isArray(data.history)) {
        this.setItem(STORAGE_KEYS.HISTORY, data.history);
      }
      return { success: true, message: 'Data berhasil diimpor sepenuhnya.' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Format JSON tidak valid';
      return { success: false, message: `Gagal mengimpor data: ${errMsg}` };
    }
  }

  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.QR_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }
}
