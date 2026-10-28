// ==============================================================================
// SRI YMB TRADING COMPANY — STOCK MOVEMENTS LEDGER PAGE
// Full Transaction History: Opening Stock, Received (IN), Removed (OUT), Audit
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { fetchStockMovements, fetchColdStorages } from '../lib/api';
import { toQuintals, toKilograms } from '../lib/units';
import { MovementBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import {
  Plus,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';


export default function MovementsPage({ onOpenRecordMovement }) {
  const [movements, setMovements] = useState([]);
  const [coldStorages, setColdStorages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [storageFilter, setStorageFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const loadMovements = async () => {
    try {
      setLoading(true);
      const [moveData, storageData] = await Promise.all([
        fetchStockMovements({
          movementType: typeFilter,
          storageId: storageFilter,
          startDate,
          endDate,
        }),
        fetchColdStorages(true),
      ]);
      setMovements(moveData);
      setColdStorages(storageData);
    } catch (err) {
      console.error('Movements fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [typeFilter, storageFilter, startDate, endDate]);

  // Filter in memory for instant search
  const filteredMovements = useMemo(() => {
    if (!search.trim()) return movements;
    const q = search.toLowerCase().trim();
    return movements.filter(
      (m) =>
        m.lot?.lot_number?.toLowerCase().includes(q) ||
        m.destination_or_source?.toLowerCase().includes(q) ||
        m.vehicle_number?.toLowerCase().includes(q) ||
        m.bill_reference?.toLowerCase().includes(q) ||
        m.remarks?.toLowerCase().includes(q)
    );
  }, [movements, search]);

  // Calculate Ledger Summary
  const summary = useMemo(() => {
    let totalInQtl = 0;
    let totalOutQtl = 0;

    movements.forEach((m) => {
      const qtl = toQuintals(m.quantity, m.unit);
      if (m.movement_type === 'IN') {
        totalInQtl += qtl;
      } else if (m.movement_type === 'OUT') {
        totalOutQtl += qtl;
      }
    });

    return {
      totalInQtl: Number(totalInQtl.toFixed(2)),
      totalOutQtl: Number(totalOutQtl.toFixed(2)),
      netBalanceQtl: Number((totalInQtl - totalOutQtl).toFixed(2)),
    };
  }, [movements]);

  // Export movements to CSV
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) return;

    const headers = [
      'Date',
      'Movement Type',
      'Lot Number',
      'Chilli Variety',
      'Quantity',
      'Unit',
      'Weight in Quintals',
      'Weight in Kg',
      'Cold Storage',
      'Destination or Source',
      'Vehicle Number',
      'Bill Reference',
      'Remarks',
      'Logged By',
      'Timestamp',
    ];

    const rows = filteredMovements.map((m) => {
      const qtl = toQuintals(m.quantity, m.unit);
      const kg = toKilograms(m.quantity, m.unit);
      return [
        `"${m.date}"`,
        `"${m.movement_type}"`,
        `"${m.lot?.lot_number || ''}"`,
        `"${m.lot?.chilli_variety || ''}"`,
        m.quantity,
        `"${m.unit}"`,
        qtl,
        kg,
        `"${(m.cold_storage?.name || '').replace(/"/g, '""')}"`,
        `"${(m.destination_or_source || '').replace(/"/g, '""')}"`,
        `"${m.vehicle_number || ''}"`,
        `"${m.bill_reference || ''}"`,
        `"${(m.remarks || '').replace(/"/g, '""')}"`,
        `"${m.created_by || ''}"`,
        `"${m.created_at}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Sri_YMB_Stock_Movements_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Stock Movements Ledger
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              {filteredMovements.length} Movements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of red chilli intake, mandi dispatches, vehicle numbers and balance updates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenRecordMovement()}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Movement</span>
          </button>
        </div>
      </div>

      {/* Ledger Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              Stock Received (IN)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
              Procured
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">
            {summary.totalInQtl.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-semibold text-emerald-700">Qtl</span>
          </div>
          <div className="text-xs text-emerald-700 mt-0.5">
            ≈ {(summary.totalInQtl * 100).toLocaleString('en-IN')} kg
          </div>
        </div>

        <div className="bg-red-50/70 border border-red-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              Stock Removed (OUT)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-200/60 text-red-900">
              Dispatched
            </span>
          </div>
          <div className="text-2xl font-black text-red-950 mt-2">
            {summary.totalOutQtl.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-semibold text-red-700">Qtl</span>
          </div>
          <div className="text-xs text-red-700 mt-0.5">
            ≈ {(summary.totalOutQtl * 100).toLocaleString('en-IN')} kg
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Net Balance
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Calculated
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {summary.netBalanceQtl.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-semibold text-amber-300">Qtl</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            ≈ {(summary.netBalanceQtl * 100).toLocaleString('en-IN')} kg in ledger
          </div>
        </div>
      </div>

      {/* Filter and Date Range Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lot #, buyer, lorry..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50/50 hover:bg-white"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            >
              <option value="all">All Movement Types</option>
              <option value="IN">+ Received (IN)</option>
              <option value="OUT">- Removed (OUT)</option>
            </select>
          </div>

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

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From Date"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To Date"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <span className="inline-block w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading movements ledger from database...</p>
        </div>
      ) : filteredMovements.length === 0 ? (
        <EmptyState
          title="No stock movements recorded"
          description="Record your first stock intake or dispatch transaction using the button below."
          actionText="Record Stock Movement"
          onAction={() => onOpenRecordMovement()}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Lot # & Variety</th>
                  <th className="py-3 px-4">Quantity Moved</th>
                  <th className="py-3 px-4">Destination / Buyer / Source</th>
                  <th className="py-3 px-4">Cold Storage</th>
                  <th className="py-3 px-4">Vehicle #</th>
                  <th className="py-3 px-4">Ref Slip</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {m.date}
                    </td>
                    <td className="py-3 px-4">
                      <MovementBadge type={m.movement_type} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 font-mono">
                        {m.lot?.lot_number || 'LOT'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {m.lot?.chilli_variety || ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 text-sm">
                        {m.quantity.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-semibold text-red-700 uppercase">
                          {m.unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.unit === 'quintals'
                          ? `≈ ${(m.quantity * 100).toLocaleString('en-IN')} kg`
                          : `≈ ${(m.quantity / 100).toLocaleString('en-IN')} Qtl`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 max-w-[200px] truncate">
                        {m.destination_or_source || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {m.cold_storage?.name || 'Cold Storage'}
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-slate-700">
                      {m.vehicle_number || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {m.bill_reference || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {m.created_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
