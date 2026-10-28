// ==============================================================================
// SRI YMB TRADING COMPANY — CONFIRMATION DIALOG FOR SAFE ACTIONS
// ==============================================================================

import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2, Archive, Check } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
}) {
  let icon = <AlertTriangle className="w-10 h-10 text-amber-500" />;
  let btnClass = 'bg-red-700 hover:bg-red-800 text-white';

  if (type === 'danger') {
    icon = <Trash2 className="w-10 h-10 text-red-600" />;
    btnClass = 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30';
  } else if (type === 'archive') {
    icon = <Archive className="w-10 h-10 text-amber-600" />;
    btnClass = 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30';
  } else if (type === 'primary') {
    icon = <Check className="w-10 h-10 text-emerald-600" />;
    btnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center p-2">
        <div className="p-3 bg-red-50 rounded-full mb-4">
          {icon}
        </div>
        <p className="text-sm text-slate-700 leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition text-sm disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${btnClass}`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
