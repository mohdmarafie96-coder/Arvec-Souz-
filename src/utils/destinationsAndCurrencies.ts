import { DestinationCountryInfo, CurrencyRate } from '../types/sourcing';

export const DESTINATION_COUNTRIES: DestinationCountryInfo[] = [
  {
    code: 'KW',
    name: 'Kuwait',
    flag: '🇰🇼',
    currency: 'KWD',
    dutyRate: 0.05, // 5% GCC standard customs duty
    vatRate: 0.0, // 0% VAT in Kuwait
    region: 'GCC / Middle East',
    customsNotes: 'GCC Common Customs Tariff 5%. 0% Import VAT. Courier clearance via DHL/FedEx standard.',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    dutyRate: 0.05, // 5% duty
    vatRate: 0.05, // 5% VAT
    region: 'GCC / Middle East',
    customsNotes: '5% customs duty on CIF above AED 300 + 5% Federal Import VAT.',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    dutyRate: 0.05, // 5% base duty (some luxury luxury tiers apply 5-7%)
    vatRate: 0.15, // 15% ZATCA Import VAT
    region: 'GCC / Middle East',
    customsNotes: '5% customs duty on CIF value + 15% ZATCA standard import VAT.',
  },
  {
    code: 'QA',
    name: 'Qatar',
    flag: '🇶🇦',
    currency: 'QAR',
    dutyRate: 0.05,
    vatRate: 0.0,
    region: 'GCC / Middle East',
    customsNotes: '5% customs duty on CIF value. 0% VAT currently enacted.',
  },
  {
    code: 'BH',
    name: 'Bahrain',
    flag: '🇧🇭',
    currency: 'BHD',
    dutyRate: 0.05,
    vatRate: 0.10, // 10% NBR VAT
    region: 'GCC / Middle East',
    customsNotes: '5% customs duty on CIF + 10% National Bureau for Revenue VAT.',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    dutyRate: 0.038, // Average Harmonized Tariff for watches/leather
    vatRate: 0.0, // No federal VAT
    region: 'North America',
    customsNotes: 'Harmonized Tariff Schedule (HTS) varies by material (~3.8% avg). De minimis threshold $800.',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    dutyRate: 0.025, // 2.5% - 4% for luxury goods
    vatRate: 0.20, // 20% HMRC Import VAT
    region: 'Europe',
    customsNotes: 'HMRC customs tariff ~2.5% on CIF + 20% Standard Import VAT.',
  },
  {
    code: 'EU_DE',
    name: 'European Union (Germany)',
    flag: '🇩🇪',
    currency: 'EUR',
    dutyRate: 0.03, // 3%
    vatRate: 0.19, // 19% German Einfuhrumsatzsteuer
    region: 'European Union',
    customsNotes: 'EU Integrated Tariff (TARIC) ~3% on CIF + 19% Import Turnover Tax (EUST).',
  },
  {
    code: 'EU_FR',
    name: 'European Union (France)',
    flag: '🇫🇷',
    currency: 'EUR',
    dutyRate: 0.03,
    vatRate: 0.20, // 20% French TVA
    region: 'European Union',
    customsNotes: 'EU TARIC ~3% on CIF + 20% French Import TVA.',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    currency: 'CHF',
    dutyRate: 0.0, // Abolished industrial tariffs
    vatRate: 0.081, // 8.1% Swiss MWST
    region: 'Europe',
    customsNotes: '0% industrial customs duties + 8.1% Federal Swiss Import VAT (MWST).',
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    dutyRate: 0.028,
    vatRate: 0.10, // 10% JCT
    region: 'Asia-Pacific',
    customsNotes: 'Japan Customs tariff ~2.8% + 10% Japanese Consumption Tax (JCT).',
  },
];

export const CURRENCY_RATES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUsd: 1.0 },
  KWD: { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', rateToUsd: 0.306 }, // 1 USD = 0.306 KWD -> 1 KWD ≈ $3.27
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateToUsd: 3.6725 },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', rateToUsd: 3.751 },
  QAR: { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', rateToUsd: 3.64 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUsd: 0.915 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUsd: 0.77 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToUsd: 0.865 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUsd: 151.8 },
};

/**
 * Format currency with international formatting standards
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCY_RATES[currencyCode] || CURRENCY_RATES['USD'];
  const isKwd = currencyCode === 'KWD';
  const decimals = isKwd ? 3 : currencyCode === 'JPY' ? 0 : 2;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${currency.symbol} ${formattedNumber} ${currency.code}`;
}
