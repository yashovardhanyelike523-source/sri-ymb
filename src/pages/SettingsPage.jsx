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
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
    </div>
  );
}
