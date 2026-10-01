import React from 'react';
import { ExternalLink, ShieldCheck, Truck, PackageCheck, Receipt, Sparkles, CheckCircle2 } from 'lucide-react';
import { SourcingSource } from '../types/sourcing';
import { formatCurrency } from '../utils/destinationsAndCurrencies';

interface ItemizedSourceBreakdownProps {
  sources: SourcingSource[];
  currency: string;
}

export const ItemizedSourceBreakdown: React.FC<ItemizedSourceBreakdownProps> = ({
  sources,
  currency,
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              2. Itemized Breakdown (Top 5 Verified Sources)
            </h2>
            <p className="text-xs text-slate-400">
              Authenticated inventory, verified active pages, cost decomposition, freight insurance, and return guarantees
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {sources.map((source, index) => {
          const isBest = index === 0;
          const totalTaxes = source.pricing.customs_duty + source.pricing.local_vat;

          return (
            <div
              key={source.store_name}
              id={`source-card-${source.rank}`}
              className={`p-5 sm:p-7 rounded-3xl border transition-all duration-300 ${
                isBest
                  ? 'bg-slate-900/95 border-sky-500/40 shadow-xl shadow-sky-950/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header: Store Link, Live In-Stock Badge, Clearance Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      isBest
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{source.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base sm:text-lg font-extrabold text-white hover:text-sky-400 flex items-center gap-1.5 transition-colors group"
                      >
                        <span>{source.store_name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400" />
                      </a>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        Live & Available
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Direct In-Stock Catalog Search Endpoint</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isBest && (
                    <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Best Landed Price
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-full font-bold ${
                      source.clearance_type === 'DDP'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Clearance: {source.clearance_type}
                  </span>
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 border border-slate-700 whitespace-nowrap"
                  >
                    <span>View Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 4 Core Pillars: Inclusions, Cost Decomposition, ETA, Buyer Protection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                {/* Pillar 1: Condition & Inclusions */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <PackageCheck className="w-4 h-4 text-sky-400" />
                    <span>Condition & Inclusions</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Condition Grade: </span>
                      <span className="text-slate-100 font-semibold">{source.condition_grade}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Package Inclusions: </span>
                      <span className="text-slate-300 leading-relaxed">{source.inclusions}</span>
                    </div>
                  </div>
                </div>

                {/* Pillar 2: Delivery Timeline (ETA) & Courier */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Delivery Timeline & Courier</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Transit ETA: </span>
                      <span className="font-mono text-emerald-300 font-bold">{source.eta_business_days}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Insured Carrier: </span>
                      <span className="text-slate-300">{source.carrier}</span>
                    </div>
                  </div>
                </div>

                {/* Pillar 3: Cost Decomposition (Full CIF Breakdown) */}
                <div className="md:col-span-2 space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Cost Decomposition (CIF & Landed Arithmetic)</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Clearance: <strong className="text-white">{source.clearance_type}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    {/* 1. Base Item */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[11px] uppercase font-mono">1. Base Item</span>
                      <span className="font-mono font-bold text-sm text-slate-100 mt-1 block">
                        {formatCurrency(source.pricing.base_price, currency)}
                      </span>
                    </div>

                    {/* 2. Insured Courier */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[11px] uppercase font-mono">2. Insured Freight</span>
                      <span className="font-mono font-bold text-sm text-slate-300 mt-1 block">
                        {formatCurrency(source.pricing.shipping_insured, currency)}
                      </span>
                    </div>

                    {/* 3. Duties & VAT */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[11px] uppercase font-mono">
                        3. Duty ({source.duty_percent}%) + VAT ({source.vat_percent}%)
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-300 mt-1 block">
                        {formatCurrency(totalTaxes, currency)}
                      </span>
                    </div>

                    {/* 4. Total Landed Cost */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-sky-950/80 to-blue-950/60 border border-sky-500/30">
                      <span className="text-sky-400 block text-[11px] uppercase font-mono font-bold">
                        4. Total Landed Cost
                      </span>
                      <span className="font-mono font-black text-sm sm:text-base text-sky-200 mt-1 block">
                        {formatCurrency(source.pricing.total_landed_cost, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar 4: Buyer Protection & Return Policy */}
                <div className="md:col-span-2 space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Buyer Protection & Return Policy</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-400 font-medium">Authenticity Guarantee: </span>
                      <span className="text-slate-200">{source.authenticity_guarantee}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Return Window: </span>
                      <span className="text-slate-200">{source.return_policy}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
