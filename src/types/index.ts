export type PageType = 
  | 'dashboard' 
  | 'qr-generator' 
  | 'profiles' 
  | 'profile-public' 
  | 'nfc-writer' 
  | 'nfc-reader' 
  | 'history' 
  | 'settings';

export type QrDataType = 
  | 'url' 
  | 'text' 
  | 'phone' 
  | 'email' 
  | 'wifi' 
  | 'vcard' 
  | 'profile';

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface WifiData {
  ssid: string;
  password?: string;
  encryption: WifiEncryption;
  hidden?: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
  address?: string;
}

export interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  github?: string;
  whatsapp?: string;
  twitter?: string;
  tiktok?: string;
  telegram?: string;
  customUrl?: string;
}

export interface DigitalProfile {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  bio?: string;
  isPublic: boolean;
  socials: SocialLinks;
  createdAt: number;
  updatedAt: number;
}

export interface QrRecord {
  id: string;
  title: string;
  type: QrDataType;
  rawData: string;
  formattedDisplay: string;
  fgColor: string;
  bgColor: string;
  createdAt: number;
  profileId?: string;
}

export type NfcOperationType = 'write' | 'read';
export type NfcOperationStatus = 'idle' | 'scanning' | 'writing' | 'success' | 'error' | 'unsupported';

export interface NfcRecordData {
  recordType: 'url' | 'text' | 'mime' | 'unknown';
  data: string;
  encoding?: string;
  lang?: string;
}

export interface NfcHistoryItem {
  id: string;
  type: NfcOperationType;
  title: string;
  dataType: 'url' | 'text' | 'profile';
  content: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp: number;
  recordsCount?: number;
}

export interface HistoryItem {
  id: string;
  category: 'qr' | 'profile' | 'nfc';
  title: string;
  dataType: string;
  value: string;
  status?: string;
  createdAt: number;
  updatedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface NfcSupportState {
  isSupported: boolean;
  isSecureContext: boolean;
  reason?: string;
}

export interface AppOwner {
  name: string;
  username: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  pin: string;
  pinEnabled: boolean;
  isLocked: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email?: string;
  pin: string;
  avatarUrl?: string;
  role?: string;
  createdAt: number;
  lastLogin: number;
}

