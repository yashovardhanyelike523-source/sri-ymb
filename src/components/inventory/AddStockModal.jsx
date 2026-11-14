// ==============================================================================
// SRI YMB TRADING COMPANY — ADD STOCK MODAL
// Includes Unit Standard Calculation (1 Qtl = 100 Kg) & Dynamic Value Preview
// ==============================================================================

import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createInventoryLot } from '../../lib/api';
import { CHILLI_VARIETIES, formatINR } from '../../lib/units';
import { Plus, Calculator, AlertCircle } from 'lucide-react';


export default function AddStockModal({ isOpen, onClose, coldStorages = [], onSuccess }) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    lot_number: '',
    item_name: '',
    chilli_variety: 'Teja',
    cold_storage_id: coldStorages[0]?.id || '',
    supplier_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    original_quantity: '',
    unit: 'quintals',
    purchase_rate: '',
    rate_unit: 'per_quintal',
    bill_reference: '',
    vehicle_number: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper calculations for dynamic preview
  const qty = Number(formData.original_quantity) || 0;
  const rate = Number(formData.purchase_rate) || 0;
  const equivalentKg = formData.unit === 'quintals' ? qty * 100 : qty;
  const equivalentQtl = formData.unit === 'kilograms' ? qty / 100 : qty;

  let totalValue = 0;
  if (formData.unit === 'quintals' && formData.rate_unit === 'per_quintal') {
    totalValue = qty * rate;
  } else if (formData.unit === 'kilograms' && formData.rate_unit === 'per_kg') {
    totalValue = qty * rate;
  } else if (formData.unit === 'quintals' && formData.rate_unit === 'per_kg') {
    totalValue = (qty * 100) * rate;
  } else if (formData.unit === 'kilograms' && formData.rate_unit === 'per_quintal') {
    totalValue = (qty / 100) * rate;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateLotSuggestion = () => {
    const yr = new Date().getFullYear();
    const prefix = formData.chilli_variety.substring(0, 3).toUpperCase();
    const random = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      lot_number: `YMB-${yr}-${prefix}-${random}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.lot_number.trim()) {
      setErrorMsg('Please enter a unique lot number.');
      return;
    }
    if (!formData.item_name.trim()) {
      setErrorMsg('Please enter the item name or description.');
      return;
    }
    if (!formData.cold_storage_id) {
      setErrorMsg('Please select a cold storage facility.');
      return;
    }
    if (!formData.supplier_name.trim()) {
      setErrorMsg('Please provide the supplier or mandi seller name.');
      return;
    }
    if (!qty || qty <= 0) {
      setErrorMsg('Original quantity must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      await createInventoryLot(formData, user?.email);
      success(`Lot "${formData.lot_number}" successfully added to inventory.`);
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setFormData({
        lot_number: '',
        item_name: '',
        chilli_variety: 'Teja',
        cold_storage_id: coldStorages[0]?.id || '',
        supplier_name: '',
        purchase_date: new Date().toISOString().split('T')[0],
        original_quantity: '',
        unit: 'quintals',
        purchase_rate: '',
        rate_unit: 'per_quintal',
        bill_reference: '',
        vehicle_number: '',
        remarks: '',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save inventory record.');
      toastError(err.message, 'Save Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Mirchi Inventory Stock"
      subtitle="Register new red chilli lot and automatically record initial stock movement"
      maxWidth="max-w-2xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lot Number & Variety */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lot Number *
              </label>
              <button
                type="button"
                onClick={generateLotSuggestion}
                className="text-[11px] font-semibold text-red-700 hover:text-red-900 transition"
              >
                Auto Generate
              </button>
            </div>
            <input
              type="text"
              required
              name="lot_number"
              value={formData.lot_number}
              onChange={handleChange}
              placeholder="e.g. YMB-2026-TEJA-01"
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

        {/* Item Name */}
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
            placeholder="e.g. Teja Stemless Grade A Export Quality"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        {/* Cold Storage & Supplier */}
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
              {coldStorages.length === 0 ? (
                <option value="">No cold storage registered yet</option>
              ) : (
                <option value="">Select Cold Storage...</option>
              )}
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name} ({cs.location})
                </option>
              ))}
            </select>
            {coldStorages.length === 0 && (
              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                ⚠️ Register a Cold Storage facility first in the Cold Storage section.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Supplier / Farmer / Mandi *
            </label>
            <input
              type="text"
              required
              name="supplier_name"
              value={formData.supplier_name}
              onChange={handleChange}
              placeholder="e.g. Khammam Farmers Agro Producer"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Quantity & Unit Section */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-red-700" />
              Quantity & Units Specification
            </span>
            <span className="text-[11px] font-semibold text-slate-500 lowercase">
              1 quintal = 100 kg
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Original Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                name="original_quantity"
                value={formData.original_quantity}
                onChange={handleChange}
                placeholder="e.g. 250.00"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Standard Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
              >
                <option value="quintals">Quintals (Qtl - 100 kg each)</option>
                <option value="kilograms">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          {/* Realtime Dual-Unit Conversion Indicator */}
          {qty > 0 && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-center justify-between text-amber-900">
              <span className="font-medium">Total Standardized Weight:</span>
              <span className="font-extrabold text-red-950">
                {equivalentQtl.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Quintals ({equivalentKg.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg)
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Purchase Details */}
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
              placeholder="e.g. 21500"
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

        {/* Calculated Total Valuation Preview */}
        {totalValue > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-950 text-white text-xs border border-red-800">
            <span className="text-amber-300 font-semibold uppercase tracking-wider">
              Estimated Procurement Value:
            </span>
            <span className="font-extrabold text-base text-white">
              {formatINR(totalValue)}
            </span>
          </div>
        )}

        {/* Bill Reference & Vehicle Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Purchase Bill Reference
            </label>
            <input
              type="text"
              name="bill_reference"
              value={formData.bill_reference}
              onChange={handleChange}
              placeholder="e.g. BILL-904 / APMC-4512"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Transport Vehicle Number
            </label>
            <input
              type="text"
              name="vehicle_number"
              value={formData.vehicle_number}
              onChange={handleChange}
              placeholder="e.g. TS 04 UA 8892"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Quality & Inspection Remarks
          </label>
          <textarea
            rows="2"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="e.g. Moisture below 10%, ASTA color 150+, stemless clean pods."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        {/* Buttons */}
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
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recording Lot...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Save Mirchi Lot</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
