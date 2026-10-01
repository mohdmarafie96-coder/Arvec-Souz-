import React, { useState } from 'react';
import { Search, Globe, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';
import { ConditionTier } from '../types/sourcing';
import { DESTINATION_COUNTRIES, CURRENCY_RATES } from '../utils/destinationsAndCurrencies';

interface SourcingInputFormProps {
  onSearch: (params: {
    item: string;
    condition: ConditionTier;
    country: string;
    currency: string;
  }) => void;
  isLoading: boolean;
}

export const SourcingInputForm: React.FC<SourcingInputFormProps> = ({ onSearch, isLoading }) => {
  const [itemInput, setItemInput] = useState<string>('');
  const [condition, setCondition] = useState<ConditionTier>('New / Store Fresh');
  const [selectedCountry, setSelectedCountry] = useState<string>('Kuwait');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KWD');

  const conditions: ConditionTier[] = [
    'New / Store Fresh',
    'Certified Refurbished',
    'Pre-owned / Vintage',
  ];

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName);
    const countryObj = DESTINATION_COUNTRIES.find((c) => c.name === countryName);
    if (countryObj && CURRENCY_RATES[countryObj.currency]) {
      setSelectedCurrency(countryObj.currency);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemInput.trim()) return;
    onSearch({
      item: itemInput.trim(),
      condition,
      country: selectedCountry,
      currency: selectedCurrency,
    });
  };

  const currentCountryObj =
    DESTINATION_COUNTRIES.find((c) => c.name === selectedCountry) || DESTINATION_COUNTRIES[0];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main Item Search Input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-sky-400" />
              Item Query (Brand, Model, Ref, Specs, Leather)
            </span>
            <span className="text-[11px] text-slate-500 font-normal">e.g. Birkin 25, Daytona 116500LN, Leica M11-P</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={itemInput}
              onChange={(e) => setItemInput(e.target.value)}
              placeholder="Enter exact product name, model year, reference, size, or material..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl py-3.5 pl-4 pr-12 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <span className="p-1 rounded-lg bg-slate-800/80 text-slate-400 text-xs font-mono">
                ⌘K
              </span>
            </div>
          </div>
        </div>

        {/* 3 Parameter Controls: Condition, Destination Country, Preferred Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Condition Tier */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Condition Tier
            </label>
            <div className="relative">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ConditionTier)}
                className="w-full appearance-none bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {conditions.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 2. Destination Country & Customs Matrix */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Destination & Customs
            </label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full appearance-none bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {DESTINATION_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name} className="bg-slate-900 text-white">
                    {country.flag} {country.name} (Duty: {Math.round(country.dutyRate * 100)}% · VAT: {Math.round(country.vatRate * 100)}%)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 3. Preferred Currency */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              Display Currency
            </label>
            <div className="relative">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full appearance-none bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {Object.keys(CURRENCY_RATES).map((code) => {
                  const curr = CURRENCY_RATES[code];
                  return (
                    <option key={code} value={code} className="bg-slate-900 text-white">
                      {curr.code} ({curr.symbol}) — {curr.name}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Customs Summary Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentCountryObj.flag}</span>
            <span className="font-semibold text-slate-300">{currentCountryObj.name} Import Policy:</span>
            <span className="font-mono text-sky-300">
              {Math.round(currentCountryObj.dutyRate * 100)}% Customs Duty + {Math.round(currentCountryObj.vatRate * 100)}% Local VAT
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            CIF = Base + Insured Courier · DDP / DDU Analyzed
          </span>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !itemInput.trim()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scanning Global Sources & Calculating Landed Cost...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Calculate Landed Cost (Top 5 Sources)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
