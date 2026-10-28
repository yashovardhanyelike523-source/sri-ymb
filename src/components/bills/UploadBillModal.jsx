// ==============================================================================
// SRI YMB TRADING COMPANY — UPLOAD BILL MODAL
// Supports Desktop File Upload, Mobile Camera Capture, Preview & Storage
// ==============================================================================

import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { uploadBillFile, createBillRecord } from '../../lib/api';
import {
  UploadCloud,
  Camera,
  FileText,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';


export default function UploadBillModal({
  isOpen,
  onClose,
  inventoryLots = [],
  coldStorages = [],
  onSuccess,
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    supplier: '',
    lot_number: '',
    cold_storage_id: '',
    remarks: '',
  });

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelected = (file) => {
    setErrorMsg('');
    if (!file) return;

    // Validate format
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload PDF, JPG, JPEG, or PNG.');
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds 15MB limit. Please upload a smaller or compressed document.');
      return;
    }

    setSelectedFile(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If user selects lot, pre-fill supplier & storage if available
    if (name === 'lot_number' && value) {
      const matched = inventoryLots.find((l) => l.lot_number === value);
      if (matched) {
        setFormData((prev) => ({
          ...prev,
          supplier: prev.supplier || matched.supplier_name,
          cold_storage_id: prev.cold_storage_id || matched.cold_storage_id,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFile) {
      setErrorMsg('Please select or capture a bill document.');
      return;
    }
    if (!formData.bill_number.trim()) {
      setErrorMsg('Bill number is required.');
      return;
    }
    if (!formData.supplier.trim()) {
      setErrorMsg('Supplier name is required.');
      return;
    }

    try {
      setUploading(true);

      // 1. Upload to Supabase Storage bucket 'bills'
      const uploadResult = await uploadBillFile(selectedFile);

      // 2. Insert metadata record in PostgreSQL 'bills' table
      await createBillRecord(
        {
          ...formData,
          storage_path: uploadResult.storagePath,
          file_name: uploadResult.fileName,
          file_size: uploadResult.fileSize,
          file_type: uploadResult.fileType,
        },
        user?.email
      );

      success(`Bill "${formData.bill_number}" uploaded and archived successfully.`);
      if (onSuccess) onSuccess();
      handleRemoveFile();
      onClose();
      // Reset form
      setFormData({
        bill_number: '',
        bill_date: new Date().toISOString().split('T')[0],
        supplier: '',
        lot_number: '',
        cold_storage_id: '',
        remarks: '',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload bill.');
      toastError(err.message, 'Bill Upload Error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Purchase Bill & Invoice"
      subtitle="Store original bills securely in private Supabase Storage linked to lots"
      maxWidth="max-w-2xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Selection Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Bill Document / Invoice Copy *
          </label>

          {!selectedFile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Computer Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-300 rounded-xl hover:border-red-600 hover:bg-white text-center cursor-pointer transition"
              >
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-800">
                  Select from Computer
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  PDF, JPG, PNG (Max 15MB)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
              </div>

              {/* Mobile Camera Option */}
              <div
                onClick={() => cameraInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-300 rounded-xl hover:border-red-600 hover:bg-white text-center cursor-pointer transition"
              >
                <Camera className="w-8 h-8 text-red-700 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-800">
                  Camera Photo Capture
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Snap physical mandi bill
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
              </div>
            </div>
          ) : (
            /* Selected File Preview Box */
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Bill Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                    <FileText className="w-7 h-7" />
                  </div>
                )}
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <FileCheck className="w-3 h-3" /> Ready for upload
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                title="Remove and choose different file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Bill Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Bill / Invoice Number *
            </label>
            <input
              type="text"
              required
              name="bill_number"
              value={formData.bill_number}
              onChange={handleChange}
              placeholder="e.g. KFAP-2026-904"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Bill Date *
            </label>
            <input
              type="date"
              required
              name="bill_date"
              value={formData.bill_date}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Supplier / Agency Name *
            </label>
            <input
              type="text"
              required
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="e.g. Khammam Farmers Agro Producer"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Link with Inventory Lot
            </label>
            <select
              name="lot_number"
              value={formData.lot_number}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            >
              <option value="">Select Lot (Optional)...</option>
              {inventoryLots.map((l) => (
                <option key={l.id} value={l.lot_number}>
                  {l.lot_number} ({l.chilli_variety})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Cold Storage Facility
          </label>
          <select
            name="cold_storage_id"
            value={formData.cold_storage_id}
            onChange={handleChange}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
          >
            <option value="">Select Cold Storage (Optional)...</option>
            {coldStorages.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.name} ({cs.location})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Bill Remarks / Mandi Notes
          </label>
          <textarea
            rows="2"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="e.g. Includes e-way bill & weighbridge slip. Tax paid."
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
            disabled={uploading || !selectedFile}
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading to Supabase...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Save Bill</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
