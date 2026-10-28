// ==============================================================================
// SRI YMB TRADING COMPANY — STOCK DETAILS MODAL
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { fetchStockMovements } from '../../lib/api';
import { formatDualQuantity, formatINR, calculateStockValue } from '../../lib/units';
import { VarietyBadge, MovementBadge } from '../common/Badge';
import {
  Layers,
  Warehouse,
  User,
  Calendar,
  Receipt,
  ArrowLeftRight,
  Clock,
  QrCode,
} from 'lucide-react';

export default function StockDetailsModal({
  isOpen,
  onClose,
  lot,
  onOpenRecordMovement,
  onOpenCollectUpi,
}) {
  const [movements, setMovements] = useState([]);

  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (isOpen && lot?.id) {
      setLoadingMovements(true);
      fetchStockMovements({ lotId: lot.id })
        .then((data) => setMovements(data))
        .catch((err) => console.error('Failed to load lot movements:', err))
        .finally(() => setLoadingMovements(false));
    }
  }, [isOpen, lot]);

  if (!lot) return null;

  const totalValue = calculateStockValue(
    lot.current_quantity,
    lot.unit,
    lot.purchase_rate,
    lot.rate_unit
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lot Specifications: ${lot.lot_number}`}
      subtitle={lot.item_name}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-amber-950 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">
              Available Quantity Balance
            </div>
            <div className="text-2xl font-black tracking-tight text-white mt-0.5">
              {formatDualQuantity(lot.current_quantity, lot.unit)}
            </div>
            <div className="text-xs text-red-200 mt-0.5">
              Original Intake: {formatDualQuantity(lot.original_quantity, lot.unit)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">
              Total Lot Valuation
            </div>
            <div className="text-xl font-bold text-amber-200 mt-0.5">
              {formatINR(totalValue)}
            </div>
            <div className="text-xs text-red-200">
              Rate: ₹{lot.purchase_rate} {lot.rate_unit === 'per_quintal' ? '/ Qtl' : '/ kg'}
            </div>
            {onOpenCollectUpi && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCollectUpi(lot, totalValue, lot.supplier_name);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Collect UPI</span>
              </button>
            )}
          </div>
        </div>


        {/* Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-red-700" />
              Chilli Variety
            </div>
            <VarietyBadge variety={lot.chilli_variety} />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
              <Warehouse className="w-3.5 h-3.5 text-red-700" />
              Cold Storage
            </div>
            <div className="font-bold text-slate-800">
              {lot.cold_storage?.name || 'Cold Storage'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {lot.cold_storage?.location}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-red-700" />
              Supplier / Source
            </div>
            <div className="font-bold text-slate-800">{lot.supplier_name}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-red-700" />
              Procurement Date
            </div>
            <div className="font-bold text-slate-800">{lot.purchase_date}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
              <Receipt className="w-3.5 h-3.5 text-red-700" />
              Bill Reference
            </div>
            <div className="font-bold text-slate-800">
              {lot.bill_reference || 'N/A'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-red-700" />
              Created Timestamp
            </div>
            <div className="font-bold text-slate-800">
              {new Date(lot.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Remarks */}
        {lot.remarks && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950">
            <span className="font-bold">Inspection & Quality Notes: </span>
            <span>{lot.remarks}</span>
          </div>
        )}

        {/* Movements History Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-red-700" />
              Lot Stock Movements Ledger ({movements.length})
            </h4>
            {onOpenRecordMovement && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecordMovement(lot);
                }}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                + Record Movement
              </button>
            )}
          </div>

          {loadingMovements ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <span className="inline-block w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-2" />
              Loading movement history...
            </div>
          ) : movements.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No movement logs recorded yet for this lot.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Destination / Source</th>
                    <th className="py-2 px-3">Vehicle</th>
                    <th className="py-2 px-3">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-700">
                        {m.date}
                      </td>
                      <td className="py-2 px-3">
                        <MovementBadge type={m.movement_type} />
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {formatDualQuantity(m.quantity, m.unit)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {m.destination_or_source || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 uppercase">
                        {m.vehicle_number || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {m.created_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
