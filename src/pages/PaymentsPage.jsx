// ==============================================================================
// SRI YMB TRADING COMPANY — PAYMENTS & UPI COLLECTIONS PAGE
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { fetchPayments, getCompanyPaymentSettings } from '../lib/api';
import { formatINR } from '../lib/units';
import EmptyState from '../components/common/EmptyState';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Plus,
  Search,
  Download,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  User,
  ExternalLink,
  Layers,
  Flame,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';

export default function PaymentsPage({ onOpenCollectUpi }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await fetchPayments({
        method: methodFilter,
        status: statusFilter,
        startDate,
        endDate,
      });
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [methodFilter, statusFilter, startDate, endDate]);

  const filteredPayments = useMemo(() => {
    let result = [...payments];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.payment_number?.toLowerCase().includes(q) ||
          p.party_name?.toLowerCase().includes(q) ||
          p.utr_number?.toLowerCase().includes(q) ||
          p.bill_reference?.toLowerCase().includes(q) ||
          p.lot?.lot_number?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [payments, search]);

  // Aggregate Metrics
  const summary = useMemo(() => {
    let totalCollected = 0;
    let upiCollected = 0;
    let bankCashCollected = 0;

    payments.forEach((p) => {
      if (p.status === 'COMPLETED') {
        const amt = Number(p.amount) || 0;
        totalCollected += amt;
        if (
          p.payment_method === 'UPI_SCANNER' ||
          p.payment_method === 'UPI_QR' ||
          p.payment_method === 'UPI_APP' ||
          p.payment_method === 'YOUPI_PG'
        ) {
          upiCollected += amt;
        } else {
          bankCashCollected += amt;
        }
      }
    });

    return {
      totalCollected: Number(totalCollected.toFixed(2)),
      upiCollected: Number(upiCollected.toFixed(2)),
      bankCashCollected: Number(bankCashCollected.toFixed(2)),
      totalCount: payments.length,
    };
  }, [payments]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      'Payment Number',
      'Date',
      'Customer / Party',
      'Phone',
      'Amount (INR)',
      'Method',
      'Status',
      'UTR / Transaction Ref',
      'Gateway Payment ID',
      'Linked Lot',
      'Bill Reference',
      'Remarks',
      'Created By',
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.payment_number}"`,
      `"${p.payment_date}"`,
      `"${(p.party_name || '').replace(/"/g, '""')}"`,
      `"${p.party_phone || ''}"`,
      p.amount,
      `"${p.payment_method}"`,
      `"${p.status}"`,
      `"${p.utr_number || ''}"`,
      `"${p.gateway_payment_id || ''}"`,
      `"${p.lot?.lot_number || ''}"`,
      `"${p.bill_reference || ''}"`,
      `"${(p.remarks || '').replace(/"/g, '""')}"`,
      `"${p.created_by || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Sri_YMB_Payments_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Payments & UPI Settlement
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              {filteredPayments.length} Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect wholesale payments via PhonePe, Google Pay, Paytm, Dynamic UPI QR or Gateway
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCollectUpi}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>Collect Payment via UPI</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Total Collected</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Settled
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatINR(summary.totalCollected)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Across {summary.totalCount} completed receipts
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Paytm UPI Collections</span>
            <QrCode className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatINR(summary.upiCollected)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Scan & Pay via yelikeyasho@ptyes
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Bank & Cash Collections</span>
            <CreditCard className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatINR(summary.bankCashCollected)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Direct NEFT/RTGS & Cash at Mandi
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, buyer, UTR #..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-600 bg-slate-50/50 hover:bg-white"
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-600 bg-white"
            >
              <option value="all">All Payment Methods</option>
              <option value="UPI_SCANNER">Paytm UPI Scanner</option>
              <option value="UPI_QR">Dynamic UPI QR</option>
              <option value="UPI_APP">UPI Apps (GPay/PhonePe)</option>
              <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <span className="inline-block w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading payments ledger...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No payment receipts recorded"
          description="Collect payment using dynamic UPI QR codes, PhonePe/GPay intent, or online gateway."
          icon={CreditCard}
          actionText="Collect First Payment"
          onAction={onOpenCollectUpi}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer / Buyer</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Bank UTR / Ref</th>
                  <th className="py-3 px-4">Linked Lot</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.payment_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.payment_date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{p.party_name}</div>
                      {p.party_phone && (
                        <div className="text-[10px] text-slate-400">{p.party_phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-sm text-emerald-700">
                        {formatINR(p.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.payment_method === 'UPI_SCANNER' || p.payment_method === 'YOUPI_PG' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-900 border border-sky-200">
                          <QrCode className="w-3 h-3 text-sky-600" />
                          <span>Paytm UPI</span>
                        </span>
                      ) : p.payment_method === 'UPI_QR' || p.payment_method === 'UPI_APP' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-900 border border-indigo-200">
                          <Smartphone className="w-3 h-3 text-indigo-600" />
                          <span>UPI App</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {p.payment_method.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {p.utr_number || p.gateway_payment_id || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-red-700">
                      {p.lot?.lot_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold inline-flex items-center gap-1 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 relative">
            {/* Printable Header */}
            <div className="text-center pb-4 border-b-2 border-red-950 mb-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Flame className="w-6 h-6 text-red-700 fill-amber-400" />
                <h3 className="font-black text-lg text-red-950 uppercase">
                  Sri YMB Trading Company
                </h3>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Official Payment Receipt & Settlement Slip
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Receipt Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedReceipt.payment_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Date:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.payment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Paid By:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.party_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Channel:</span>
                <span className="font-bold text-slate-800">
                  {selectedReceipt.payment_method.replace('_', ' ')}
                </span>
              </div>
              {selectedReceipt.utr_number && (
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-medium">Bank UTR Number:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.utr_number}</span>
                </div>
              )}
              {selectedReceipt.gateway_payment_id && (
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-medium">Gateway Payment ID:</span>
                  <span className="font-bold text-slate-800">
                    {selectedReceipt.gateway_payment_id}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-sm uppercase text-slate-800">
                  Total Amount Received:
                </span>
                <span className="font-black text-lg text-emerald-700">
                  {formatINR(selectedReceipt.amount)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
              Verified electronically by Sri YMB Trading Company internal administration.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5 no-print">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
