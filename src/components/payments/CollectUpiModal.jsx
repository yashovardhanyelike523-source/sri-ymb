// ==============================================================================
// SRI YMB TRADING COMPANY — OFFICIAL UPI SCANNER & PAYMENT MODAL
// Paytm UPI Standee Scanner (yelikeyasho@ptyes) & Dynamic Amount Vector QR
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
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  BadgeCheck,
  Check,
  ArrowRight,
  Flame,
  Printer,
  Sparkles,
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

  const [scannerMode, setScannerMode] = useState('standee'); // 'standee' | 'dynamic'

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
  const [copied, setCopied] = useState(false);

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
    setCopied(false);
  }, [isOpen, initialLot, initialAmount, initialParty]);

  const numAmount = Number(amount) || 0;
  const transactionRef = `YMB-${Date.now().toString().slice(-6)}`;
  const transactionNote = `Sri YMB Chilli ${transactionRef}`;

  // Standard NPCI UPI URI
  const upiUri = buildUpiPaymentUri({
    upiId: settings.upiId || 'yelikeyasho@ptyes',
    payeeName: settings.payeeName || 'Yelike Yasho Vardhan Venkata Soma S',
    amount: numAmount > 0 ? numAmount : undefined,
    transactionNote,
    referenceId: transactionRef,
  });

  // App specific deep-links
  const phonePeUri = upiUri.replace('upi://', 'phonepe://');
  const paytmUri = upiUri.replace('upi://', 'paytmmp://');
  const gpayUri = upiUri;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId || 'yelikeyasho@ptyes');
    setCopied(true);
    success(`UPI ID "${settings.upiId || 'yelikeyasho@ptyes'}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSavePayment = async () => {
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
          payment_method: 'UPI_SCANNER',
          upi_id: settings.upiId || 'yelikeyasho@ptyes',
          utr_number: utrNumber.trim() || null,
          gateway_payment_id: null,
          status: 'COMPLETED',
          lot_id: selectedLotId || null,
          bill_reference: billReference.trim() || null,
          party_name: partyName.trim(),
          party_phone: partyPhone.trim() || null,
          payment_date: new Date().toISOString().split('T')[0],
          remarks: remarks.trim() || `Collected via Paytm UPI Scanner (${settings.upiId})`,
        },
        user?.email
      );

      setLastPaymentRef(res.payment_number);
      setPaymentDone(true);
      success(`Payment receipt #${res.payment_number} recorded successfully!`);
      if (onSuccess) onSuccess();
    } catch (err) {
      toastError(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan to Pay via UPI"
      subtitle="Pay directly using Paytm, PhonePe, Google Pay, or BHIM"
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

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Party / Buyer:</span>
              <span className="font-bold text-slate-900">{partyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-extrabold text-emerald-700">{formatINR(numAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Settled To:</span>
              <span className="font-mono font-bold text-sky-800">{settings.upiId}</span>
            </div>
            {utrNumber && (
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Bank UTR / Ref:</span>
                <span className="font-bold text-slate-800">{utrNumber}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="text-slate-500">Platform Fee:</span>
              <span className="font-bold text-emerald-700">₹0.00 (Zero Fee)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Done & Close
            </button>
          </div>
        </div>
      ) : (
        /* Main Payment UI */
        <div className="space-y-5">
          {/* Payee Identity Banner */}
          <div className="p-3.5 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-100 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-sky-200 border-2 border-white shadow-xs shrink-0">
                <img
                  src="/images/upi-scanner.png"
                  alt="Yasho"
                  className="w-full h-full object-cover object-top scale-175 translate-y-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    {settings.payeeName}
                  </h4>
                  <BadgeCheck className="w-4 h-4 text-sky-600 fill-sky-600 text-white shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-slate-600">
                    UPI ID: <strong className="text-slate-900 font-bold">{settings.upiId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 hover:text-sky-700 text-slate-400 transition"
                    title="Copy UPI ID"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                Paytm UPI
              </span>
            </div>
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:outline-none"
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
                placeholder="e.g. 50000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Customer Phone (Optional)
              </label>
              <input
                type="tel"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                placeholder="e.g. 9848012345"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Associated Mirchi Lot (Optional)
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:outline-none bg-white"
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

          {/* Scanner Mode Switch: Official Standee vs Dynamic Amount QR */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setScannerMode('standee')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                scannerMode === 'standee'
                  ? 'bg-white text-sky-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-sky-600" />
              <span>Official Paytm Scanner Standee</span>
            </button>

            <button
              type="button"
              onClick={() => setScannerMode('dynamic')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                scannerMode === 'dynamic'
                  ? 'bg-white text-sky-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pre-Filled Amount QR ({numAmount > 0 ? formatINR(numAmount) : '₹0'})</span>
            </button>
          </div>

          {/* SCANNER VIEW */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-center space-y-4">
            {scannerMode === 'standee' ? (
              /* Official Uploaded Standee */
              <div className="flex flex-col items-center justify-center">
                <div className="max-w-[280px] w-full rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-4 ring-sky-100 bg-white">
                  <img
                    src="/images/upi-scanner.png"
                    alt="Paytm UPI Scanner"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-2.5">
                  Scan this official QR with Paytm, PhonePe, Google Pay, or BHIM
                </p>
              </div>
            ) : (
              /* Dynamic Amount Vector QR */
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-sky-100 ring-4 ring-sky-50 inline-block">
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
                  <div className="text-base font-black text-slate-900">
                    {numAmount > 0 ? formatINR(numAmount) : 'Enter Amount Above'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Pre-fills exact payment amount when scanned!
                  </div>
                </div>
              </div>
            )}

            {/* Instant App Switcher (Mobile Intent Deep Links) */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Instant Pay on Mobile (Tap to open app)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={paytmUri}
                  className="p-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 font-bold text-xs text-sky-950 flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Paytm</span>
                </a>

                <a
                  href={phonePeUri}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span>PhonePe</span>
                </a>

                <a
                  href={gpayUri}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Google Pay</span>
                </a>

                <a
                  href={upiUri}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Any UPI</span>
                </a>
              </div>
            </div>

            {/* Enter Bank UTR & Record Payment */}
            <div className="pt-3 border-t border-slate-200 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  12-Digit Bank UTR / UPI Reference Number
                </label>
                <span className="text-[10px] text-slate-400">From customer's UPI app</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 428901234567"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-sky-600 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={submitting || numAmount <= 0 || !partyName.trim()}
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-900/20 transition active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  {submitting ? (
                    'Recording...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Record Payment ({numAmount > 0 ? formatINR(numAmount) : '₹0'})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
