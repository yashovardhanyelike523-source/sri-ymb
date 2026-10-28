// ==============================================================================
// SRI YMB TRADING COMPANY — HEADER NAVBAR COMPONENT
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Menu,
  LogOut,
  Flame,
  ShieldCheck,
  Database,
} from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, profile, logout } = useAuth();

  const { success } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      success('Logged out successfully. Secure session terminated.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-red-950 flex items-center justify-center text-amber-300 shadow-sm shadow-red-900/30 ring-2 ring-red-100">
              <Flame className="w-5 h-5 fill-amber-400 stroke-red-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-red-950">
                  Sri YMB Trading Company
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  Mirchi IMS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Red Chilli Inventory, Cold Storage & Bill Administration
              </p>
            </div>
          </div>
        </div>

        {/* Right: Database Status & Admin Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Supabase Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>PostgreSQL Active</span>
          </div>

          {/* Admin User Info */}
          <div className="flex items-center gap-2.5 pl-2 sm:border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-red-900 text-amber-200 flex items-center justify-center font-bold text-xs shadow-xs">
              {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>{profile?.full_name || user?.email?.split('@')[0] || 'Administrator'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                {user?.email || 'admin@sriymb.com'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log Out Securely"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-900 border border-red-200/80 transition active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
