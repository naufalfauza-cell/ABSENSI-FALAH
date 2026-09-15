import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  correctPin: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  correctPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === correctPin.trim()) {
      setError('');
      setPin('');
      onLoginSuccess();
      onClose();
    } else {
      setError('PIN Admin salah. Silakan coba lagi (Default PIN: 1945)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-100">
            <Shield className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-slate-900">Akses Panel Admin Panitia</h3>
        <p className="text-xs text-slate-500 mt-1">
          Masukkan PIN Keamanan untuk mengelola kustomisasi tag lokasi, jadwal batas check-in/out, dan rekap panitia Falah.
        </p>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Admin</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={8}
                id="admin-pin-input"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="••••"
                className="w-full pl-9 pr-3 py-2 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:bg-white focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-center">Petunjuk: PIN default adalah <strong>1945</strong></p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              id="confirm-admin-pin-btn"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Buka Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
