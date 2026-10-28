// ==============================================================================
// SRI YMB TRADING COMPANY — UNIT CONVERSION & CURRENCY FORMATTERS
// 1 Quintal = 100 Kilograms (Strict Mathematical Precision)
// ==============================================================================

export const UNIT_QUINTALS = 'quintals';
export const UNIT_KILOGRAMS = 'kilograms';

/**
 * Converts any quantity to kilograms
 * @param {number} quantity 
 * @param {'quintals' | 'kilograms'} unit 
 * @returns {number}
 */
export function toKilograms(quantity, unit) {
  const num = Number(quantity) || 0;
  if (unit === UNIT_QUINTALS) {
    return Number((num * 100).toFixed(2));
  }
  return Number(num.toFixed(2));
}

/**
 * Converts any quantity to quintals
 * @param {number} quantity 
 * @param {'quintals' | 'kilograms'} unit 
 * @returns {number}
 */
export function toQuintals(quantity, unit) {
  const num = Number(quantity) || 0;
  if (unit === UNIT_KILOGRAMS) {
    return Number((num / 100).toFixed(2));
  }
  return Number(num.toFixed(2));
}

/**
 * Convert quantity from source unit to target unit
 * @param {number} quantity 
 * @param {'quintals' | 'kilograms'} fromUnit 
 * @param {'quintals' | 'kilograms'} toUnit 
 * @returns {number}
 */
export function convertUnit(quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) return Number(quantity);
  if (fromUnit === UNIT_QUINTALS && toUnit === UNIT_KILOGRAMS) {
    return Number((quantity * 100).toFixed(2));
  }
  if (fromUnit === UNIT_KILOGRAMS && toUnit === UNIT_QUINTALS) {
    return Number((quantity / 100).toFixed(2));
  }
  return Number(quantity);
}

/**
 * Format quantity with dual display (e.g., "250.00 Qtl (25,000 kg)")
 * @param {number} quantity 
 * @param {'quintals' | 'kilograms'} unit 
 * @returns {string}
 */
export function formatDualQuantity(quantity, unit) {
  const qty = Number(quantity) || 0;
  if (unit === UNIT_QUINTALS) {
    const kg = qty * 100;
    return `${qty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Qtl (${kg.toLocaleString('en-IN')} kg)`;
  }
  const qtl = qty / 100;
  return `${qty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg (${qtl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Qtl)`;
}

/**
 * Format Indian Rupee currency
 * @param {number} amount 
 * @returns {string}
 */
export function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Calculate total value for a stock lot
 * @param {number} quantity 
 * @param {'quintals' | 'kilograms'} unit 
 * @param {number} rate 
 * @param {'per_quintal' | 'per_kg'} rateUnit 
 * @returns {number}
 */
export function calculateStockValue(quantity, unit, rate, rateUnit) {
  const qty = Number(quantity) || 0;
  const price = Number(rate) || 0;

  if (unit === 'quintals' && rateUnit === 'per_quintal') {
    return qty * price;
  }
  if (unit === 'kilograms' && rateUnit === 'per_kg') {
    return qty * price;
  }
  if (unit === 'quintals' && rateUnit === 'per_kg') {
    return (qty * 100) * price;
  }
  if (unit === 'kilograms' && rateUnit === 'per_quintal') {
    return (qty / 100) * price;
  }
  return qty * price;
}

export const CHILLI_VARIETIES = [
  'Teja',
  'Byadgi',
  'Guntur Sannam',
  '273',
  'Devanur Deluxe',
  'Armoor',
  'Wonder Hot',
  '334 / S10',
  'Other'
];
