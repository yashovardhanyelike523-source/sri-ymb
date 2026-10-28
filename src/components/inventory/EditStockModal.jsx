// ==============================================================================
// SRI YMB TRADING COMPANY — EDIT STOCK MODAL
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateInventoryLot } from '../../lib/api';
import { CHILLI_VARIETIES, formatDualQuantity } from '../../lib/units';
import { AlertCircle, Info } from 'lucide-react';



export default function EditStockModal({ isOpen, onClose, lot, coldStorages = [], onSuccess }) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    lot_number: '',
    item_name: '',
    chilli_variety: 'Teja',
    cold_storage_id: '',
    supplier_name: '',
    purchase_date: '',
    purchase_rate: '',
    rate_unit: 'per_quintal',
    bill_reference: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (lot) {
      setFormData({
        lot_number: lot.lot_number || '',
        item_name: lot.item_name || '',
        chilli_variety: lot.chilli_variety || 'Teja',
        cold_storage_id: lot.cold_storage_id || '',
        supplier_name: lot.supplier_name || '',
        purchase_date: lot.purchase_date || '',
        purchase_rate: lot.purchase_rate || '',
        rate_unit: lot.rate_unit || 'per_quintal',
        bill_reference: lot.bill_reference || '',
        remarks: lot.remarks || '',
      });
    }
  }, [lot]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!lot) return;

    try {
      setSubmitting(true);
      await updateInventoryLot(lot.id, formData, user?.email);
      success(`Lot "${formData.lot_number}" successfully updated.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update inventory record.');
      toastError(err.message, 'Update Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!lot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Lot: ${lot.lot_number}`}
      subtitle="Modify specification, cold storage assignment, supplier or remarks"
      maxWidth="max-w-2xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stock balance notice */}
      <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-start gap-2.5 text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Current Available Stock: </span>
          <span className="font-extrabold text-red-950">
            {formatDualQuantity(lot.current_quantity, lot.unit)}
          </span>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Quantity balances are managed transactionally through the <strong>Stock Movements</strong> tab to ensure full audit compliance.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Lot Number *
            </label>
            <input
              type="text"
              required
              name="lot_number"
              value={formData.lot_number}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Chilli Variety *
            </label>
            <select
              name="chilli_variety"
              value={formData.chilli_variety}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            >
              {CHILLI_VARIETIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Item Description / Commodity Grade *
          </label>
          <input
            type="text"
            required
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Cold Storage Location *
            </label>
            <select
              name="cold_storage_id"
              value={formData.cold_storage_id}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            >
              <option value="">Select Cold Storage...</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name} ({cs.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Supplier Name *
            </label>
            <input
              type="text"
              required
              name="supplier_name"
              value={formData.supplier_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Purchase Rate (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="purchase_rate"
              value={formData.purchase_rate}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Rate Applied
            </label>
            <select
              name="rate_unit"
              value={formData.rate_unit}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            >
              <option value="per_quintal">₹ / Quintal</option>
              <option value="per_kg">₹ / Kilogram</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Purchase Date *
            </label>
            <input
              type="date"
              required
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Purchase Bill Reference
          </label>
          <input
            type="text"
            name="bill_reference"
            value={formData.bill_reference}
            onChange={handleChange}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Quality Remarks
          </label>
          <textarea
            rows="2"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
