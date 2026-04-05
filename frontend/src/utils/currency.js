/* ═══════════════════════════════════════════════════════════════
   Currency Code → Symbol Mapping
   Used by formatters to display the correct money symbol
   ═══════════════════════════════════════════════════════════════ */

const CURRENCY_SYMBOLS = {
    INR: '₹',
    USD: '$',
    GBP: '£',
    EUR: '€',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF ',
    SEK: 'kr ',
    NOK: 'kr ',
    DKK: 'kr ',
    BRL: 'R$',
    MXN: 'MX$',
    ZAR: 'R ',
    RUB: '₽',
    TRY: '₺',
    ILS: '₪',
    SAR: 'SR ',
    AED: 'AED ',
    SGD: 'S$',
    HKD: 'HK$',
    TWD: 'NT$',
    THB: '฿',
    MYR: 'RM ',
    IDR: 'Rp ',
    PHP: '₱',
    VND: '₫',
    PLN: 'zł ',
    CZK: 'Kč ',
    HUF: 'Ft ',
    RON: 'lei ',
    NGN: '₦',
    EGP: 'E£',
    KES: 'KSh ',
    ARS: 'AR$',
    CLP: 'CL$',
    COP: 'CO$',
    PEN: 'S/',
    NZD: 'NZ$',
    PKR: '₨',
    BDT: '৳',
    LKR: 'Rs ',
};

const COUNTRY_TO_CURRENCY = {
    'India': 'INR',
    'United States': 'USD',
    'United Kingdom': 'GBP',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'Japan': 'JPY',
    'China': 'CNY',
    'South Korea': 'KRW',
    'Germany': 'EUR',
    'France': 'EUR',
    'Italy': 'EUR',
    'Spain': 'EUR',
    'Netherlands': 'EUR',
    'Belgium': 'EUR',
    'Austria': 'EUR',
    'Finland': 'EUR',
    'Ireland': 'EUR',
    'Portugal': 'EUR',
    'Greece': 'EUR',
    'Luxembourg': 'EUR',
    'Switzerland': 'CHF',
    'Sweden': 'SEK',
    'Norway': 'NOK',
    'Denmark': 'DKK',
    'Brazil': 'BRL',
    'Mexico': 'MXN',
    'South Africa': 'ZAR',
    'Russia': 'RUB',
    'Turkey': 'TRY',
    'Israel': 'ILS',
    'Saudi Arabia': 'SAR',
    'UAE': 'AED',
    'United Arab Emirates': 'AED',
    'Singapore': 'SGD',
    'Hong Kong': 'HKD',
    'Taiwan': 'TWD',
    'Thailand': 'THB',
    'Malaysia': 'MYR',
    'Indonesia': 'IDR',
    'Philippines': 'PHP',
    'Vietnam': 'VND',
    'Poland': 'PLN',
    'Czech Republic': 'CZK',
    'Hungary': 'HUF',
    'Romania': 'RON',
    'Nigeria': 'NGN',
    'Egypt': 'EGP',
    'Kenya': 'KES',
    'Argentina': 'ARS',
    'Chile': 'CLP',
    'Colombia': 'COP',
    'Peru': 'PEN',
    'New Zealand': 'NZD',
    'Pakistan': 'PKR',
    'Bangladesh': 'BDT',
    'Sri Lanka': 'LKR',
};

/**
 * Get currency symbol from currency code (e.g. "USD" → "$")
 * Falls back to code + space if not found
 */
export function getCurrencySymbol(currencyCode) {
    if (!currencyCode) return '$';
    const upper = currencyCode.toUpperCase();
    return CURRENCY_SYMBOLS[upper] || `${upper} `;
}

/**
 * Get currency code from country name (e.g. "India" → "INR")
 */
export function getCurrencyCodeFromCountry(country) {
    if (!country) return 'USD';
    return COUNTRY_TO_CURRENCY[country] || 'USD';
}

/**
 * Get currency symbol from country name (e.g. "India" → "₹")
 */
export function getCurrencySymbolFromCountry(country) {
    return getCurrencySymbol(getCurrencyCodeFromCountry(country));
}