// ==============================================================================
// SRI YMB TRADING COMPANY — DASHBOARD PAGE
// Realtime Database Summary, Quick Actions, Variety Distribution & Recent Feeds
// ==============================================================================

import React, { useState, useEffect } from 'react';
import MetricCard from '../components/common/MetricCard';
import { fetchDashboardMetrics } from '../lib/api';
import { formatINR } from '../lib/units';
import { VarietyBadge, MovementBadge } from '../components/common/Badge';
import {
  Layers,
  Warehouse,
  Receipt,
  ArrowLeftRight,
  Plus,
  UploadCloud,
  RefreshCw,
  Flame,
  ArrowRight,
  QrCode,
} from 'lucide-react';

export default function DashboardPage({
  onNavigate,
  onOpenAddStock,
  onOpenRecordMovement,
  onOpenUploadBill,
  onOpenAddStorage,
  onOpenCollectUpi,
}) {

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Operations Overview
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              Realtime
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sri YMB Trading Company • Mirchi trading commodity administration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition active:scale-95"
            title="Refresh database metrics"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-700' : ''}`}
            />
          </button>

          <button
            onClick={onOpenAddStock}
            className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-900/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </button>

          <button
            onClick={onOpenRecordMovement}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-300" />
            <span>Record Movement</span>
          </button>

          <button
            onClick={onOpenUploadBill}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-slate-950" />
            <span>Upload Bill</span>
          </button>

          {onOpenCollectUpi && (
            <button
              onClick={onOpenCollectUpi}
              className="px-3.5 py-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-900 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Collect UPI</span>
            </button>
          )}
        </div>
      </div>


      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Mirchi Stock"
          value={
            metrics
              ? `${metrics.totalStockQuintals.toLocaleString('en-IN')} Qtl`
              : '...'
          }
          secondaryValue={
            metrics
              ? `≈ ${metrics.totalStockKg.toLocaleString('en-IN')} kg`
              : 'Calculating...'
          }
          icon={Layers}
          colorScheme="red"
          onClick={() => onNavigate('inventory')}
        />

        <MetricCard
          title="Active Lots"
          value={metrics ? metrics.totalActiveLots : '...'}
          secondaryValue="Stored across cold warehouses"
          icon={Flame}
          colorScheme="amber"
          onClick={() => onNavigate('inventory')}
        />

        <MetricCard
          title="Cold Storages"
          value={metrics ? metrics.totalColdStorages : '...'}
          secondaryValue="Active registered facilities"
          icon={Warehouse}
          colorScheme="blue"
          onClick={() => onNavigate('storages')}
        />

        <MetricCard
          title="Purchase Bills"
          value={metrics ? metrics.totalBills : '...'}
          secondaryValue={
            metrics
              ? `Value: ${formatINR(metrics.totalInventoryValue)}`
              : 'Verifying...'
          }
          icon={Receipt}
          colorScheme="emerald"
          onClick={() => onNavigate('bills')}
        />
      </div>

      {/* Client Getting Started / Onboarding Guide (Displays when inventory is clean) */}
      {metrics && metrics.totalActiveLots === 0 && (
        <div className="bg-gradient-to-br from-amber-50 via-white to-red-50 p-6 rounded-3xl border-2 border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-amber-200/80">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 text-red-700" />
                <span>Client Onboarding • Ready For Live Data</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Welcome to Sri YMB Trading Company — Mirchi Inventory System
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                The database is clean with zero demo data. Follow these 3 simple setup steps to populate your company's actual physical stock and cold storage records:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-red-300 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-800 font-black text-sm flex items-center justify-center mb-3">
                  1
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Register Cold Storages
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Add the warehouse facilities where your chillies are preserved (e.g. Guntur, Khammam, Byadgi) with manager contacts & quintal capacity.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddStorage}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Add Cold Storage</span>
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-red-300 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-red-700 text-white font-black text-sm flex items-center justify-center mb-3 shadow-xs">
                  2
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Enter Red Chilli Lots
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Record each lot with its cultivar (Teja, Byadgi, Guntur Sannam, 273), weight in quintals/kg, supplier name, and purchase price.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddStock}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-red-900/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Mirchi Stock Lot</span>
              </button>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-red-300 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mb-3">
                  3
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Upload Mandi Bills
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Snap paper bills using your phone camera or upload PDFs and receipts to maintain an audit-ready digital archive linked to lots.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenUploadBill}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Purchase Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chilli Variety Distribution Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-700" />
              Stock by Chilli Variety

            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Available weight distribution across commercial red chilli cultivars
            </p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 transition"
          >
            <span>Detailed Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {metrics?.varietyBreakdown?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {metrics.varietyBreakdown.map((item) => (
              <div
                key={item.variety}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-red-300 transition"
              >
                <div className="flex items-center justify-between">
                  <VarietyBadge variety={item.variety} />
                  <span className="text-[11px] font-semibold text-slate-500">
                    {item.count} {item.count === 1 ? 'Lot' : 'Lots'}
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-lg font-black text-slate-900">
                    {item.quintals.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-medium text-slate-500">Qtl</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.kg.toLocaleString('en-IN')} kg total weight
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No active lots recorded yet. Use the "Add Stock" button above to get started.
          </div>
        )}
      </div>

      {/* Two Column Layout: Recent Movements & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-red-700" />
                Recent Stock Movements
              </h3>
              <button
                onClick={() => onNavigate('movements')}
                className="text-xs font-semibold text-red-700 hover:text-red-900 transition"
              >
                View Ledger
              </button>
            </div>

            {metrics?.recentMovements?.length > 0 ? (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {metrics.recentMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-2">
                          <MovementBadge type={m.movement_type} />
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-slate-800">
                            {m.lot?.lot_number || 'Lot'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {m.destination_or_source || m.lot?.item_name}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <div className="font-extrabold text-slate-900">
                            {m.quantity} {m.unit}
                          </div>
                          <div className="text-[10px] text-slate-400">{m.date}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent stock movements recorded.
              </div>
            )}
          </div>
        </div>

        {/* Recent Bills Uploads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-700" />
                Recent Purchase Bills
              </h3>
              <button
                onClick={() => onNavigate('bills')}
                className="text-xs font-semibold text-red-700 hover:text-red-900 transition"
              >
                View All Bills
              </button>
            </div>

            {metrics?.recentBills?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.recentBills.map((b) => (
                  <div
                    key={b.id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {b.bill_number}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Supplier: {b.supplier} • {b.bill_date}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {b.file_name?.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No bills uploaded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
