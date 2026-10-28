// ==============================================================================
// SRI YMB TRADING COMPANY — ADD / EDIT COLD STORAGE MODAL
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createColdStorage, updateColdStorage } from '../../lib/api';
import { AlertCircle } from 'lucide-react';


export default function AddEditStorageModal({
  isOpen,
  onClose,
  storage = null,
  onSuccess,
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_person: '',
    phone: '',
    capacity_quintals: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (storage) {
      setFormData({
        name: storage.name || '',
        location: storage.location || '',
        contact_person: storage.contact_person || '',
        phone: storage.phone || '',
        capacity_quintals: storage.capacity_quintals || '',
        remarks: storage.remarks || '',
      });
    } else {
      setFormData({
        name: '',
        location: '',
        contact_person: '',
        phone: '',
        capacity_quintals: '',
        remarks: '',
      });
    }
    setErrorMsg('');
  }, [storage, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Facility name is required.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMsg('Address / location is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (storage) {
        await updateColdStorage(storage.id, formData, user?.email);
        success(`Cold storage "${formData.name}" updated successfully.`);
      } else {
        await createColdStorage(formData, user?.email);
        success(`Cold storage "${formData.name}" added successfully.`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed.');
      toastError(err.message, 'Cold Storage Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={storage ? `Edit Cold Storage: ${storage.name}` : 'Register New Cold Storage Facility'}
      subtitle="Track warehouse location, storage capacity in quintals, and warehouse manager contact"
      maxWidth="max-w-xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Facility Name *
          </label>
          <input
            type="text"
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Guntur Mega Cold Storage Ltd."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Full Address / City / State *
          </label>
          <textarea
            rows="2"
            required
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. NH-16, Kakani Road, Guntur, Andhra Pradesh - 522005"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Contact Person / Warehouse Incharge
            </label>
            <input
              type="text"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="e.g. M. Venkateswarlu"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Contact Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 98480 12345"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Storage Capacity (Quintals)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="capacity_quintals"
            value={formData.capacity_quintals}
            onChange={handleChange}
            placeholder="e.g. 25000"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Total capacity used for utilization rate calculations.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Facility Notes & Chamber Info
          </label>
          <textarea
            rows="2"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="e.g. Chamber 2 & 4 reserved, temperature kept at 4°C for Teja lots."
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
            {submitting ? 'Saving...' : storage ? 'Update Storage' : 'Create Cold Storage'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
