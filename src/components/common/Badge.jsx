// ==============================================================================
// SRI YMB TRADING COMPANY — BADGE / PILL COMPONENT
// ==============================================================================

import React from 'react';

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200/80 font-semibold',
    maroon: 'bg-red-950 text-amber-200 border-red-800 font-semibold',
    gold: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    blue: 'bg-sky-50 text-sky-700 border-sky-200 font-medium',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
    teja: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    byadgi: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    sannam: 'bg-red-100 text-red-900 border-red-300 font-bold',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const selectedVariant = variants[variant] || variants.default;
  const selectedSize = sizes[size] || sizes.sm;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${selectedVariant} ${selectedSize} ${className}`}
    >
      {children}
    </span>
  );
}

export function VarietyBadge({ variety }) {
  let v = 'red';
  if (variety === 'Teja') v = 'teja';
  else if (variety === 'Byadgi') v = 'byadgi';
  else if (variety === 'Guntur Sannam') v = 'sannam';
  else if (variety === '273') v = 'purple';
  else if (variety === 'Devanur Deluxe') v = 'maroon';

  return <Badge variant={v}>{variety}</Badge>;
}

export function MovementBadge({ type }) {
  if (type === 'IN') {
    return <Badge variant="green">+ RECEIVED (IN)</Badge>;
  }
  if (type === 'OUT') {
    return <Badge variant="red">- REMOVED (OUT)</Badge>;
  }
  return <Badge variant="gold">~ ADJUSTMENT</Badge>;
}
