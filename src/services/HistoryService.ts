import { HistoryItem } from '../types';
import { StorageService } from './StorageService';
import { ProfileService } from './ProfileService';

export class HistoryService {
  private static STORAGE_KEY = StorageService.getKeys().HISTORY;

  static getAll(): HistoryItem[] {
    return StorageService.getItem<HistoryItem[]>(this.STORAGE_KEY, []);
  }

  static addItem(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
    const history = this.getAll();
    const newItem: HistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    history.unshift(newItem);
    // Batasi maksimum 100 entri untuk kinerja lokal optimal
    if (history.length > 100) {
      history.length = 100;
    }
    StorageService.setItem(this.STORAGE_KEY, history);
    return newItem;
  }

  static deleteItem(id: string): boolean {
    const history = this.getAll();
    const filtered = history.filter(h => h.id !== id);
    if (filtered.length !== history.length) {
      StorageService.setItem(this.STORAGE_KEY, filtered);
      return true;
    }
    return false;
  }

  static clearAll(): void {
    StorageService.setItem(this.STORAGE_KEY, []);
  }

  static getStats() {
    const history = this.getAll();
    const profiles = ProfileService.getAll();

    const qrCount = history.filter(h => h.category === 'qr').length;
    const nfcCount = history.filter(h => h.category === 'nfc').length;
    const profileCount = profiles.length;

    return {
      qrCount,
      nfcCount,
      profileCount,
      totalHistory: history.length,
    };
  }
}
