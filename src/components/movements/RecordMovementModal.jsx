// ==============================================================================
// SRI YMB TRADING COMPANY — RECORD STOCK MOVEMENT MODAL
// Guarantees No Negative Inventory, Atomic Transaction, and Unit Consistency
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { recordStockMovement } from '../../lib/api';
import { convertUnit } from '../../lib/units';
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';


export default function RecordMovementModal({
  isOpen,
  onClose,
  inventoryLots = [],
  initialLot = null,
  coldStorages = [],
  onSuccess,
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [selectedLotId, setSelectedLotId] = useState('');
  const [movementType, setMovementType] = useState('OUT'); // Default OUT for dispatch
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('quintals');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [destinationOrSource, setDestinationOrSource] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [billReference, setBillReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find active lot object
  const activeLot = inventoryLots.find((l) => l.id === (selectedLotId || initialLot?.id)) || initialLot;

  useEffect(() => {
    if (initialLot) {
      setSelectedLotId(initialLot.id);
      setUnit(initialLot.unit || 'quintals');
    } else if (inventoryLots.length > 0 && !selectedLotId) {
      setSelectedLotId(inventoryLots[0].id);
      setUnit(inventoryLots[0].unit || 'quintals');
    }
  }, [initialLot, inventoryLots, selectedLotId]);

  // When lot selection changes, match unit
  const handleLotChange = (e) => {
    const lotId = e.target.value;
    setSelectedLotId(lotId);
    const found = inventoryLots.find((l) => l.id === lotId);
    if (found) {
      setUnit(found.unit || 'quintals');
    }
  };

  // Calculations & Validation
  const moveQty = Number(quantity) || 0;
  let movementInLotUnit = 0;
  let resultingStock = 0;
  let isInsufficient = false;

  if (activeLot) {
    movementInLotUnit = convertUnit(moveQty, unit, activeLot.unit);
    if (movementType === 'OUT') {
      resultingStock = Number((activeLot.current_quantity - movementInLotUnit).toFixed(2));
      if (movementInLotUnit > activeLot.current_quantity) {
        isInsufficient = true;
      }
    } else {
      resultingStock = Number((activeLot.current_quantity + movementInLotUnit).toFixed(2));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!activeLot) {
      setErrorMsg('Please select a valid inventory lot.');
      return;
    }
    if (!moveQty || moveQty <= 0) {
      setErrorMsg('Movement quantity must be greater than zero.');
      return;
    }
    if (isInsufficient) {
      setErrorMsg(
        `Insufficient stock! Lot ${activeLot.lot_number} only has ${activeLot.current_quantity} ${activeLot.unit}. Cannot remove ${movementInLotUnit} ${activeLot.unit}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await recordStockMovement(
        {
          lot_id: activeLot.id,
          movement_type: movementType,
          quantity: moveQty,
          unit,
          date,
          cold_storage_id: activeLot.cold_storage_id,
          destination_or_source: destinationOrSource,
          vehicle_number: vehicleNumber,
          bill_reference: billReference,
          remarks,
        },
        user?.email
      );

      success(
        `Recorded ${movementType === 'OUT' ? 'dispatch of' : 'receipt of'} ${moveQty} ${unit} for lot ${activeLot.lot_number}. New balance: ${resultingStock} ${activeLot.unit}.`
      );

      if (onSuccess) onSuccess();
      onClose();

      // Reset
      setQuantity('');
      setDestinationOrSource('');
      setVehicleNumber('');
      setBillReference('');
      setRemarks('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record stock movement.');
      toastError(err.message, 'Movement Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Stock Movement"
      subtitle="Register stock dispatch/sale or additional intake with strict balance verification"
      maxWidth="max-w-2xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lot Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Select Red Chilli Lot *
          </label>
          <select
            value={selectedLotId}
            onChange={handleLotChange}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
          >
            {inventoryLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.lot_number} — {lot.item_name} ({lot.chilli_variety}) | Avail: {lot.current_quantity} {lot.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type Toggle */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Movement Direction *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMovementType('OUT')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                movementType === 'OUT'
                  ? 'bg-red-700 text-white border-red-700 shadow-md shadow-red-900/30 ring-2 ring-red-400'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>STOCK REMOVED (Dispatch / Sale)</span>
            </button>

            <button
              type="button"
              onClick={() => setMovementType('IN')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                movementType === 'IN'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-900/30 ring-2 ring-emerald-400'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>STOCK RECEIVED (Procurement / Return)</span>
            </button>
          </div>
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Movement Quantity *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50.00"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Unit *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            >
              <option value="quintals">Quintals (100 kg)</option>
              <option value="kilograms">Kilograms (kg)</option>
            </select>
          </div>
        </div>

        {/* Live Balance Impact Preview Box */}
        {activeLot && (
          <div
            className={`p-4 rounded-2xl border transition ${
              isInsufficient
                ? 'bg-red-50 border-red-300 text-red-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Transaction Impact Breakdown</span>
              {isInsufficient && (
                <span className="text-xs text-red-600 font-extrabold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  INSUFFICIENT STOCK
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Opening Stock</div>
                <div className="font-extrabold text-slate-900 mt-1">
                  {activeLot.current_quantity} {activeLot.unit}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  movementType === 'OUT'
                    ? 'bg-red-100/50 border-red-200 text-red-800'
                    : 'bg-emerald-100/50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="font-medium">
                  {movementType === 'OUT' ? 'Deduction (-)' : 'Addition (+)'}
                </div>
                <div className="font-extrabold mt-1">
                  {moveQty ? `${movementInLotUnit} ${activeLot.unit}` : '0.00'}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isInsufficient
                    ? 'bg-red-200 border-red-400 text-red-950'
                    : 'bg-slate-900 text-white border-slate-800'
                }`}
              >
                <div className={isInsufficient ? 'font-bold' : 'text-slate-400'}>
                  New Balance
                </div>
                <div className="font-black mt-1">
                  {resultingStock} {activeLot.unit}
                </div>
              </div>
            </div>

            {isInsufficient && (
              <p className="mt-3 text-xs text-red-700 font-semibold leading-relaxed">
                Cannot complete operation: requested dispatch ({movementInLotUnit} {activeLot.unit}) exceeds available inventory balance ({activeLot.current_quantity} {activeLot.unit}). Negative inventory is disallowed.
              </p>
            )}
          </div>
        )}

        {/* Date & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Movement Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {movementType === 'OUT' ? 'Buyer / Destination Mandi *' : 'Procured From / Source *'}
            </label>
            <input
              type="text"
              required
              value={destinationOrSource}
              onChange={(e) => setDestinationOrSource(e.target.value)}
              placeholder={movementType === 'OUT' ? 'e.g. Everest Spice Mills, Mumbai' : 'e.g. Mandi Auction Intake'}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Transport & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Lorry / Vehicle Number
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. TS 04 UA 8892"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dispatch Slip / Bill Ref
            </label>
            <input
              type="text"
              value={billReference}
              onChange={(e) => setBillReference(e.target.value)}
              placeholder="e.g. DISP-YMB-104"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Movement Remarks
          </label>
          <textarea
            rows="2"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Stamped e-way bill checked, moisture sample verified before dispatch."
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
            disabled={submitting || isInsufficient || moveQty <= 0}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 transition active:scale-95 disabled:opacity-50 ${
              movementType === 'OUT' ? 'bg-red-700 hover:bg-red-800 shadow-red-900/30' : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-900/30'
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Transaction...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm {movementType === 'OUT' ? 'Dispatch' : 'Receipt'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
