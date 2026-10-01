export type ConditionTier = 'New / Store Fresh' | 'Certified Refurbished' | 'Pre-owned / Vintage';

export type ClearanceType = 'DDP' | 'DDU';

export interface DestinationCountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string;
  dutyRate: number; // e.g. 0.05 for 5%
  vatRate: number; // e.g. 0.15 for 15%
  region: string;
  customsNotes: string;
}

export interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  rateToUsd: number; // e.g. KWD = 0.308 (1 USD = 0.308 KWD -> 1 KWD = ~3.25 USD)
}

export interface SourcingPricing {
  base_price: number;
  shipping_insured: number;
  customs_duty: number;
  local_vat: number;
  total_landed_cost: number;
  currency: string;
}

export interface SourcingSource {
  rank: number;
  store_name: string;
  source_url: string;
  condition_grade: string;
  inclusions: string;
  clearance_type: ClearanceType;
  eta_business_days: string;
  pricing: SourcingPricing;
  duty_percent: number;
  vat_percent: number;
  carrier: string;
  authenticity_guarantee: string;
  return_policy: string;
}

export interface SourcingReport {
  id?: string;
  query: {
    item: string;
    destination: string;
    condition: string;
    currency: string;
  };
  market_summary: string;
  sources: SourcingSource[];
  generated_at?: string;
}
