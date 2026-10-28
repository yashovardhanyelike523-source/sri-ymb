// ==============================================================================
// SRI YMB TRADING COMPANY — INVENTORY MANAGEMENT PAGE
// Features: Search by lot number, variety/storage filters, sort by qty/date,
// CSV export, Add, Edit, Archive, and Delete with safety confirmation
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchInventoryLots,
  fetchColdStorages,
  archiveInventoryLot,
  deleteInventoryLot,
} from '../lib/api';
import { CHILLI_VARIETIES, calculateStockValue, toQuintals } from '../lib/units';
import { VarietyBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  ArrowUpDown,
  Download,
  Plus,
  Eye,
  Edit,
  Archive,
  Trash2,
  ArrowLeftRight,
  Warehouse,
} from 'lucide-react';


export default function InventoryPage({
  onOpenAddStock,
  onOpenEditStock,
  onOpenStockDetails,
  onOpenRecordMovement,
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [lots, setLots] = useState([]);
  const [coldStorages, setColdStorages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [varietyFilter, setVarietyFilter] = useState('all');
  const [storageFilter, setStorageFilter] = useState('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortField, setSortField] = useState('purchase_date'); // 'purchase_date' | 'current_quantity' | 'lot_number'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    lot: null,
    action: 'archive', // 'archive' | 'delete'
    loading: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [lotsData, storageData] = await Promise.all([
        fetchInventoryLots({
          includeArchived,
          variety: varietyFilter,
          storageId: storageFilter,
          search,
        }),
        fetchColdStorages(true),
      ]);
      setLots(lotsData);
      setColdStorages(storageData);
    } catch (err) {
      toastError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [includeArchived, varietyFilter, storageFilter]);

  // Sort and filter in memory
  const filteredAndSortedLots = useMemo(() => {
    let result = [...lots];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.lot_number?.toLowerCase().includes(q) ||
          item.item_name?.toLowerCase().includes(q) ||
          item.supplier_name?.toLowerCase().includes(q) ||
          item.chilli_variety?.toLowerCase().includes(q) ||
          item.cold_storage?.name?.toLowerCase().includes(q) ||
          item.bill_reference?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'current_quantity') {
        // Standardize in quintals before comparing!
        valA = toQuintals(a.current_quantity, a.unit);
        valB = toQuintals(b.current_quantity, b.unit);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [lots, search, sortField, sortOrder]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedLots.length === 0) {
      toastError('No records to export');
      return;
    }

    const headers = [
      'Lot Number',
      'Item Description',
      'Chilli Variety',
      'Cold Storage',
      'Cold Storage Location',
      'Supplier Name',
      'Purchase Date',
      'Original Quantity',
      'Current Available Quantity',
      'Unit',
      'Weight in Quintals',
      'Weight in Kg',
      'Purchase Rate',
      'Rate Unit',
      'Total Value (INR)',
      'Bill Reference',
      'Remarks',
      'Archived',
      'Record ID',
    ];

    const rows = filteredAndSortedLots.map((l) => {
      const qtl = toQuintals(l.current_quantity, l.unit);
      const kg = l.unit === 'quintals' ? l.current_quantity * 100 : l.current_quantity;
      const totalVal = calculateStockValue(l.current_quantity, l.unit, l.purchase_rate, l.rate_unit);

      return [
        `"${l.lot_number}"`,
        `"${(l.item_name || '').replace(/"/g, '""')}"`,
        `"${l.chilli_variety}"`,
        `"${(l.cold_storage?.name || '').replace(/"/g, '""')}"`,
        `"${(l.cold_storage?.location || '').replace(/"/g, '""')}"`,
        `"${(l.supplier_name || '').replace(/"/g, '""')}"`,
        `"${l.purchase_date}"`,
        l.original_quantity,
        l.current_quantity,
        `"${l.unit}"`,
        qtl,
        kg,
        l.purchase_rate,
        `"${l.rate_unit}"`,
        totalVal,
        `"${l.bill_reference || ''}"`,
        `"${(l.remarks || '').replace(/"/g, '""')}"`,
        l.is_archived ? 'YES' : 'NO',
        `"${l.id}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Sri_YMB_Mirchi_Inventory_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Mirchi inventory exported to CSV file.');
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.lot) return;
    const lot = confirmDialog.lot;

    try {
      setConfirmDialog((prev) => ({ ...prev, loading: true }));
      if (confirmDialog.action === 'archive') {
        const nextState = !lot.is_archived;
        await archiveInventoryLot(lot.id, nextState, user?.email);
        success(`Lot "${lot.lot_number}" ${nextState ? 'archived' : 'restored'}.`);
      } else if (confirmDialog.action === 'delete') {
        await deleteInventoryLot(lot.id, user?.email);
        success(`Lot "${lot.lot_number}" permanently removed.`);
      }
      setConfirmDialog({ isOpen: false, lot: null, action: 'archive', loading: false });
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
              Mirchi Inventory Management
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              {filteredAndSortedLots.length} Lots
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal ledger of red chilli lots, cold warehouse stocks & procurement values
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddStock}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Lot</span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by Lot Number / Item / Supplier */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lot #, supplier, grade..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50/50 hover:bg-white"
            />
          </div>

          {/* Filter by Chilli Variety */}
          <div>
            <select
              value={varietyFilter}
              onChange={(e) => setVarietyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            >
              <option value="all">All Chilli Varieties</option>
              {CHILLI_VARIETIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Cold Storage */}
          <div>
            <select
              value={storageFilter}
              onChange={(e) => setStorageFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            >
              <option value="all">All Cold Storages</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            >
              <option value="purchase_date">Sort by Date</option>
              <option value="current_quantity">Sort by Available Stock</option>
              <option value="lot_number">Sort by Lot Number</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition text-slate-700"
              title={`Switch to ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toggle Archived Checkbox */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded text-red-700 focus:ring-red-600"
            />
            <span>Include Archived Lots</span>
          </label>

          <span className="text-[11px] text-slate-400">
            Showing {filteredAndSortedLots.length} records
          </span>
        </div>
      </div>

      {/* Main Inventory Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <span className="inline-block w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading mirchi inventory from database...</p>
        </div>
      ) : filteredAndSortedLots.length === 0 ? (
        <EmptyState
          title="No inventory lots found"
          description="Try adjusting your search query, clearing variety filters, or register a new stock lot."
          actionText="Add New Mirchi Stock"
          onAction={onOpenAddStock}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Responsive Desktop & Tablet Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lot # & Grade</th>
                  <th className="py-3 px-4">Variety</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Cold Storage</th>
                  <th className="py-3 px-4">Supplier & Date</th>
                  <th className="py-3 px-4">Purchase Rate</th>
                  <th className="py-3 px-4">Bill Ref</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAndSortedLots.map((lot) => {
                  const isArchived = lot.is_archived;
                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-red-50/40 transition duration-100 ${
                        isArchived ? 'bg-slate-50/80 opacity-75' : ''
                      }`}
                    >
                      {/* Lot # & Grade */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
                          <span>{lot.lot_number}</span>
                          {isArchived && (
                            <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 uppercase">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium max-w-[200px] truncate">
                          {lot.item_name}
                        </div>
                      </td>

                      {/* Variety */}
                      <td className="py-3.5 px-4">
                        <VarietyBadge variety={lot.chilli_variety} />
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 text-sm">
                          {lot.current_quantity.toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-semibold text-red-700 uppercase">
                            {lot.unit}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {lot.unit === 'quintals'
                            ? `≈ ${(lot.current_quantity * 100).toLocaleString('en-IN')} kg`
                            : `≈ ${(lot.current_quantity / 100).toLocaleString('en-IN')} Qtl`}
                        </div>
                      </td>

                      {/* Cold Storage */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lot.cold_storage?.name || 'Cold Storage'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {lot.cold_storage?.location}
                        </div>
                      </td>

                      {/* Supplier & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{lot.supplier_name}</div>
                        <div className="text-[10px] text-slate-400">{lot.purchase_date}</div>
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">
                          ₹{Number(lot.purchase_rate).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {lot.rate_unit === 'per_quintal' ? '/ Qtl' : '/ kg'}
                        </div>
                      </td>

                      {/* Bill Ref */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {lot.bill_reference || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Quick movement button */}
                          <button
                            onClick={() => onOpenRecordMovement(lot)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition"
                            title="Record Dispatch / Stock Movement"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>

                          {/* View details */}
                          <button
                            onClick={() => onOpenStockDetails(lot)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="View Full Specifications & Movement Ledger"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit lot */}
                          <button
                            onClick={() => onOpenEditStock(lot)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                            title="Edit Lot Info"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Archive toggle */}
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                lot,
                                action: 'archive',
                                loading: false,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                            title={isArchived ? 'Restore lot' : 'Archive lot'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          {/* Delete permanently */}
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                lot,
                                action: 'delete',
                                loading: false,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
            ? confirmDialog.lot?.is_archived
              ? 'Restore Inventory Lot'
              : 'Archive Inventory Lot'
            : 'Delete Inventory Lot'
        }
        message={
          confirmDialog.action === 'archive'
            ? confirmDialog.lot?.is_archived
              ? `Are you sure you want to unarchive lot "${confirmDialog.lot?.lot_number}" and return it to active inventory?`
              : `Are you sure you want to archive lot "${confirmDialog.lot?.lot_number}"? Archived lots are hidden from active stock totals but their movement audit history is preserved.`
            : `Are you sure you want to permanently delete lot "${confirmDialog.lot?.lot_number}"? If this lot has dispatch movements, the deletion will be rejected to protect ledger integrity.`
        }
        confirmText={
          confirmDialog.action === 'archive'
            ? confirmDialog.lot?.is_archived
              ? 'Restore Lot'
              : 'Archive Lot'
            : 'Delete Permanently'
        }
        type={confirmDialog.action === 'delete' ? 'danger' : 'archive'}
      />
    </div>
  );
}
