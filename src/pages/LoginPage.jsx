// ==============================================================================
// SRI YMB TRADING COMPANY — ADMIN AUTHENTICATION LOGIN PAGE
// Features: High-Quality Dried Red Chilli Background, Show/Hide Password,
// Secure Password Recovery, Enterprise Authentication Guard
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Flame,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Settings,
  UserPlus,
  LogIn,
  User,
} from 'lucide-react';

import Modal from '../components/common/Modal';

export default function LoginPage({ onOpenSettings }) {
  const { login, signUp, resetPassword, isConfigured } = useAuth();
  const { success, error: toastError } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email.trim() || !password) {
      setAuthError('Please enter both your administrator email and password.');
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match. Please verify your entries.');
        return;
      }

      try {
        setLoading(true);
        const data = await signUp(email, password, fullName.trim() || 'Administrator');
        if (data?.session) {
          success('Administrator account registered and signed in successfully!');
        } else {
          success(
            `Administrator account created for ${email}. You can now sign in with your credentials.`,
            'Registration Succeeded'
          );
          setIsSignUp(false);
        }
      } catch (err) {
        console.error('Sign up error:', err);
        const msg = err.message || 'Unable to register administrator account. Please check your Supabase settings.';
        setAuthError(msg);
        toastError(msg, 'Registration Failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      success('Authentication successful. Welcome to Mirchi IMS.');
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || 'Invalid administrator credentials. Access denied.';
      setAuthError(msg);
      toastError(msg, 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toastError('Please enter your administrator email address.');
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(resetEmail);
      success(
        `Password recovery instructions have been sent to ${resetEmail}. Check your inbox.`,
        'Recovery Email Dispatched'
      );
      setResetModalOpen(false);
      setResetEmail('');
    } catch (err) {
      toastError(err.message || 'Unable to send recovery email.', 'Reset Error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950 font-sans">
      {/* Background Image: High-Quality Dried Red Chillies */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-[0.45] contrast-[1.1] scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('/images/chilli-bg.jpg')`,
        }}
      />

      {/* Luxury Gradient Dark Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-red-950/80 to-black/75 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-red-900/20 to-black/90 pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden ring-1 ring-black/10">
          
          {/* Header Banner */}
          <div className="p-8 pb-6 bg-gradient-to-b from-red-950 via-red-900 to-red-950 text-white text-center relative border-b border-red-800/80">
            {/* Golden decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-amber-100 shadow-xl shadow-red-950/60 ring-4 ring-amber-400/20 mb-4 animate-in zoom-in-50 duration-300">
              <Flame className="w-9 h-9 fill-amber-300 stroke-red-950" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">
              Sri YMB Trading Company
            </h1>
            <p className="text-xs font-semibold text-amber-300 tracking-wider uppercase mt-1">
              Mirchi Inventory Management System
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-red-200 text-[11px] font-medium border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Internal Administration Portal</span>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-6">
            {!isConfigured && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Supabase Setup Required
                </div>
                <p className="mt-1 text-[11px] text-amber-700 leading-relaxed">
                  Connect your Supabase credentials in <span className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env</span> or click below to configure instantly.
                </p>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure Database Connection
                  </button>
                )}
              </div>
            )}

            {authError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{authError}</div>
              </div>
            )}

            {/* Mode Switcher: Sign In vs Register Admin */}
            <div className="flex p-1 mb-5 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  !isSignUp
                    ? 'bg-white text-red-900 shadow-sm shadow-slate-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSignUp
                    ? 'bg-white text-red-900 shadow-sm shadow-slate-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                <span>Register Admin</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name / Designation
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Yasho Vardhan (Managing Director)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-slate-50/50 hover:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sriymb.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-slate-50/50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isSignUp ? 'Create Password (min. 6 characters)' : 'Secure Password'}
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetModalOpen(true);
                      }}
                      className="text-xs font-semibold text-red-700 hover:text-red-900 transition hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-slate-50/50 hover:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-slate-50/50 hover:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-red-900 hover:from-red-800 hover:to-red-950 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>{isSignUp ? 'Creating Administrator Account...' : 'Verifying Credentials...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Register & Access System' : 'Sign In to System'}</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>

            {/* Public Registration Policy Notice */}
            <div className="mt-6 pt-5 border-t border-slate-200/90 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Strict Enterprise Access:</span> {isSignUp ? 'New administrators will be granted full inventory management rights upon registration.' : 'Internal access is restricted to authorized partners & managers of Sri YMB Trading Company.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-xs text-amber-200/80 drop-shadow">
          Sri YMB Trading Company • Mirchi Inventory Management System
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Admin Password Recovery"
        subtitle="Request a secure password reset link to your administrator email"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <p>
              Supabase Auth will dispatch a secure single-use recovery link to your registered email address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Registered Email
            </label>
            <input
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="admin@sriymb.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {resetLoading ? 'Sending...' : 'Send Recovery Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
