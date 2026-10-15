import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { owner, unlockStudio } = useApp();
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg('Silakan masukkan PIN Anda');
      return;
    }

    const res = unlockStudio(pinInput);
    if (!res.success) {
      setErrorMsg(res.message);
      setPinInput('');
    } else {
      setErrorMsg('');
      setPinInput('');
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pinInput.length < 8) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center overflow-hidden">
        {/* Glow backdrop decoration */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Lock header */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        {/* Owner Info */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <img
            src={owner.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={owner.name}
            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {owner.name}
          </h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Studio ini dikunci untuk melindungi profil & data kartu NFC Anda. Masukkan PIN Pemilik untuk membuka.
        </p>

        {/* PIN Input field */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Masukkan PIN Pemilik"
              className="w-full text-center text-lg font-mono tracking-widest py-3 px-10 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-500 animate-in fade-in duration-150">
              {errorMsg}
            </p>
          )}

          {/* Quick Keypad for Mobile or Touch */}
          <div className="grid grid-cols-3 gap-2 py-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitClick(num)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base text-slate-800 dark:text-slate-100 transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs text-slate-500 dark:text-slate-400 transition-colors"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base text-slate-800 dark:text-slate-100 transition-colors active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs text-slate-500 dark:text-slate-400 transition-colors"
            >
              &larr;
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
          >
            <Unlock className="w-4 h-4" />
            <span>Buka Kunci Studio</span>
          </button>
        </form>

        <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
          PIN default awal: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">1234</span>
        </p>
      </div>
    </div>
  );
};
