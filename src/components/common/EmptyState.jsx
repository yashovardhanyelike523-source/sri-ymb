// ==============================================================================
// SRI YMB TRADING COMPANY — EMPTY STATE COMPONENT
// ==============================================================================

import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no records matching your criteria or inventory is currently empty.',
  icon: Icon = PackageOpen,
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300 my-4 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-4 ring-8 ring-red-50/50">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
}
