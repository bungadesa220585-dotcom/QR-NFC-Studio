import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { DigitalProfile, QrRecord, HistoryItem } from '../types';
import { StorageService } from './StorageService';

export class FirestoreSyncService {
  /**
   * Mengambil profil publik langsung dari Cloud Firestore berdasarkan slug.
   * Digunakan saat kartu NFC ditap atau QR discan oleh orang lain/publik di perangkat mana saja.
   */
  static async getPublicProfileBySlug(slug: string): Promise<DigitalProfile | null> {
    const cleanSlug = slug.toLowerCase().trim();
    const collectionPath = 'profiles';
    try {
      const q = query(
        collection(db, collectionPath),
        where('slug', '==', cleanSlug),
        where('isPublic', '==', true)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const docData = querySnapshot.docs[0].data();
      const createdAt = docData.createdAt instanceof Timestamp 
        ? docData.createdAt.toMillis() 
        : (typeof docData.createdAt === 'number' ? docData.createdAt : Date.now());
      const updatedAt = docData.updatedAt instanceof Timestamp 
        ? docData.updatedAt.toMillis() 
        : (typeof docData.updatedAt === 'number' ? docData.updatedAt : Date.now());

      return {
        id: docData.id || querySnapshot.docs[0].id,
        slug: docData.slug,
        fullName: docData.fullName,
        avatarUrl: docData.avatarUrl || '',
        title: docData.title || '',
        company: docData.company || '',
        phone: docData.phone || '',
        email: docData.email || '',
        website: docData.website || '',
        address: docData.address || '',
        bio: docData.bio || '',
        isPublic: Boolean(docData.isPublic),
        socials: docData.socials || {},
        createdAt,
        updatedAt,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  }

  /**
   * Menyimpan atau memperbarui profil digital ke Cloud Firestore
   */
  static async uploadProfile(profile: DigitalProfile): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Anda harus login dengan akun Google terlebih dahulu untuk sinkronisasi ke Cloud.');
    }

    const docPath = `profiles/${profile.id}`;
    try {
      const existingDocSnap = await getDoc(doc(db, 'profiles', profile.id));
      const isCreate = !existingDocSnap.exists();

      const payload: Record<string, unknown> = {
        id: profile.id,
        slug: profile.slug,
        fullName: profile.fullName,
        isPublic: profile.isPublic ?? true,
        ownerUid: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (isCreate) {
        payload.createdAt = serverTimestamp();
      }

      if (profile.avatarUrl) payload.avatarUrl = profile.avatarUrl;
      if (profile.title) payload.title = profile.title;
      if (profile.company) payload.company = profile.company;
      if (profile.phone) payload.phone = profile.phone;
      if (profile.email) payload.email = profile.email;
      if (profile.website) payload.website = profile.website;
      if (profile.address) payload.address = profile.address;
      if (profile.bio) payload.bio = profile.bio;
      if (profile.socials) payload.socials = profile.socials;

      await setDoc(doc(db, 'profiles', profile.id), payload, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  /**
   * Menghapus profil dari Cloud Firestore
   */
  static async deleteProfile(profileId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const docPath = `profiles/${profileId}`;
    try {
      await deleteDoc(doc(db, 'profiles', profileId));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }

  /**
   * Mengambil semua profil milik user dari Cloud Firestore
   */
  static async fetchMyProfiles(): Promise<DigitalProfile[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const collectionPath = 'profiles';
    try {
      const q = query(
        collection(db, collectionPath),
        where('ownerUid', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const profiles: DigitalProfile[] = [];

      querySnapshot.forEach(d => {
        const data = d.data();
        profiles.push({
          id: data.id || d.id,
          slug: data.slug,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl || '',
          title: data.title || '',
          company: data.company || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          address: data.address || '',
          bio: data.bio || '',
          isPublic: Boolean(data.isPublic),
          socials: data.socials || {},
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now(),
        });
      });

      return profiles;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  }

  /**
   * Sinkronisasi penuh semua profil lokal ke Cloud Firestore
   */
  static async syncAllLocalProfilesToCloud(): Promise<{ uploaded: number; failed: number }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Silakan login dengan Google terlebih dahulu.');
    }

    const localProfiles = StorageService.getItem<DigitalProfile[]>(StorageService.getKeys().PROFILES, []);
    let uploaded = 0;
    let failed = 0;

    for (const p of localProfiles) {
      try {
        await this.uploadProfile(p);
        uploaded++;
      } catch (e) {
        console.error(`Gagal mengunggah profil ${p.fullName}:`, e);
        failed++;
      }
    }

    return { uploaded, failed };
  }

  /**
   * Unduh data cloud ke penyimpanan lokal (restore/sync)
   */
  static async pullProfilesFromCloud(): Promise<number> {
    const cloudProfiles = await this.fetchMyProfiles();
    if (cloudProfiles.length > 0) {
      StorageService.setItem(StorageService.getKeys().PROFILES, cloudProfiles);
    }
    return cloudProfiles.length;
  }
}
