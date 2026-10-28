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
  getCompanyPaymentSettings,
  saveCompanyPaymentSettings,
  pingYoupiServer,
} from '../lib/api';
import {
  Database,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Save,
  RefreshCw,
  Terminal,
  QrCode,
  CreditCard,
  Zap,
  ExternalLink,
  MessageSquare,
  Globe,
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

  // Payment & UPI Settings (including YouPI-PG)
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: '',
    payeeName: '',
    razorpayKey: '',
    youpiServerUrl: '',
    youpiMerchantKey: '',
    youpiEnableWhatsAppOtp: true,
    youpiWebhookSecret: '',
  });

  const [testingYoupi, setTestingYoupi] = useState(false);
  const [youpiStatus, setYoupiStatus] = useState(null);

  useEffect(() => {
    const current = getSupabaseCredentials();
    setCreds(current);
    checkConn();
    const curPay = getCompanyPaymentSettings();
    setPaymentSettings(curPay);
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

  const handleTestYoupi = async () => {
    if (!paymentSettings.youpiServerUrl?.trim()) {
      toastError('Please enter a YouPI Server URL to test.');
      return;
    }
    setTestingYoupi(true);
    const res = await pingYoupiServer(paymentSettings.youpiServerUrl);
    setYoupiStatus(res);
    setTestingYoupi(false);
    if (res.ok) {
      success('YouPI-PG Gateway server is reachable and online!');
    } else {
      toastError(`YouPI-PG server check: ${res.error || 'Connection failed'}. You can still use Direct UPI QR mode.`);
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

      {/* YouPI-PG Gateway Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  YouPI-PG Self-Hosted UPI Gateway
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800">
                  0% Gateway Fees
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-purple-100 text-purple-800">
                  WhatsApp OTP
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Universal JavaScript checkout integration with WhatsApp phone verification and automated bank SMS / Gmail observation
              </p>
            </div>
          </div>

          <a
            href="https://github.com/youpi-pg/YouPI-PG"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition"
          >
            <span>GitHub Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-950 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-purple-900">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Why YouPI-PG for Sri YMB Chilli Trades?</span>
          </div>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            Eliminates traditional 2–3% aggregator fees on large agricultural chilli transactions. Customers pay directly into your merchant bank account via any UPI app with automatic UTR reconciliation.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!paymentSettings.upiId.trim()) {
              toastError('Company UPI ID cannot be empty.');
              return;
            }
            saveCompanyPaymentSettings(paymentSettings);
            success('YouPI-PG & UPI Payment Settings saved successfully.');
          }}
          className="space-y-4 pt-1"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                YouPI Gateway Server URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={paymentSettings.youpiServerUrl || ''}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, youpiServerUrl: e.target.value })
                  }
                  placeholder="https://pay.sriymb.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestYoupi}
                  disabled={testingYoupi}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingYoupi ? 'animate-spin' : ''}`} />
                  <span>Test Ping</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                URL of your self-hosted YouPI-PG Node.js server. If offline, the app seamlessly uses direct UPI QR.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Merchant Public Key (<code className="lowercase">data-youpi-key</code>)
              </label>
              <input
                type="text"
                value={paymentSettings.youpiMerchantKey || ''}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, youpiMerchantKey: e.target.value })
                }
                placeholder="e.g. ymb_live_pub_key_9921"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Your YouPI gateway merchant identifier passed to the universal checkout script.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Webhook / HMAC Secret Key (Optional)
              </label>
              <input
                type="password"
                value={paymentSettings.youpiWebhookSecret || ''}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, youpiWebhookSecret: e.target.value })
                }
                placeholder="Enter secret for signing observer callbacks"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="relative flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentSettings.youpiEnableWhatsAppOtp !== false}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      youpiEnableWhatsAppOtp: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Pre-Checkout OTP (Berry Protocol)</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Verify buyer phone numbers with 6-digit WhatsApp OTP to prevent spoofing
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Direct UPI and Payee Details */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Direct UPI Settling Account & Payee Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Settlement UPI ID / VPA *
                </label>
                <input
                  type="text"
                  required
                  value={paymentSettings.upiId}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, upiId: e.target.value })
                  }
                  placeholder="e.g. sriymbtrading@okhdfcbank"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Direct NPCI bank account VPA where all customer collections settle instantly.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Payee Legal / Trading Name *
                </label>
                <input
                  type="text"
                  required
                  value={paymentSettings.payeeName}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, payeeName: e.target.value })
                  }
                  placeholder="e.g. Sri YMB Trading Company"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Optional Razorpay */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Razorpay Key ID (Optional — for Online Credit/Debit Cards & NetBanking)
            </label>
            <input
              type="text"
              value={paymentSettings.razorpayKey || ''}
              onChange={(e) =>
                setPaymentSettings({ ...paymentSettings, razorpayKey: e.target.value })
              }
              placeholder="e.g. rzp_test_... or rzp_live_..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Optional fallback if client requests card/netbanking payments instead of UPI.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Save YouPI-PG & Payment Settings</span>
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
