// ==============================================================================
// SRI YMB TRADING COMPANY — METRIC CARD COMPONENT
// ==============================================================================

import React from 'react';

export default function MetricCard({
  title,
  value,
  secondaryValue,
  icon: Icon,
  trend,
  colorScheme = 'red', // 'red' | 'amber' | 'maroon' | 'emerald' | 'blue'
  onClick,
}) {
  const colorMaps = {
    red: {
      bg: 'bg-red-50 text-red-700 ring-red-100',
      border: 'hover:border-red-400',
      accent: 'text-red-700',
    },
    maroon: {
      bg: 'bg-amber-950/10 text-red-950 ring-red-900/10',
      border: 'hover:border-red-900',
      accent: 'text-red-950',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-700 ring-amber-100',
      border: 'hover:border-amber-400',
      accent: 'text-amber-700',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      border: 'hover:border-emerald-400',
      accent: 'text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-700 ring-blue-100',
      border: 'hover:border-blue-400',
      accent: 'text-blue-700',
    },
  };

  const scheme = colorMaps[colorScheme] || colorMaps.red;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 ' + scheme.border : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <h4 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {value}
          </h4>
          {secondaryValue && (
            <p className="text-xs font-medium text-slate-500 mt-1">
              {secondaryValue}
            </p>
          )}
          {trend && (
            <div className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-1">
              {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ring-4 ${scheme.bg} shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
