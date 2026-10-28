// ==============================================================================
// SRI YMB TRADING COMPANY — AUDIT TRAIL PAGE
// Compliance, Security, User Action Logging & Database Tracking
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../lib/api';
import EmptyState from '../components/common/EmptyState';
import { ShieldAlert, RefreshCw, Clock, User } from 'lucide-react';


export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs(150);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              System Audit Trail & Security Logs
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              Immutable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic and timestamped trail of all administrator actions, lot adjustments, movements and deletions
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition active:scale-95 shadow-xs"
          title="Reload audit records"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-700' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <span className="inline-block w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading security audit ledger...</p>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit entries recorded yet"
          description="Actions performed in the system (intakes, dispatches, bill uploads, updates) will appear here automatically."
          icon={ShieldAlert}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (log.action_type.includes('MOVEMENT') || log.action_type.includes('DISPATCH')) {
                badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
              } else if (log.action_type.includes('CREATE') || log.action_type.includes('UPLOAD')) {
                badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
              } else if (log.action_type.includes('DELETE') || log.action_type.includes('ARCHIVE')) {
                badgeColor = 'bg-red-100 text-red-900 border-red-300';
              } else if (log.action_type.includes('LOGIN')) {
                badgeColor = 'bg-sky-100 text-sky-900 border-sky-300';
              }

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${badgeColor}`}>
                        {log.action_type}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {log.entity_type} {log.entity_id ? `[${log.entity_id}]` : ''}
                      </div>

                      {log.details && (
                        <div className="mt-1 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-2xl overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}

                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
