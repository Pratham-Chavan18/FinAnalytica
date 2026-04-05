/**
 * FinAnalytica — Formatting utilities
 * Supports 50+ currencies with correct symbols
 */

/* ═══════════════════════════════════════════════════════════════
   CURRENCY SYMBOL MAPPING
   ═══════════════════════════════════════════════════════════════ */
const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  CHF: 'CHF ',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  BRL: 'R$',
  MXN: 'MX$',
  ARS: 'AR$',
  CLP: 'CL$',
  COP: 'CO$',
  PEN: 'S/',
  ZAR: 'R ',
  NGN: '₦',
  EGP: 'E£',
  KES: 'KSh ',
  RUB: '₽',
  TRY: '₺',
  ILS: '₪',
  SAR: 'SR ',
  AED: 'AED ',
  QAR: 'QR ',
  KWD: 'KD ',
  BHD: 'BD ',
  OMR: 'OMR ',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  THB: '฿',
  MYR: 'RM ',
  IDR: 'Rp ',
  PHP: '₱',
  VND: '₫',
  PKR: '₨',
  BDT: '৳',
  LKR: 'Rs ',
  NPR: 'NRs ',
  PLN: 'zł ',
  CZK: 'Kč ',
  HUF: 'Ft ',
  RON: 'lei ',
  BGN: 'лв ',
  HRK: 'kn ',
  RSD: 'din ',
  UAH: '₴',
};

// Currencies that don't use decimal places
const NO_DECIMAL_CURRENCIES = new Set([
  'JPY', 'KRW', 'VND', 'IDR', 'CLP', 'HUF', 'ISK', 'UGX', 'RWF',
]);

// Currencies that use Indian numbering (lakhs/crores)
const INDIAN_CURRENCIES = new Set(['INR', 'NPR', 'PKR', 'BDT', 'LKR']);

/**
 * Get the symbol for a currency code
 * Falls back to "CODE " if not found
 */
function currencySymbol(currency) {
  if (!currency) return '₹';
  const upper = currency.toUpperCase();
  return CURRENCY_SYMBOLS[upper] || upper + ' ';
}

/* ═══════════════════════════════════════════════════════════════
   LARGE NUMBER FORMATTING
   ═══════════════════════════════════════════════════════════════ */

/**
 * Format large monetary values with appropriate suffix
 * - INR/NPR/PKR/BDT/LKR → uses Cr (crore) / L (lakh) convention
 * - All others → uses T (trillion) / B (billion) / M (million) / K (thousand)
 *
 * @param {number} num - The value to format
 * @param {string} currency - Currency code (e.g. "USD", "INR", "GBP")
 */
export function formatCrores(num, currency) {
  if (num == null || isNaN(num)) return '—';

  const sym = currencySymbol(currency);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const curr = (currency || 'INR').toUpperCase();

  // Indian numbering system
  if (INDIAN_CURRENCIES.has(curr)) {
    if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(1)}L Cr`;
    if (abs >= 1e7) return `${sign}${sym}${(abs / 1e7).toFixed(1)} Cr`;
    if (abs >= 1e5) return `${sign}${sym}${(abs / 1e5).toFixed(1)} L`;
    if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${sym}${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  // Western numbering system
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${sym}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/* ═══════════════════════════════════════════════════════════════
   PRICE FORMATTING
   ═══════════════════════════════════════════════════════════════ */

/**
 * Format a price with currency symbol and proper locale
 * Handles decimal rules per currency (JPY/KRW = no decimals, etc.)
 *
 * @param {number} num
 * @param {string} currency
 */
export function formatPrice(num, currency) {
  if (num == null || isNaN(num)) return '—';

  const sym = currencySymbol(currency);
  const curr = (currency || 'INR').toUpperCase();
  const decimals = NO_DECIMAL_CURRENCIES.has(curr) ? 0 : 2;

  if (INDIAN_CURRENCIES.has(curr)) {
    return `${sym}${Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }

  return `${sym}${Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format a large intrinsic/enterprise value with commas, no decimals
 *
 * @param {number} num
 * @param {string} currency
 */
export function formatIntrinsic(num, currency) {
  if (num == null || isNaN(num)) return '—';

  const sym = currencySymbol(currency);
  const curr = (currency || 'INR').toUpperCase();

  if (INDIAN_CURRENCIES.has(curr)) {
    return `${sym}${Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  return `${sym}${Number(num).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/* ═══════════════════════════════════════════════════════════════
   PERCENTAGE / MULTIPLE / DAYS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Format decimal as percentage (0.15 → "15.0%")
 */
export function formatPercent(dec, digits = 1) {
  if (dec == null || isNaN(dec) || !isFinite(dec)) return '—';
  return `${(dec * 100).toFixed(digits)}%`;
}

/**
 * Format as multiple (2.45 → "2.45x")
 */
export function formatMultiple(num, digits = 2) {
  if (num == null || isNaN(num) || !isFinite(num)) return '—';
  return `${num.toFixed(digits)}x`;
}

/**
 * Format as days (45.3 → "45 days")
 */
export function formatDays(num) {
  if (num == null || isNaN(num) || !isFinite(num)) return '—';
  return `${num.toFixed(0)} days`;
}

/* ═══════════════════════════════════════════════════════════════
   CHANGE INDICATORS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Returns CSS class name for positive/negative change
 */
export function changeClass(val) {
  if (val == null || isNaN(val)) return '';
  if (val > 0) return 'positive';
  if (val < 0) return 'negative';
  return '';
}

/**
 * Returns arrow character for positive/negative change
 */
export function changeArrow(val) {
  if (val == null || isNaN(val)) return '→';
  if (val > 0) return '↑';
  if (val < 0) return '↓';
  return '→';
}

/* ═══════════════════════════════════════════════════════════════
   HELPER EXPORT — for pages that need the raw symbol
   ═══════════════════════════════════════════════════════════════ */
export { currencySymbol };