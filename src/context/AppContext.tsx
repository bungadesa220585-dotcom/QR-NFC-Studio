import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageType, AppOwner, UserAccount } from '../types';
import { StorageService } from '../services/StorageService';
import { NfcService } from '../services/NfcService';
import { AuthService } from '../services/AuthService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface AppContextType {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  activeProfileSlug: string | null;
  openPublicProfile: (slug: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  confirmDialog: ConfirmDialogState;
  showConfirm: (dialog: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirm: () => void;
  isNfcSupported: boolean;
  nfcReason?: string;
  refreshStatsTrigger: number;
  triggerStatsRefresh: () => void;
  
  // Single Owner & Security PIN State
  owner: AppOwner;
  isLocked: boolean;
  lockStudio: () => void;
  unlockStudio: (pin: string) => { success: boolean; message: string };
  updateOwner: (partial: Partial<AppOwner>) => void;
  togglePinLock: (enable: boolean, currentPin?: string) => { success: boolean; message: string };
  changePin: (oldPin: string, newPin: string) => { success: boolean; message: string };
  isOwnerModalOpen: boolean;
  setIsOwnerModalOpen: (open: boolean) => void;

  // Backward compatibility aliases
  currentUser: UserAccount | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (identifier: string, pin: string) => { success: boolean; message: string };
  register: (data: { name: string; username: string; pin: string; email?: string; role?: string }) => { success: boolean; message: string };
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [activeProfileSlug, setActiveProfileSlug] = useState<string | null>(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = StorageService.getSettings().darkMode;
    if (typeof saved === 'boolean') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // NFC support check
  const [nfcState, setNfcState] = useState(() => NfcService.checkSupport());

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Trigger for refreshing stats
  const [refreshStatsTrigger, setRefreshStatsTrigger] = useState<number>(0);

  const triggerStatsRefresh = () => {
    setRefreshStatsTrigger(prev => prev + 1);
  };

  // Sync theme to document class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveSettings({ darkMode: isDarkMode });
  }, [isDarkMode]);

  // Check URL params on initial load (e.g. ?p=slug for public profile)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileSlug = params.get('p');
    if (profileSlug) {
      setActiveProfileSlug(profileSlug);
      setCurrentPage('profile-public');
    }

    // Refresh NFC check on focus
    const handleFocus = () => {
      setNfcState(NfcService.checkSupport());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  const showConfirm = (dialog: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({
      ...dialog,
      isOpen: true,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const openPublicProfile = (slug: string) => {
    setActiveProfileSlug(slug);
    setCurrentPage('profile-public');
    const url = new URL(window.location.href);
    url.searchParams.set('p', slug);
    window.history.pushState({}, '', url.toString());
  };

  // Single Owner & Security State
  const [owner, setOwner] = useState<AppOwner>(() => AuthService.getOwner());
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);

  const lockStudio = () => {
    AuthService.lockStudio();
    setOwner(AuthService.getOwner());
    showToast('Studio telah dikunci dengan aman.', 'info');
  };

  const unlockStudio = (pin: string) => {
    const res = AuthService.unlockStudio(pin);
    if (res.success) {
      setOwner(AuthService.getOwner());
      showToast('Kunci studio terbuka!', 'success');
      triggerStatsRefresh();
    }
    return res;
  };

  const updateOwner = (partial: Partial<AppOwner>) => {
    const updated = AuthService.updateOwner(partial);
    setOwner(updated);
    triggerStatsRefresh();
  };

  const togglePinLock = (enable: boolean, currentPin?: string) => {
    const res = AuthService.togglePinLock(enable, currentPin);
    if (res.success) {
      setOwner(AuthService.getOwner());
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
    return res;
  };

  const changePin = (oldPin: string, newPin: string) => {
    const res = AuthService.changePin(oldPin, newPin);
    if (res.success) {
      setOwner(AuthService.getOwner());
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
    return res;
  };

  // Compatibility helpers
  const currentUser: UserAccount | null = {
    id: 'owner_single_user',
    name: owner.name,
    username: owner.username,
    email: owner.email,
    pin: owner.pin,
    avatarUrl: owner.avatarUrl,
    role: owner.role,
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };

  const navigateToPage = (page: PageType) => {
    if (page !== 'profile-public') {
      const url = new URL(window.location.href);
      url.searchParams.delete('p');
      window.history.pushState({}, '', url.toString());
    }
    setCurrentPage(page);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage: navigateToPage,
        activeProfileSlug,
        openPublicProfile,
        isDarkMode,
        toggleDarkMode,
        toasts,
        showToast,
        confirmDialog,
        showConfirm,
        closeConfirm,
        isNfcSupported: nfcState.isSupported,
        nfcReason: nfcState.reason,
        refreshStatsTrigger,
        triggerStatsRefresh,
        
        // Single Owner
        owner,
        isLocked: Boolean(owner.pinEnabled && owner.isLocked),
        lockStudio,
        unlockStudio,
        updateOwner,
        togglePinLock,
        changePin,
        isOwnerModalOpen,
        setIsOwnerModalOpen,

        // Compat
        currentUser,
        isLoginModalOpen: isOwnerModalOpen,
        setIsLoginModalOpen: setIsOwnerModalOpen,
        login: (_id: string, pin: string) => unlockStudio(pin),
        register: (data) => {
          updateOwner(data);
          return { success: true, message: 'Profil disimpan' };
        },
        logout: () => lockStudio(),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
