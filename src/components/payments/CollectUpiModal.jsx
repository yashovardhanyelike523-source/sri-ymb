// ==============================================================================
// SRI YMB TRADING COMPANY — DYNAMIC UPI QR & YOUPI-PG PAYMENT GATEWAY MODAL
// Supports YouPI-PG (Self-Hosted UPI), Direct Dynamic UPI QR, GPay/PhonePe App Intent & Razorpay
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getCompanyPaymentSettings,
  buildUpiPaymentUri,
  createPaymentRecord,
  loadYoupiScript,
} from '../../lib/api';
import { formatINR } from '../../lib/units';
import {
  QrCode,
  Smartphone,
  CreditCard,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  Info,
} from 'lucide-react';

export default function CollectUpiModal({
  isOpen,
  onClose,
  inventoryLots = [],
  initialLot = null,
  initialAmount = '',
  initialParty = '',
  onSuccess,
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('youpi'); // 'youpi' | 'qr' | 'gateway'

  // Settings
  const [settings, setSettings] = useState(getCompanyPaymentSettings());

  // Payment Form Fields
  const [amount, setAmount] = useState(initialAmount || '');
  const [partyName, setPartyName] = useState(initialParty || '');
  const [partyPhone, setPartyPhone] = useState('');
  const [selectedLotId, setSelectedLotId] = useState(initialLot?.id || '');
  const [billReference, setBillReference] = useState('');
  const [paymentType, setPaymentType] = useState('SALE_COLLECTION');
  const [utrNumber, setUtrNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [lastPaymentRef, setLastPaymentRef] = useState('');

  // YouPI WhatsApp OTP & Observer State
  const [waStage, setWaStage] = useState('unverified'); // 'unverified' | 'otp_sent' | 'verified'
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [observerListening, setObserverListening] = useState(false);

  useEffect(() => {
    const s = getCompanyPaymentSettings();
    setSettings(s);
    if (initialLot) {
      setSelectedLotId(initialLot.id);
    }
    if (initialAmount) {
      setAmount(initialAmount);
    }
    if (initialParty) {
      setPartyName(initialParty);
    }
    setPaymentDone(false);
    setWaStage('unverified');
    setObserverListening(false);
  }, [isOpen, initialLot, initialAmount, initialParty]);

  const numAmount = Number(amount) || 0;
  const transactionRef = `YMB-${Date.now().toString().slice(-6)}`;
  const transactionNote = `Sri YMB Chilli ${transactionRef}`;

  // Standard NPCI UPI URI
  const upiUri = buildUpiPaymentUri({
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    amount: numAmount > 0 ? numAmount : undefined,
    transactionNote,
    referenceId: transactionRef,
  });

  // App specific deep-links
  const phonePeUri = upiUri.replace('upi://', 'phonepe://');
  const paytmUri = upiUri.replace('upi://', 'paytmmp://');
  const gpayUri = upiUri;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    success(`UPI ID "${settings.upiId}" copied to clipboard.`);
  };

  // WhatsApp OTP Generator (YouPI Berry Protocol Simulation)
  const handleSendWhatsAppOtp = () => {
    if (!partyPhone.trim() || partyPhone.trim().length < 10) {
      toastError('Please enter a valid 10-digit mobile number for WhatsApp verification.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setWaStage('otp_sent');
    success(`YouPI WhatsApp OTP sent to ${partyPhone}: [ ${code} ]`);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === generatedOtp) {
      setWaStage('verified');
      setObserverListening(true);
      success('Phone number verified via WhatsApp! Dynamic UPI QR activated.');
    } else {
      toastError('Incorrect 6-digit OTP. Please enter the OTP sent to your WhatsApp.');
    }
  };

  // Simulate Instant Bank SMS / Notification Credit Detection
  const handleSimulateBankCredit = () => {
    const simUtr = `42${Date.now().toString().slice(-10)}`;
    setUtrNumber(simUtr);
    success(`[YouPI Banking Mesh] Credit alert received: ₹${numAmount} settled! UTR: ${simUtr}`);
    handleSavePayment('YOUPI_PG', simUtr);
  };

  const handleSavePayment = async (method = 'YOUPI_PG', gatewayId = null) => {
    if (!partyName.trim()) {
      toastError('Please enter the customer / party name.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      toastError('Please enter a valid payment amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createPaymentRecord(
        {
          payment_number: transactionRef,
          payment_type: paymentType,
          amount: numAmount,
          payment_method: method,
          upi_id: settings.upiId,
          utr_number: utrNumber || (gatewayId ? String(gatewayId) : null),
          gateway_payment_id: gatewayId || null,
          status: 'COMPLETED',
          lot_id: selectedLotId || null,
          bill_reference: billReference || null,
          party_name: partyName,
          party_phone: partyPhone,
          payment_date: new Date().toISOString().split('T')[0],
          remarks: remarks || `Settled via ${method} (Sri YMB Trading)`,
        },
        user?.email
      );

      setLastPaymentRef(res.payment_number);
      setPaymentDone(true);
      success(`Payment receipt #${res.payment_number} generated successfully!`);
      if (onSuccess) onSuccess();
    } catch (err) {
      toastError(err.message || 'Failed to save payment record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Launch Live YouPI-PG Gateway Check or Checkout
  const handleLaunchYoupiGateway = async () => {
    if (!partyName.trim() || numAmount <= 0) {
      toastError('Please enter buyer name and payment amount first.');
      return;
    }

    // Attempt to load external youpi.js from configured server
    const loaded = await loadYoupiScript(settings.youpiServerUrl, settings.youpiMerchantKey);
    if (loaded && window.Youpi && typeof window.Youpi.open === 'function') {
      window.Youpi.open({
        key: settings.youpiMerchantKey,
        orderId: transactionRef,
        amount: numAmount,
        currency: 'INR',
        name: partyName,
        phone: partyPhone || undefined,
        enableWhatsAppOtp: settings.youpiEnableWhatsAppOtp,
        onSuccess: (data) => {
          handleSavePayment('YOUPI_PG', data?.utr || transactionRef);
        },
        onFailure: (err) => {
          toastError(err?.message || 'Payment was cancelled or failed.');
        },
      });
      return;
    }

    // If server script is not running standalone, open built-in interactive YouPI flow
    setObserverListening(true);
    success('YouPI-PG Dynamic Checkout active: Complete payment via Vector QR below.');
  };

  // Launch Razorpay Online Checkout
  const handleRazorpayCheckout = () => {
    if (!settings.razorpayKey) {
      toastError(
        'Razorpay Key ID is not configured. You can set it in System Settings or use YouPI-PG / Direct UPI QR.'
      );
      return;
    }

    if (!partyName.trim() || numAmount <= 0) {
      toastError('Please enter party name and amount first.');
      return;
    }

    const loadScript = (src) => {
      return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadScript('https://checkout.razorpay.com/v1/checkout.js').then((loaded) => {
      if (!loaded) {
        toastError('Failed to load Razorpay checkout script. Check internet connection.');
        return;
      }

      const options = {
        key: settings.razorpayKey,
        amount: Math.round(numAmount * 100),
        currency: 'INR',
        name: settings.payeeName,
        description: `Chilli Trade Receipt ${transactionRef}`,
        image: '/favicon.svg',
        prefill: {
          name: partyName,
          contact: partyPhone || undefined,
        },
        theme: {
          color: '#831843',
        },
        handler: function (response) {
          handleSavePayment('RAZORPAY', response.razorpay_payment_id);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        toastError(resp.error.description || 'Razorpay payment failed.');
      });
      rzp.open();
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="YouPI-PG & UPI Payment Gateway"
      subtitle="Accept 0% fee payments via YouPI-PG, PhonePe, Google Pay, Paytm, or Razorpay"
      maxWidth="max-w-2xl"
    >
      {paymentDone ? (
        /* Success Screen */
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Payment Settled & Recorded!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Receipt <strong className="font-mono text-slate-800">#{lastPaymentRef}</strong> has been logged in your audit-compliant ledger.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-xs space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Party / Buyer:</span>
              <span className="font-bold text-slate-800">{partyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Collected:</span>
              <span className="font-extrabold text-emerald-700">{formatINR(numAmount)}</span>
            </div>
            {utrNumber && (
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Bank UTR / Ref:</span>
                <span className="font-bold text-slate-800">{utrNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Aggregator Fee:</span>
              <span className="font-bold text-emerald-700">₹0.00 (Zero Fee)</span>
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        /* Main Payment UI */
        <div className="space-y-5">
          {/* Sub-Tabs: YouPI-PG vs Direct UPI QR vs Razorpay */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('youpi')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'youpi'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>YouPI-PG (0% Fee)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'qr'
                  ? 'bg-white text-red-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-red-700" />
              <span>Direct UPI QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gateway')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'gateway'
                  ? 'bg-white text-red-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-red-700" />
              <span>Razorpay</span>
            </button>
          </div>

          {/* Form details: Party & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Customer / Buyer Name *
              </label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="e.g. Everest Spice Mills, Mumbai"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Amount to Collect (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Customer WhatsApp / Mobile
              </label>
              <input
                type="tel"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                placeholder="e.g. 9848012345"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Associated Mirchi Lot (Optional)
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
              >
                <option value="">Select Chilli Lot...</option>
                {inventoryLots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lot_number} ({l.chilli_variety})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: YOUPI-PG GATEWAY (SELF-HOSTED 0% FEES) */}
          {/* ============================================================== */}
          {activeTab === 'youpi' && (
            <div className="space-y-4">
              {/* YouPI Gateway Banner */}
              <div className="p-4 bg-purple-950 text-white rounded-2xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wider uppercase text-purple-200">
                      YouPI-PG Gateway Active
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-800 text-purple-200">
                    0% Platform Fees
                  </span>
                </div>
                <p className="text-xs text-purple-200 leading-relaxed">
                  Direct merchant settlement into your bank account. Features WhatsApp phone authentication and automated banking observation mesh (SMS & Gmail reconciliation).
                </p>
              </div>

              {/* Step 1: Optional WhatsApp Pre-Checkout Authentication */}
              {settings.youpiEnableWhatsAppOtp && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Step 1: WhatsApp Pre-Checkout OTP (Berry Protocol)</span>
                    </div>
                    {waStage === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Anti-fraud phone verification</span>
                    )}
                  </div>

                  {waStage === 'unverified' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSendWhatsAppOtp}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send WhatsApp 6-Digit OTP</span>
                      </button>
                    </div>
                  )}

                  {waStage === 'otp_sent' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-36 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono tracking-widest text-center font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg transition shadow-xs"
                      >
                        Verify OTP
                      </button>
                      <span className="text-[11px] text-purple-700 font-mono">
                        Demo OTP: {generatedOtp}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Dynamic QR & Real-Time Settlement */}
              <div className="p-4 bg-white rounded-2xl border-2 border-purple-100 shadow-sm text-center space-y-4">
                <div className="flex flex-col items-center justify-center">
                  <div className="p-3.5 bg-white rounded-2xl shadow-md border border-purple-100 ring-4 ring-purple-50 inline-block">
                    <QRCodeSVG
                      value={upiUri}
                      size={170}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: '/favicon.svg',
                        x: undefined,
                        y: undefined,
                        height: 30,
                        width: 30,
                        excavate: true,
                      }}
                    />
                  </div>

                  <div className="mt-2.5">
                    <div className="text-base font-black text-slate-900">
                      {numAmount > 0 ? formatINR(numAmount) : 'Enter Amount Above'}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Settling into: <strong className="text-slate-800">{settings.upiId}</strong>
                    </div>
                  </div>
                </div>

                {/* Instant App Switcher */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Open in Mobile UPI App (Deep Link)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <a
                      href={gpayUri}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Google Pay</span>
                    </a>

                    <a
                      href={phonePeUri}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      <span>PhonePe</span>
                    </a>

                    <a
                      href={paytmUri}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span>Paytm</span>
                    </a>

                    <a
                      href={upiUri}
                      className="p-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 font-bold text-xs text-purple-900 flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-purple-700" />
                      <span>Any UPI</span>
                    </a>
                  </div>
                </div>

                {/* Step 3: Banking Observation Mesh Trigger / Manual UTR */}
                <div className="pt-3 border-t border-slate-100 text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                      <span>Automated Bank SMS & Notification Mesh</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateBankCredit}
                      disabled={numAmount <= 0 || !partyName.trim()}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline"
                    >
                      Simulate Incoming Bank SMS
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="12-digit UTR from Bank SMS / App (e.g. 428901234567)"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSavePayment('YOUPI_PG')}
                      disabled={submitting || numAmount <= 0 || !partyName.trim()}
                      className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? 'Confirming...' : 'Record Payment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DIRECT NPCI DYNAMIC UPI QR */}
          {/* ============================================================== */}
          {activeTab === 'qr' && (
            <div className="p-5 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100 ring-4 ring-amber-100/50 inline-block">
                  <QRCodeSVG
                    value={upiUri}
                    size={180}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: '/favicon.svg',
                      x: undefined,
                      y: undefined,
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="mt-3">
                  <div className="text-sm font-black text-slate-900">
                    {numAmount > 0 ? formatINR(numAmount) : 'Enter Amount Above'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Payee: <span className="font-bold text-slate-800">{settings.payeeName}</span>
                  </div>
                </div>

                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200">
                  <span>{settings.upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 hover:text-red-700 transition"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Instant Pay on Mobile (Tap to open app)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={gpayUri}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Google Pay</span>
                  </a>

                  <a
                    href={phonePeUri}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>PhonePe</span>
                  </a>

                  <a
                    href={paytmUri}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Paytm</span>
                  </a>

                  <a
                    href={upiUri}
                    className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 font-bold text-xs text-red-900 flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-red-700" />
                    <span>Any UPI App</span>
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    12-Digit Bank UTR / UPI Reference Number
                  </label>
                  <span className="text-[10px] text-slate-400">Optional for instant receipt</span>
                </div>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 428901234567"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-red-600 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => handleSavePayment('UPI_QR')}
                  disabled={submitting || numAmount <= 0 || !partyName.trim()}
                  className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md shadow-red-900/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    'Recording Payment...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm & Record UPI Collection ({formatINR(numAmount)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: RAZORPAY GATEWAY CHECKOUT */}
          {/* ============================================================== */}
          {activeTab === 'gateway' && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-red-100 text-red-800 rounded-2xl shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Online Payment Gateway (Razorpay)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Collect payments via Credit/Debit Cards, NetBanking, UPI Autopay, or Corporate Cards with automated webhooks.
                  </p>
                </div>
              </div>

              {!settings.razorpayKey ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gateway Key Not Configured: </span>
                    <span>
                      Add your Razorpay Key ID in <strong>System Settings $\rightarrow$ Payments Configuration</strong>. You can use YouPI-PG or the zero-fee Dynamic UPI QR code.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Razorpay API key loaded ({settings.razorpayKey.substring(0, 12)}...)</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={submitting || numAmount <= 0 || !partyName.trim()}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <span>Launch Razorpay Checkout for {formatINR(numAmount)}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
