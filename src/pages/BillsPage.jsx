// ==============================================================================
// SRI YMB TRADING COMPANY — BILL MANAGEMENT & ARCHIVE PAGE
// Searchable Bill Archive, Supabase Storage Integration, View/Download & Safe Delete
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { fetchBills, deleteBill, getBillUrl } from '../lib/api';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Search,
  FileText,
  Image,
  Eye,
  Download,
  Trash2,
  Calendar,
} from 'lucide-react';


export default function BillsPage({ onOpenUploadBill, onViewBill }) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Confirm delete
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    bill: null,
    loading: false,
  });

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await fetchBills({ search });
      setBills(data);
    } catch (err) {
      toastError(err.message || 'Failed to load purchase bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const filteredBills = useMemo(() => {
    if (!search.trim()) return bills;
    const q = search.toLowerCase().trim();
    return bills.filter(
      (b) =>
        b.bill_number?.toLowerCase().includes(q) ||
        b.supplier?.toLowerCase().includes(q) ||
        b.lot_number?.toLowerCase().includes(q) ||
        b.file_name?.toLowerCase().includes(q) ||
        b.remarks?.toLowerCase().includes(q)
    );
  }, [bills, search]);

  const handleDeleteBill = async () => {
    if (!confirmDialog.bill) return;
    const b = confirmDialog.bill;

    try {
      setConfirmDialog((prev) => ({ ...prev, loading: true }));
      await deleteBill(b.id, b.storage_path, user?.email);
      success(`Bill "${b.bill_number}" permanently deleted.`);
      setConfirmDialog({ isOpen: false, bill: null, loading: false });
      loadBills();
    } catch (err) {
      toastError(err.message || 'Failed to delete bill.');
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleQuickDownload = async (b) => {
    try {
      const url = await getBillUrl(b.storage_path);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = b.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toastError('Unable to generate download link for this bill.');
      }
    } catch (e) {
      toastError(e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Purchase Bills & Invoices Archive
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              {filteredBills.length} Bills
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Original APMC mandi tax invoices, weight slips and e-way bills stored in private Supabase Storage
          </p>
        </div>

        <button
          onClick={onOpenUploadBill}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Purchase Bill</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bill #, supplier, lot number, filename..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50/50 hover:bg-white"
          />
        </div>
      </div>

      {/* Bills Grid / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <span className="inline-block w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading purchase bills archive from Supabase Storage...</p>
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          title="No purchase bills archived"
          description="Upload paper invoices, mandi slips, or snap bills using your phone camera."
          actionText="Upload First Bill"
          onAction={onOpenUploadBill}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map((b) => {
            const isPdf = b.file_type?.includes('pdf') || b.file_name?.endsWith('.pdf');
            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-red-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-red-50 text-red-700 shrink-0">
                        {isPdf ? (
                          <FileText className="w-5 h-5 text-red-700" />
                        ) : (
                          <Image className="w-5 h-5 text-amber-700" />
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 font-mono">
                          {b.bill_number}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{b.bill_date}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {isPdf ? 'PDF' : 'IMAGE'}
                    </span>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Supplier:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[170px]">
                        {b.supplier}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Linked Lot:</span>
                      <span className="font-mono font-bold text-red-700">
                        {b.lot_number || 'None'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">File Size:</span>
                      <span className="text-slate-600 font-medium">
                        {(b.file_size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  {b.remarks && (
                    <p className="text-[11px] text-slate-500 italic mb-3 line-clamp-2">
                      "{b.remarks}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    By {b.uploaded_by?.split('@')[0]}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewBill(b)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 transition"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => handleQuickDownload(b)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition"
                      title="Download Bill File"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          bill: b,
                          loading: false,
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
                      title="Delete Bill Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={handleDeleteBill}
        loading={confirmDialog.loading}
        title="Delete Bill Document"
        message={`Are you sure you want to delete bill "${confirmDialog.bill?.bill_number}"? The document will be permanently purged from Supabase Storage.`}
        confirmText="Delete Bill"
        type="danger"
      />
    </div>
  );
}
