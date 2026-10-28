// ==============================================================================
// SRI YMB TRADING COMPANY — COLD STORAGE MANAGEMENT PAGE
// Calculates Total Stock per Storage, Capacity Utilization, Lots Held & Safety Rules
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchColdStorages,
  fetchInventoryLots,
  archiveColdStorage,
  deleteColdStorage,
} from '../lib/api';
import { toQuintals } from '../lib/units';
import { VarietyBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Warehouse,
  Plus,
  Phone,
  MapPin,
  User,
  Edit,
  Archive,
  Trash2,
} from 'lucide-react';


export default function ColdStoragePage({
  onOpenAddStorage,
  onOpenEditStorage,
  onOpenStockDetails,
  onOpenAddStock,
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [storages, setStorages] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    storage: null,
    action: 'archive', // 'archive' | 'delete'
    loading: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [storageData, lotsData] = await Promise.all([
        fetchColdStorages(includeArchived),
        fetchInventoryLots({ includeArchived: false }),
      ]);
      setStorages(storageData);
      setLots(lotsData);
    } catch (err) {
      toastError(err.message || 'Failed to load cold storage data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [includeArchived]);

  // Aggregate metrics per storage
  const storageWithStats = useMemo(() => {
    return storages.map((storage) => {
      // Find active lots belonging to this storage
      const storageLots = lots.filter((l) => l.cold_storage_id === storage.id);

      let totalStockQtl = 0;
      storageLots.forEach((l) => {
        totalStockQtl += toQuintals(l.current_quantity, l.unit);
      });

      totalStockQtl = Number(totalStockQtl.toFixed(2));
      const capacity = Number(storage.capacity_quintals) || 0;
      const utilizationPercent =
        capacity > 0 ? Math.min(100, Number(((totalStockQtl / capacity) * 100).toFixed(1))) : 0;

      return {
        ...storage,
        lots: storageLots,
        totalStockQtl,
        totalStockKg: Number((totalStockQtl * 100).toFixed(2)),
        utilizationPercent,
      };
    });
  }, [storages, lots]);

  // Overall totals
  const overallCapacity = storages.reduce((acc, s) => acc + (Number(s.capacity_quintals) || 0), 0);
  const overallStoredStock = storageWithStats.reduce((acc, s) => acc + s.totalStockQtl, 0);

  const handleConfirmAction = async () => {
    if (!confirmDialog.storage) return;
    const s = confirmDialog.storage;

    try {
      setConfirmDialog((prev) => ({ ...prev, loading: true }));
      if (confirmDialog.action === 'archive') {
        const nextState = !s.is_archived;
        await archiveColdStorage(s.id, nextState, user?.email);
        success(`Facility "${s.name}" ${nextState ? 'archived' : 'restored'}.`);
      } else if (confirmDialog.action === 'delete') {
        await deleteColdStorage(s.id, user?.email);
        success(`Facility "${s.name}" deleted.`);
      }
      setConfirmDialog({ isOpen: false, storage: null, action: 'archive', loading: false });
      loadData();
    } catch (err) {
      toastError(err.message || 'Action failed.');
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Cold Storage Facilities
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              {storages.length} Warehouses
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Preservation chambers, capacity utilization, warehouse incharge contacts & held mirchi lots
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 mr-2 select-none">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded text-red-700 focus:ring-red-600"
            />
            <span>Include Archived</span>
          </label>

          <button
            onClick={onOpenAddStorage}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cold Storage</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Aggregate Capacity
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overallCapacity.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-semibold text-slate-500">Qtl</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Across {storages.length} preservation facilities
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Current Stored Stock
          </div>
          <div className="text-2xl font-black text-red-700 mt-1">
            {overallStoredStock.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-semibold text-red-700">Qtl</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            ≈ {(overallStoredStock * 100).toLocaleString('en-IN')} kg
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Average Utilization
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overallCapacity > 0
              ? `${((overallStoredStock / overallCapacity) * 100).toFixed(1)}%`
              : '0%'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Chamber space utilization
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <span className="inline-block w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading cold storage locations...</p>
        </div>
      ) : storageWithStats.length === 0 ? (
        <EmptyState
          title="No cold storage locations"
          description="Register your first warehouse or preservation facility to begin tracking lot placement."
          actionText="Add Cold Storage"
          onAction={onOpenAddStorage}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {storageWithStats.map((storage) => {
            const hasStock = storage.totalStockQtl > 0;
            return (
              <div
                key={storage.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between transition ${
                  storage.is_archived
                    ? 'border-slate-200 bg-slate-50/70 opacity-75'
                    : 'border-slate-200/90 hover:border-red-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-red-50 text-red-700 rounded-2xl ring-4 ring-red-50/50 shrink-0">
                        <Warehouse className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">
                            {storage.name}
                          </h3>
                          {storage.is_archived && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{storage.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditStorage(storage)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                        title="Edit Storage Facility"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            storage,
                            action: 'archive',
                            loading: false,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                        title={storage.is_archived ? 'Restore Facility' : 'Archive Facility'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            storage,
                            action: 'delete',
                            loading: false,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
                        title="Delete Permanently (Forbidden if stock exists)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {(storage.contact_person || storage.phone) && (
                    <div className="flex flex-wrap items-center gap-4 py-2 px-3 bg-slate-50 rounded-xl text-xs text-slate-600 mb-4 border border-slate-100">
                      {storage.contact_person && (
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-red-700" />
                          <span>Incharge: {storage.contact_person}</span>
                        </div>
                      )}
                      {storage.phone && (
                        <a
                          href={`tel:${storage.phone}`}
                          className="flex items-center gap-1.5 font-bold text-red-700 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{storage.phone}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Capacity & Current Stock Meter */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div>
                        <span className="text-slate-500 font-medium">Stored Stock: </span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {storage.totalStockQtl.toLocaleString('en-IN')} Qtl
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          ({storage.totalStockKg.toLocaleString('en-IN')} kg)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 font-medium">Capacity: </span>
                        <span className="font-bold text-slate-800">
                          {Number(storage.capacity_quintals).toLocaleString('en-IN')} Qtl
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          storage.utilizationPercent > 90
                            ? 'bg-red-600'
                            : storage.utilizationPercent > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, storage.utilizationPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                      <span>Utilization: {storage.utilizationPercent}%</span>
                      <span>{storage.lots.length} active lots placed</span>
                    </div>
                  </div>

                  {/* Lots currently inside storage */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Chamber Lots List ({storage.lots.length})</span>
                    </div>

                    {storage.lots.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        No lots currently deposited in this facility.
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {storage.lots.map((lot) => (
                          <div
                            key={lot.id}
                            onClick={() => onOpenStockDetails(lot)}
                            className="p-2.5 rounded-xl border border-slate-200/80 hover:border-red-300 hover:bg-red-50/30 transition flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-slate-900 text-xs">
                                {lot.lot_number}
                              </span>
                              <VarietyBadge variety={lot.chilli_variety} />
                            </div>
                            <div className="text-right">
                              <div className="font-extrabold text-slate-900 text-xs">
                                {lot.current_quantity} {lot.unit}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {lot.supplier_name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer notes */}
                {storage.remarks && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Notes: </span>
                    {storage.remarks}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={handleConfirmAction}
        loading={confirmDialog.loading}
        title={
          confirmDialog.action === 'archive'
            ? confirmDialog.storage?.is_archived
              ? 'Restore Cold Storage'
              : 'Archive Cold Storage'
            : 'Delete Cold Storage'
        }
        message={
          confirmDialog.action === 'archive'
            ? confirmDialog.storage?.is_archived
              ? `Unarchive cold storage "${confirmDialog.storage?.name}" and restore to active dropdowns?`
              : `Archive cold storage "${confirmDialog.storage?.name}"? It will be hidden from new lot forms but existing stock records remain safe.`
            : `Are you sure you want to delete "${confirmDialog.storage?.name}"? Under system safety rules, deletion will be rejected if this facility holds any active stock lots.`
        }
        confirmText={
          confirmDialog.action === 'archive'
            ? confirmDialog.storage?.is_archived
              ? 'Restore Storage'
              : 'Archive Storage'
            : 'Delete Permanently'
        }
        type={confirmDialog.action === 'delete' ? 'danger' : 'archive'}
      />
    </div>
  );
}
