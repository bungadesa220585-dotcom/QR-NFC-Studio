import { AppOwner, UserAccount } from '../types';
import { StorageService } from './StorageService';

export class AuthService {
  private static OWNER_KEY = StorageService.getKeys().OWNER;
  private static ACCOUNTS_KEY = StorageService.getKeys().ACCOUNTS;
  private static CURRENT_USER_KEY = StorageService.getKeys().CURRENT_USER;

  private static DEFAULT_OWNER: AppOwner = {
    name: 'Bunga Desa',
    username: 'bungadesa',
    email: 'bungadesa220585@gmail.com',
    role: 'Pemilik Studio & IoT Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    pin: '1234',
    pinEnabled: false, // Default tidak terkunci agar langsung nyaman digunakan, bisa diaktifkan kapan saja
    isLocked: false,
  };

  /**
   * Mengambil data Pemilik Tunggal aplikasi
   */
  static getOwner(): AppOwner {
    const saved = StorageService.getItem<AppOwner | null>(this.OWNER_KEY, null);
    if (!saved) {
      // Periksa apakah ada akun lama dari penyimpanan sebelumnya untuk migrasi mulus
      const oldAccounts = StorageService.getItem<UserAccount[]>(this.ACCOUNTS_KEY, []);
      if (oldAccounts.length > 0) {
        const first = oldAccounts[0];
        const migrated: AppOwner = {
          name: first.name || this.DEFAULT_OWNER.name,
          username: first.username || this.DEFAULT_OWNER.username,
          email: first.email || this.DEFAULT_OWNER.email,
          role: first.role || this.DEFAULT_OWNER.role,
          avatarUrl: first.avatarUrl || this.DEFAULT_OWNER.avatarUrl,
          pin: first.pin || '1234',
          pinEnabled: false,
          isLocked: false,
        };
        StorageService.setItem(this.OWNER_KEY, migrated);
        return migrated;
      }

      StorageService.setItem(this.OWNER_KEY, this.DEFAULT_OWNER);
      return this.DEFAULT_OWNER;
    }
    return saved;
  }

  /**
   * Memperbarui profil Pemilik aplikasi
   */
  static updateOwner(partial: Partial<AppOwner>): AppOwner {
    const current = this.getOwner();
    const updated: AppOwner = {
      ...current,
      ...partial,
      // Jangan timpa pin lewat fungsi ini kecuali ditentukan eksplisit
      pin: partial.pin !== undefined ? partial.pin.trim() : current.pin,
    };
    StorageService.setItem(this.OWNER_KEY, updated);
    return updated;
  }

  /**
   * Kunci aplikasi (hanya berlaku jika pinEnabled aktif, atau bisa dipaksa mengaktifkan PIN)
   */
  static lockStudio(): boolean {
    const current = this.getOwner();
    const updated = { ...current, isLocked: true };
    StorageService.setItem(this.OWNER_KEY, updated);
    return true;
  }

  /**
   * Buka kunci studio dengan memasukkan PIN Pemilik
   */
  static unlockStudio(inputPin: string): { success: boolean; message: string } {
    const current = this.getOwner();
    const cleanPin = inputPin.trim();

    if (!cleanPin) {
      return { success: false, message: 'Masukkan PIN Pemilik.' };
    }

    if (cleanPin === current.pin) {
      const updated = { ...current, isLocked: false };
      StorageService.setItem(this.OWNER_KEY, updated);
      return { success: true, message: 'Kunci studio berhasil dibuka.' };
    }

    return { success: false, message: 'PIN salah! Silakan coba lagi.' };
  }

  /**
   * Mengaktifkan atau menonaktifkan fitur Kunci PIN
   */
  static togglePinLock(enable: boolean, currentPinCheck?: string): { success: boolean; message: string } {
    const current = this.getOwner();
    
    // Jika ingin menonaktifkan kunci PIN dan PIN sudah pernah diatur, verifikasi PIN saat ini
    if (!enable && current.pinEnabled && currentPinCheck !== undefined) {
      if (currentPinCheck.trim() !== current.pin) {
        return { success: false, message: 'PIN saat ini salah. Tidak dapat menonaktifkan kunci.' };
      }
    }

    const updated: AppOwner = {
      ...current,
      pinEnabled: enable,
      isLocked: enable ? false : false,
    };
    StorageService.setItem(this.OWNER_KEY, updated);
    return {
      success: true,
      message: enable
        ? 'Perlindungan Kunci PIN berhasil diaktifkan.'
        : 'Perlindungan Kunci PIN dinonaktifkan.',
    };
  }

  /**
   * Mengubah PIN Pemilik
   */
  static changePin(oldPin: string, newPin: string): { success: boolean; message: string } {
    const current = this.getOwner();
    if (oldPin.trim() !== current.pin) {
      return { success: false, message: 'PIN lama salah.' };
    }
    if (!newPin.trim() || newPin.trim().length < 4) {
      return { success: false, message: 'PIN baru minimal harus 4 karakter/angka.' };
    }

    const updated = {
      ...current,
      pin: newPin.trim(),
    };
    StorageService.setItem(this.OWNER_KEY, updated);
    return { success: true, message: 'PIN Pemilik berhasil diperbarui.' };
  }

  // --- Kompatibilitas Mundur (Backward Compatibility) ---
  static getCurrentUser(): UserAccount | null {
    const owner = this.getOwner();
    return {
      id: 'owner_single_user',
      name: owner.name,
      username: owner.username,
      email: owner.email,
      pin: owner.pin,
      avatarUrl: owner.avatarUrl,
      role: owner.role,
      createdAt: Date.now() - 86400000 * 30,
      lastLogin: Date.now(),
    };
  }

  static getAccounts(): UserAccount[] {
    const curr = this.getCurrentUser();
    return curr ? [curr] : [];
  }

  static login(identifier: string, pin: string): { success: boolean; user?: UserAccount; message: string } {
    return this.unlockStudio(pin);
  }

  static register(data: { name: string; username: string; pin: string; email?: string; role?: string }): { success: boolean; user?: UserAccount; message: string } {
    this.updateOwner({
      name: data.name,
      username: data.username,
      pin: data.pin,
      email: data.email,
      role: data.role,
    });
    const curr = this.getCurrentUser();
    return { success: true, user: curr || undefined, message: 'Profil pemilik berhasil diperbarui.' };
  }

  static logout(): void {
    this.lockStudio();
  }
}
