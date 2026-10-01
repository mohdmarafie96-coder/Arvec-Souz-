import React, { useState } from 'react';
import { Calculator, ArrowRight, Sparkles, DollarSign } from 'lucide-react';
import { Language } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';

interface CalculatorTabProps {
  lang: Language;
  onTransferQuote: (quoteData: {
    retail: number;
    totalQuote: number;
    deposit: number;
    currency: string;
  }) => void;
}

const FX_RATES: Record<string, number> = {
  'GBP-KWD': 0.395,
  'GBP-SAR': 4.78,
  'GBP-AED': 4.67,
  'GBP-QAR': 4.64,
  'EUR-KWD': 0.334,
  'EUR-SAR': 4.12,
  'EUR-AED': 4.02,
  'EUR-QAR': 3.99,
  'USD-KWD': 0.306,
  'USD-SAR': 3.75,
  'USD-AED': 3.6725,
  'USD-QAR': 3.64,
};

export const CalculatorTab: React.FC<CalculatorTabProps> = ({ lang, onTransferQuote }) => {
  const [sourceCurr, setSourceCurr] = useState<string>('GBP');
  const [destCurr, setDestCurr] = useState<string>('KWD');
  const [fxRate, setFxRate] = useState<number>(0.395);
  const [retailPrice, setRetailPrice] = useState<number>(8200);
  const [shipping, setShipping] = useState<number>(120);
  const [dutyPercent, setDutyPercent] = useState<number>(5);
  const [commissionPercent, setCommissionPercent] = useState<number>(15);
  const [depositPaid, setDepositPaid] = useState<number>(1500);

  const t = TRANSLATIONS[lang];

  const handlePairChange = (newSource: string, newDest: string) => {
    setSourceCurr(newSource);
    setDestCurr(newDest);
    const key = `${newSource}-${newDest}`;
    const rate = FX_RATES[key] || 0.395;
    setFxRate(rate);
  };

  // Calculations
  const convertedRetail = retailPrice * fxRate;
  const customsFee = convertedRetail * (dutyPercent / 100);
  const shopperMargin = convertedRetail * (commissionPercent / 100);
  const totalLandedQuote = convertedRetail + customsFee + shipping + shopperMargin;
  const balanceDue = Math.max(0, totalLandedQuote - depositPaid);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Inputs (Left 7 Cols) */}
      <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase">
              Financial Engine
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">{t.calculator.title}</h2>
          </div>
          <p className="text-xs text-zinc-400">{t.calculator.subtitle}</p>
        </div>

        {/* Currency Pair Selector */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
            {lang === 'ar' ? 'مسار العملات وسعر الصرف المباشر' : 'Currency Route & Live FX'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">
                {t.calculator.sourceCurrency}
              </label>
              <select
                value={sourceCurr}
                onChange={(e) => handlePairChange(e.target.value, destCurr)}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="GBP">GBP (£) — United Kingdom / London</option>
                <option value="EUR">EUR (€) — France / Italy / EU</option>
                <option value="USD">USD ($) — North America</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">
                {t.calculator.destCurrency}
              </label>
              <select
                value={destCurr}
                onChange={(e) => handlePairChange(sourceCurr, e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="KWD">KWD (KD) — Kuwait</option>
                <option value="SAR">SAR (SR) — Saudi Arabia</option>
                <option value="AED">AED (AED) — United Arab Emirates</option>
                <option value="QAR">QAR (QR) — Qatar</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
            <span>Exchange Rate (1 {sourceCurr} = X {destCurr}):</span>
            <input
              type="number"
              step="0.0001"
              value={fxRate}
              onChange={(e) => setFxRate(parseFloat(e.target.value) || 0)}
              className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-right text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Financial Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              {t.calculator.retailPrice} ({sourceCurr})
            </label>
            <input
              type="number"
              value={retailPrice}
              onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              {t.calculator.courierShipping} ({destCurr})
            </label>
            <input
              type="number"
              value={shipping}
              onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              {t.calculator.dutyRate}
            </label>
            <input
              type="number"
              value={dutyPercent}
              onChange={(e) => setDutyPercent(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              {t.calculator.commissionRate}
            </label>
            <input
              type="number"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              {t.calculator.depositPaid} ({destCurr})
            </label>
            <input
              type="number"
              value={depositPaid}
              onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm font-mono text-emerald-300 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() =>
              onTransferQuote({
                retail: retailPrice,
                totalQuote: Math.round(totalLandedQuote),
                deposit: depositPaid,
                currency: destCurr,
              })
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.calculator.transferBtn}</span>
          </button>
        </div>
      </div>

      {/* Outputs (Right 5 Cols) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              {lang === 'ar' ? 'كشف تفاصيل التكلفة النهائية' : 'Landed Statement'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              ACCURATE CIF
            </span>
          </div>

          <div className="space-y-3.5 py-5 text-xs font-mono">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">{t.calculator.convertedRetail}:</span>
              <span className="font-bold text-white">
                {destCurr} {convertedRetail.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">{t.calculator.customsFee} ({dutyPercent}%):</span>
              <span className="font-bold text-zinc-200">
                {destCurr} {customsFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">{t.calculator.courierShipping}:</span>
              <span className="font-bold text-zinc-200">
                {destCurr} {shipping.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-amber-300 pt-2 border-t border-zinc-800/80">
              <span className="font-bold">{t.calculator.profitMargin} ({commissionPercent}%):</span>
              <span className="font-bold text-sm">
                {destCurr} {shopperMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Big Total Box */}
          <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
              {t.calculator.totalLandedQuote}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300">
              {destCurr} {totalLandedQuote.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-zinc-500 block font-mono">
              Retail + Customs + Courier + Shopper Margin
            </span>
          </div>

          {/* Balance Due */}
          <div className="mt-4 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-zinc-500 block text-[10px]">{t.calculator.depositPaid}:</span>
              <span className="text-emerald-400 font-bold">
                {destCurr} {depositPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px]">{t.calculator.balanceDue}:</span>
              <span className="text-amber-200 font-bold text-sm">
                {destCurr} {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
