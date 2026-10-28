// ==============================================================================
// SRI YMB TRADING COMPANY — DYNAMIC UPI QR & PAYMENT GATEWAY MODAL
// Supports Dynamic UPI QR Code, GPay/PhonePe/Paytm App Intent & Razorpay Gateway
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
  Flame,
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

  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'gateway' | 'record'

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

  useEffect(() => {
    setSettings(getCompanyPaymentSettings());
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
  const gpayUri = upiUri; // GPay listens to standard upi://

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    success(`UPI ID "${settings.upiId}" copied to clipboard.`);
  };

  const handleSavePayment = async (method = 'UPI_QR', gatewayId = null) => {
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
          utr_number: utrNumber || null,
          gateway_payment_id: gatewayId || null,
          status: 'COMPLETED',
          lot_id: selectedLotId || null,
          bill_reference: billReference || null,
          party_name: partyName,
          party_phone: partyPhone,
          payment_date: new Date().toISOString().split('T')[0],
          remarks: remarks || `Collected via ${method}`,
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

  // Launch Razorpay Online Checkout
  const handleRazorpayCheckout = () => {
    if (!settings.razorpayKey) {
      toastError(
        'Razorpay Key ID is not configured. You can set it in System Settings or use the Direct UPI QR code above.'
      );
      return;
    }

    if (!partyName.trim() || numAmount <= 0) {
      toastError('Please enter party name and amount first.');
      return;
    }

    // Load Razorpay script dynamically if not present
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
        amount: Math.round(numAmount * 100), // in paise
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
      title="UPI Payment Gateway & Settlement"
      subtitle="Accept payments via PhonePe, Google Pay, Paytm, Dynamic UPI QR or Razorpay"
      maxWidth="max-w-2xl"
    >
      {paymentDone ? (
        /* Success Screen */
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Payment Recorded Successfully!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Receipt <strong className="font-mono text-slate-800">#{lastPaymentRef}</strong> has been logged in the verified payments ledger.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-xs space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-800">{partyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-extrabold text-emerald-700">{formatINR(numAmount)}</span>
            </div>
            {utrNumber && (
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">UTR / Ref:</span>
                <span className="font-bold text-slate-800">{utrNumber}</span>
              </div>
            )}
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
          {/* Sub-Tabs: UPI QR vs Razorpay */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'qr'
                  ? 'bg-white text-red-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4 text-red-700" />
              <span>Dynamic UPI QR (Zero Fee)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gateway')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'gateway'
                  ? 'bg-white text-red-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-red-700" />
              <span>Razorpay Gateway</span>
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Associated Mirchi Lot (Optional)
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
              >
                <option value="">Select Chilli Lot...</option>
                {inventoryLots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lot_number} ({l.chilli_variety})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Customer Phone Number
              </label>
              <input
                type="tel"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                placeholder="e.g. +91 98480 12345"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>

          {/* TAB 1: DYNAMIC UPI QR & INTENT */}
          {activeTab === 'qr' && (
            <div className="p-5 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="flex flex-col items-center justify-center">
                {/* Dynamic QR Code */}
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

                {/* Company UPI ID pill with Copy */}
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

              {/* Mobile UPI App Intent Quick Buttons */}
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

              {/* Enter UTR to finalize */}
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

          {/* TAB 2: RAZORPAY GATEWAY CHECKOUT */}
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
                      Add your Razorpay Key ID in <strong>System Settings $\rightarrow$ Payments & UPI Configuration</strong>. You can still collect payments using the zero-fee Dynamic UPI QR code tab above.
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
