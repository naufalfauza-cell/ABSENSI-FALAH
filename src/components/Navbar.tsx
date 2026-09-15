import React from 'react';
import { Shield, Clock, Users, MapPin, Sparkles } from 'lucide-react';
import { AppSettings } from '../types';

interface NavbarProps {
  settings: AppSettings;
  currentTime: string;
  currentDate: string;
  totalMembers: number;
  totalPresent: number;
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
  onLogoutAdmin: () => void;
  activeTab: 'user' | 'admin';
  setActiveTab: (tab: 'user' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentTime,
  currentDate,
  totalMembers,
  totalPresent,
  isAdminLoggedIn,
  onOpenAdmin,
  onLogoutAdmin,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand & Event */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-fuchsia-700 via-pink-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-fuchsia-600/25 font-black text-lg tracking-wider">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>PANITIA</span>
                  <span className="text-fuchsia-600">FALAH</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200">
                  <Sparkles className="w-3 h-3 text-fuchsia-600" />
                  <span>{settings.eventName || 'Event Falah'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentDate} &bull; {settings.venueName || 'Kampus B Universitas Airlangga'}
              </p>
            </div>
          </div>

          {/* Center Clock & Quick Stats */}
          <div className="hidden md:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-fuchsia-600 animate-pulse" />
              <span className="font-mono font-bold text-base text-slate-900">{currentTime} WIB</span>
            </div>
            <div className="w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Users className="w-4 h-4 text-pink-600" />
              <span>
                Hadir: <strong className="text-slate-900 font-semibold">{totalPresent}</strong> / {totalMembers} Panitia
              </span>
            </div>
          </div>

          {/* Right Navigation & Admin Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                id="tab-presensi-btn"
                onClick={() => setActiveTab('user')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'user'
                    ? 'bg-white text-fuchsia-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Form Presensi
              </button>
              <button
                type="button"
                id="tab-admin-btn"
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setActiveTab('admin');
                  } else {
                    onOpenAdmin();
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white text-fuchsia-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </button>
            </div>

            {isAdminLoggedIn && (
              <button
                type="button"
                id="logout-admin-btn"
                onClick={onLogoutAdmin}
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 font-semibold transition-colors"
                title="Keluar dari mode Admin"
              >
                Kunci Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
