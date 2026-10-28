// ==============================================================================
// SRI YMB TRADING COMPANY — BILL VIEWER & DOWNLOAD MODAL
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { getBillUrl } from '../../lib/api';
import { Download, ExternalLink, FileText } from 'lucide-react';


export default function BillViewerModal({ isOpen, onClose, bill }) {
  const [fileUrl, setFileUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  useEffect(() => {
    if (isOpen && bill?.storage_path) {
      setLoadingUrl(true);
      getBillUrl(bill.storage_path)
        .then((url) => setFileUrl(url))
        .catch((e) => console.error(e))
        .finally(() => setLoadingUrl(false));
    }
  }, [isOpen, bill]);

  if (!bill) return null;

  const isImage = bill.file_type?.startsWith('image/') || bill.file_name?.match(/\.(jpg|jpeg|png)$/i);
  const isPdf = bill.file_type?.includes('pdf') || bill.file_name?.endsWith('.pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bill Document: ${bill.bill_number}`}
      subtitle={`Supplier: ${bill.supplier} • Date: ${bill.bill_date}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Metadata summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Bill Number:</span>
            <div className="font-bold text-slate-800">{bill.bill_number}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Supplier:</span>
            <div className="font-bold text-slate-800">{bill.supplier}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Linked Lot:</span>
            <div className="font-bold text-red-700">{bill.lot_number || 'None'}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">File Size:</span>
            <div className="font-bold text-slate-800">
              {(bill.file_size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>

        {bill.remarks && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <span className="font-bold">Remarks: </span>
            {bill.remarks}
          </div>
        )}

        {/* Document Display Area */}
        <div className="min-h-[350px] max-h-[550px] overflow-auto rounded-xl border border-slate-200 bg-slate-900/5 flex items-center justify-center p-2">
          {loadingUrl ? (
            <div className="text-center p-8 text-xs text-slate-500">
              <span className="inline-block w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-2" />
              Generating secure signed URL...
            </div>
          ) : !fileUrl ? (
            <div className="text-center p-8 text-xs text-slate-500">
              Document file unavailable or Supabase storage credentials pending.
            </div>
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={bill.file_name}
              className="max-h-[500px] w-auto mx-auto rounded-lg shadow-sm object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={bill.file_name}
              className="w-full h-[500px] rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="text-center p-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600">File format: {bill.file_type}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-400">
            Uploaded by {bill.uploaded_by} on {new Date(bill.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            {fileUrl && (
              <>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </a>
                <a
                  href={fileUrl}
                  download={bill.file_name}
                  className="px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
