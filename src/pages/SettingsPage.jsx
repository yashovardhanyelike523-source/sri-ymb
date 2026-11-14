// ==============================================================================
// SRI YMB TRADING COMPANY — SETTINGS & DATABASE CONFIGURATION PAGE
// Supabase Connection Health Test, Runtime Credentials, Password Update & SQL Guide
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  getSupabaseCredentials,
  saveRuntimeCredentials,
  testSupabaseConnection,
} from '../lib/supabase';
import { clearAllInventoryData } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import {
  Database,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Save,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updatePassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [creds, setCreds] = useState({ url: '', key: '' });
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Password update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Client Handover Zero Reset
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const current = getSupabaseCredentials();
    setCreds(current);
    checkConn();
  }, []);


  const checkConn = async () => {
    setTestingConnection(true);
    const result = await testSupabaseConnection();
    setConnectionStatus(result);
    setTestingConnection(false);
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    if (!creds.url.trim() || !creds.key.trim()) {
      toastError('Both Supabase Project URL and Anon Public Key are required.');
      return;
    }
    saveRuntimeCredentials(creds.url, creds.key);
    success('Credentials saved. Reloading application...');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toastError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      await updatePassword(newPassword);
      success('Administrator password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toastError(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const copySqlPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    success('Path "supabase/schema.sql" copied to clipboard.');
  };

  const handleResetAllData = async (e) => {
    e.preventDefault();
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      toastError('Please type "RESET" to confirm.');
      return;
    }

    try {
      setResetting(true);
      await clearAllInventoryData(user?.email);
      success('All data has been cleared! Every metric and table is reset to 0.', 'System Reset Successful');
      setResetModalOpen(false);
      setResetConfirmText('');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Reset error:', err);
      toastError(err.message || 'Failed to reset database tables.', 'Reset Error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            System & Database Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supabase connection parameters, Row Level Security check & administrator profile
          </p>
        </div>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Supabase PostgreSQL Connection
              </h3>
              <p className="text-xs text-slate-500">
                Backend database and private storage status
              </p>
            </div>
          </div>

          <button
            onClick={checkConn}
            disabled={testingConnection}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-red-700' : ''}`} />
            <span>Test Connectivity</span>
          </button>
        </div>

        {connectionStatus && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
              connectionStatus.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {connectionStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {connectionStatus.connected
                  ? 'Connected to Supabase Database'
                  : 'Connection Alert'}
              </div>
              <div className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                {connectionStatus.message}
              </div>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Supabase Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              required
              value={creds.url}
              onChange={(e) => setCreds({ ...creds, url: e.target.value })}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              required
              value={creds.key}
              onChange={(e) => setCreds({ ...creds, key: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Never enter the service-role key. Use only the anonymous public client key with Row Level Security.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* SQL Migration & Schema Setup Guide */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Terminal className="w-5 h-5 text-red-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Database Schema & SQL Migrations
            </h3>
            <p className="text-xs text-slate-500">
              PostgreSQL schema, triggers, and Row Level Security definitions
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The database scripts are ready in your repository:
        </p>

        <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-200 flex items-center justify-between">
          <span>supabase/schema.sql (Tables, RLS & Atomic Trigger Function)</span>
          <button
            onClick={copySqlPath}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-200 flex items-center justify-between">
          <span>supabase/seed.sql (Cold storages, authentic mirchi lots, seed records)</span>
        </div>

        <p className="text-[11px] text-slate-500">
          Paste these files into your Supabase Dashboard SQL Editor to instantiate all tables, security policies, and the private "bills" storage bucket.
        </p>
      </div>

      {/* Admin Profile & Password Update */}
      {user && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Administrator Password & Security
              </h3>
              <p className="text-xs text-slate-500">
                Logged in as: <span className="font-bold text-slate-800">{user.email}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {updatingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client Handover: Reset Every Column & Metric to Zero */}
      <div className="bg-red-50/70 p-5 rounded-2xl border-2 border-red-200 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-800">
              <Trash2 className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-950 uppercase tracking-tight">
                Client Handover • Reset All Data to Zero
              </h3>
              <p className="text-xs text-red-800/90 mt-0.5">
                Permanently wipes all demo chilli stock, movements, bills, and warehouses so your client can enter their own live company data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="shrink-0 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Database to 0</span>
          </button>
        </div>

        <div className="p-3 bg-white/80 rounded-xl border border-red-200/80 text-[11px] text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            This clears demo entries across all tables: <strong className="text-slate-800">Inventory Lots, Stock Ledger, Mandi Bills, and Cold Storages</strong>. Administrator accounts and database structure are preserved.
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Confirm Client Handover Reset"
        subtitle="This action will permanently erase all demo data and reset every metric to zero."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetAllData} className="space-y-4">
          <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Are you preparing this site for client handover?</p>
              <p className="text-[11px] leading-relaxed text-red-800">
                All inventory records, stock intake, sales dispatches, and uploaded bills will be deleted. Every metric on the dashboard will read exactly 0.00.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Type <span className="text-red-700 font-mono">RESET</span> to confirm:
            </label>
            <input
              type="text"
              required
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setResetModalOpen(false);
                setResetConfirmText('');
              }}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetting || resetConfirmText.trim().toUpperCase() !== 'RESET'}
              className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 cursor-pointer transition"
            >
              {resetting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Clearing All Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe All Data to 0</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
