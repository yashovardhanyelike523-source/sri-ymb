// ==============================================================================
// SRI YMB TRADING COMPANY — SIDEBAR NAVIGATION COMPONENT
// ==============================================================================

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  Warehouse,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';


export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Mirchi Inventory', icon: Layers },
  { id: 'movements', label: 'Stock Movements', icon: ArrowLeftRight },
  { id: 'storages', label: 'Cold Storage', icon: Warehouse },
  { id: 'bills', label: 'Purchase Bills', icon: Receipt },
  { id: 'reports', label: 'Reports & Print', icon: BarChart3 },
  { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  { id: 'settings', label: 'System Settings', icon: Settings },
];


export default function Sidebar({ currentTab, onSelectTab, isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-800 to-amber-700 flex items-center justify-center text-amber-300 shadow-md shadow-red-950/60 ring-1 ring-amber-400/30">
              <Flame className="w-6 h-6 fill-amber-400 stroke-red-900" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white">
                SRI YMB TRADING
              </h1>
              <p className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase">
                Chilli Enterprise
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations & Stock
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-red-800 to-red-900 text-amber-200 shadow-md shadow-red-950/40 border border-red-700/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-amber-300' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Info Box */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Standard Conversion</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              1 Quintal (Qtl) = 100 Kilograms (Kg)
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 text-center">
            v1.0 • Internal Admin Portal
          </div>
        </div>
      </aside>
    </>
  );
}
