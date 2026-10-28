// ==============================================================================
// SRI YMB TRADING COMPANY — REPORTS & AUDIT PAGE
// Stock summaries by variety, storage, lot number; printable report & CSV export
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { fetchInventoryLots, fetchColdStorages } from '../lib/api';
import {
  toQuintals,
  toKilograms,
  formatINR,
  calculateStockValue,
  CHILLI_VARIETIES,
} from '../lib/units';
import { VarietyBadge } from '../components/common/Badge';
import {
  Printer,
  Download,
  Warehouse,
  Flame,
  FileText,
} from 'lucide-react';


export default function ReportsPage() {
  const [activeSubTab, setActiveSubTab] = useState('variety'); // 'variety' | 'storage' | 'printable'
  const [lots, setLots] = useState([]);
  const [storages, setStorages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filter for printable report
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [lotsData, storageData] = await Promise.all([
          fetchInventoryLots({ includeArchived: false }),
          fetchColdStorages(false),
        ]);
        setLots(lotsData);
        setStorages(storageData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Aggregation by variety
  const varietySummary = useMemo(() => {
    const map = {};
    CHILLI_VARIETIES.forEach((v) => {
      map[v] = { variety: v, lotsCount: 0, quintals: 0, kg: 0, totalValue: 0 };
    });

    lots.forEach((lot) => {
      const v = lot.chilli_variety || 'Other';
      if (!map[v]) {
        map[v] = { variety: v, lotsCount: 0, quintals: 0, kg: 0, totalValue: 0 };
      }
      const qtl = toQuintals(lot.current_quantity, lot.unit);
      const kg = toKilograms(lot.current_quantity, lot.unit);
      const val = calculateStockValue(
        lot.current_quantity,
        lot.unit,
        lot.purchase_rate,
        lot.rate_unit
      );

      map[v].lotsCount += 1;
      map[v].quintals += qtl;
      map[v].kg += kg;
      map[v].totalValue += val;
    });

    return Object.values(map).filter((item) => item.lotsCount > 0);
  }, [lots]);

  // Aggregation by storage
  const storageSummary = useMemo(() => {
    return storages.map((storage) => {
      const storageLots = lots.filter((l) => l.cold_storage_id === storage.id);
      let totalQtl = 0;
      let totalVal = 0;

      storageLots.forEach((l) => {
        totalQtl += toQuintals(l.current_quantity, l.unit);
        totalVal += calculateStockValue(
          l.current_quantity,
          l.unit,
          l.purchase_rate,
          l.rate_unit
        );
      });

      const capacity = Number(storage.capacity_quintals) || 0;
      const utilization =
        capacity > 0 ? Number(((totalQtl / capacity) * 100).toFixed(1)) : 0;

      return {
        ...storage,
        lotsCount: storageLots.length,
        totalQtl: Number(totalQtl.toFixed(2)),
        totalKg: Number((totalQtl * 100).toFixed(2)),
        totalVal: Number(totalVal.toFixed(2)),
        utilization,
        availableCapacity: Math.max(0, capacity - totalQtl),
      };
    });
  }, [storages, lots]);

  // Grand totals
  const grandTotals = useMemo(() => {
    let totalQtl = 0;
    let totalKg = 0;
    let totalVal = 0;

    lots.forEach((l) => {
      totalQtl += toQuintals(l.current_quantity, l.unit);
      totalKg += toKilograms(l.current_quantity, l.unit);
      totalVal += calculateStockValue(
        l.current_quantity,
        l.unit,
        l.purchase_rate,
        l.rate_unit
      );
    });

    return {
      totalQtl: Number(totalQtl.toFixed(2)),
      totalKg: Number(totalKg.toFixed(2)),
      totalVal: Number(totalVal.toFixed(2)),
      lotsCount: lots.length,
    };
  }, [lots]);

  // Export CSV for Variety
  const exportVarietyCSV = () => {
    const headers = ['Chilli Variety', 'Active Lots', 'Weight in Quintals', 'Weight in Kg', 'Total Value (INR)'];
    const rows = varietySummary.map((v) => [
      `"${v.variety}"`,
      v.lotsCount,
      v.quintals.toFixed(2),
      v.kg.toFixed(2),
      v.totalValue.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Sri_YMB_Variety_Report_${asOfDate}.csv`;
    link.click();
  };

  // Export CSV for Storage
  const exportStorageCSV = () => {
    const headers = [
      'Cold Storage Facility',
      'Location',
      'Capacity (Qtl)',
      'Current Stock (Qtl)',
      'Available Space (Qtl)',
      'Utilization (%)',
      'Lots Count',
      'Total Value (INR)',
    ];
    const rows = storageSummary.map((s) => [
      `"${s.name}"`,
      `"${s.location}"`,
      s.capacity_quintals,
      s.totalQtl,
      s.availableCapacity,
      s.utilization,
      s.lotsCount,
      s.totalVal,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Sri_YMB_Storage_Report_${asOfDate}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Non-printable Controls */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Inventory Reports & Statements
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              Verified Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical summaries by chilli variety, cold warehouse capacity and printable certified inventory schedule
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'variety' && (
            <button
              onClick={exportVarietyCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Variety CSV</span>
            </button>
          )}

          {activeSubTab === 'storage' && (
            <button
              onClick={exportStorageCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Storage CSV</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation (Non-printable) */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('variety')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'variety'
              ? 'bg-red-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>By Chilli Variety</span>
        </button>

        <button
          onClick={() => setActiveSubTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'storage'
              ? 'bg-red-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Warehouse className="w-3.5 h-3.5" />
          <span>By Cold Storage</span>
        </button>

        <button
          onClick={() => setActiveSubTab('printable')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'printable'
              ? 'bg-red-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Printable Formal Report</span>
        </button>
      </div>

      {/* TAB 1: BY CHILLI VARIETY */}
      {activeSubTab === 'variety' && (
        <div className="no-print space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Chilli Cultivar / Variety</th>
                    <th className="py-3 px-4">Active Lots</th>
                    <th className="py-3 px-4">Total Weight (Quintals)</th>
                    <th className="py-3 px-4">Total Weight (Kilograms)</th>
                    <th className="py-3 px-4">Estimated Valuation</th>
                    <th className="py-3 px-4">% of Total Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {varietySummary.map((v) => {
                    const pct =
                      grandTotals.totalQtl > 0
                        ? ((v.quintals / grandTotals.totalQtl) * 100).toFixed(1)
                        : 0;
                    return (
                      <tr key={v.variety} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <VarietyBadge variety={v.variety} />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {v.lotsCount} {v.lotsCount === 1 ? 'Lot' : 'Lots'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          {v.quintals.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          <span className="text-xs font-semibold text-red-700">Qtl</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {v.kg.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          kg
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatINR(v.totalValue)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-red-700 h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold">
                  <tr>
                    <td className="py-3.5 px-4 text-amber-300 uppercase">Grand Total</td>
                    <td className="py-3.5 px-4">{grandTotals.lotsCount} Lots</td>
                    <td className="py-3.5 px-4 text-amber-300 text-sm">
                      {grandTotals.totalQtl.toLocaleString('en-IN')} Qtl
                    </td>
                    <td className="py-3.5 px-4">
                      {grandTotals.totalKg.toLocaleString('en-IN')} kg
                    </td>
                    <td className="py-3.5 px-4 text-amber-300">
                      {formatINR(grandTotals.totalVal)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BY COLD STORAGE */}
      {activeSubTab === 'storage' && (
        <div className="no-print space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Facility Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Lots Held</th>
                    <th className="py-3 px-4">Stored Stock</th>
                    <th className="py-3 px-4">Capacity (Qtl)</th>
                    <th className="py-3 px-4">Space Available</th>
                    <th className="py-3 px-4">Utilization</th>
                    <th className="py-3 px-4">Stock Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {storageSummary.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-[180px] truncate">
                        {s.location}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {s.lotsCount}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        {s.totalQtl.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-semibold text-red-700">Qtl</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {Number(s.capacity_quintals).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">
                        {s.availableCapacity.toLocaleString('en-IN')} Qtl
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            s.utilization > 90
                              ? 'bg-red-100 text-red-800'
                              : s.utilization > 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {s.utilization}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatINR(s.totalVal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL PRINTABLE STOCK REPORT (Shown on screen in 'printable' tab AND always when printed) */}
      <div
        className={`${
          activeSubTab === 'printable' ? 'block' : 'hidden print:block'
        } bg-white p-8 rounded-2xl border border-slate-300 shadow-lg text-slate-900 print:shadow-none print:border-none print:p-0`}
      >
        {/* Document Letterhead */}
        <div className="border-b-2 border-red-950 pb-5 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-7 h-7 text-red-800 fill-amber-400" />
            <h1 className="text-2xl font-black text-red-950 tracking-tight uppercase">
              Sri YMB Trading Company
            </h1>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Red Chilli Commission Agents, Traders & Cold Storage Administrators
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            Guntur • Khammam • Byadgi • Warangal • Raichur
          </p>
          <div className="mt-3 py-1 px-4 bg-slate-100 rounded-lg inline-block text-xs font-extrabold uppercase tracking-widest text-slate-800 border border-slate-200">
            Official Physical Mirchi Inventory Statement
          </div>
        </div>

        {/* Report Metadata */}
        <div className="flex justify-between items-center text-xs text-slate-700 mb-6 pb-3 border-b border-slate-200">
          <div>
            <p>
              <span className="font-bold">As Of Date:</span> {asOfDate}
            </p>
            <p className="text-[11px] text-slate-500">
              Generated: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p>
              <span className="font-bold">Total Mirchi Stock:</span>{' '}
              <span className="font-black text-red-950">
                {grandTotals.totalQtl.toLocaleString('en-IN')} Quintals
              </span>{' '}
              ({grandTotals.totalKg.toLocaleString('en-IN')} kg)
            </p>
            <p>
              <span className="font-bold">Total Estimated Value:</span>{' '}
              {formatINR(grandTotals.totalVal)}
            </p>
          </div>
        </div>

        {/* Schedule of Stock Lots */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
            Schedule of Active Lots & Cold Storage Placement
          </h3>
          <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2 px-2.5 border-r border-slate-300">S.No</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Lot Number</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Variety & Grade</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Cold Storage</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Supplier</th>
                <th className="py-2 px-2.5 border-r border-slate-300 text-right">Available Qtl</th>
                <th className="py-2 px-2.5 border-r border-slate-300 text-right">Rate (₹)</th>
                <th className="py-2 px-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {lots.map((lot, idx) => {
                const qtl = toQuintals(lot.current_quantity, lot.unit);
                const val = calculateStockValue(
                  lot.current_quantity,
                  lot.unit,
                  lot.purchase_rate,
                  lot.rate_unit
                );
                return (
                  <tr key={lot.id} className="text-[11px]">
                    <td className="py-2 px-2.5 border-r border-slate-300 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 font-mono font-bold">
                      {lot.lot_number}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300">
                      <span className="font-bold">{lot.chilli_variety}</span> —{' '}
                      {lot.item_name}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300">
                      {lot.cold_storage?.name}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300">
                      {lot.supplier_name}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 text-right font-bold">
                      {qtl.toFixed(2)}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 text-right">
                      {Number(lot.purchase_rate).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold">
                      {formatINR(val)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
              <tr>
                <td colSpan="5" className="py-2.5 px-3 text-right uppercase border-r border-slate-300">
                  Total Active Stock:
                </td>
                <td className="py-2.5 px-3 text-right text-red-950 font-black border-r border-slate-300">
                  {grandTotals.totalQtl.toFixed(2)} Qtl
                </td>
                <td className="py-2.5 px-3 border-r border-slate-300"></td>
                <td className="py-2.5 px-3 text-right text-red-950 font-black">
                  {formatINR(grandTotals.totalVal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Verification & Signatures */}
        <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto mb-1 pt-1" />
            <p className="font-bold">Prepared By</p>
            <p className="text-[10px] text-slate-500">Warehouse Inventory Clerk</p>
          </div>
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto mb-1 pt-1" />
            <p className="font-bold">Authorized Signatory</p>
            <p className="text-[10px] text-slate-500">Sri YMB Trading Company</p>
          </div>
        </div>
      </div>
    </div>
  );
}
