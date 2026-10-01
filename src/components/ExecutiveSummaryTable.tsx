import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SourcingReport, ClearanceType } from '../types/sourcing';
import { formatCurrency } from '../utils/destinationsAndCurrencies';

interface ExecutiveSummaryTableProps {
  report: SourcingReport;
  onSelectSource?: (rank: number) => void;
}

type SortField = 'landed' | 'base' | 'eta';

export const ExecutiveSummaryTable: React.FC<ExecutiveSummaryTableProps> = ({
  report,
  onSelectSource,
}) => {
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortField>('landed');
  const [clearanceFilter, setClearanceFilter] = useState<'ALL' | ClearanceType>('ALL');

  const currency = report.query.currency;

  // Filter & Sort Sources
  const displayedSources = useMemo(() => {
    let list = [...report.sources];

    if (clearanceFilter !== 'ALL') {
      list = list.filter((s) => s.clearance_type === clearanceFilter);
    }

    if (sortBy === 'landed') {
      list.sort((a, b) => a.pricing.total_landed_cost - b.pricing.total_landed_cost);
    } else if (sortBy === 'base') {
      list.sort((a, b) => a.pricing.base_price - b.pricing.base_price);
    } else if (sortBy === 'eta') {
      list.sort((a, b) => a.eta_business_days.localeCompare(b.eta_business_days));
    }

    return list;
  }, [report.sources, sortBy, clearanceFilter]);

  // Compute best price savings compared to highest quote
  const lowestLanded = report.sources[0]?.pricing?.total_landed_cost || 0;
  const highestLanded = report.sources[report.sources.length - 1]?.pricing?.total_landed_cost || 0;
  const maxSavings = Math.max(0, highestLanded - lowestLanded);
  const savingsPercent = highestLanded > 0 ? Math.round((maxSavings / highestLanded) * 100) : 0;

  // Generate markdown table representation as specified in the prompt
  const generateMarkdownTable = () => {
    let md = `### Executive Summary & Comparison Table\n\n`;
    md += `${report.market_summary}\n\n`;
    md += `| Rank & Store | Condition Grade | Base Price | Courier & Insurance | Est. Duty & VAT | Total Landed Cost | Clearance Type | ETA |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    report.sources.forEach((s) => {
      const baseStr = formatCurrency(s.pricing.base_price, currency);
      const shipStr = formatCurrency(s.pricing.shipping_insured, currency);
      const taxStr = formatCurrency(s.pricing.customs_duty + s.pricing.local_vat, currency);
      const totalStr = formatCurrency(s.pricing.total_landed_cost, currency);

      md += `| #${s.rank} [${s.store_name}](${s.source_url}) | ${s.condition_grade} | ${baseStr} | ${shipStr} | ${taxStr} | **${totalStr}** | ${s.clearance_type} | ${s.eta_business_days} |\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownTable());
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
      {/* Executive Summary Card */}
      <div className="space-y-3 pb-5 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  1. Executive Summary & Market Comparison
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  All In Stock
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {report.query.item} · {report.query.condition} · Destination: {report.query.destination}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {maxSavings > 0 && (
              <span className="hidden md:flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Best Price Saves {formatCurrency(maxSavings, currency)} ({savingsPercent}%)
              </span>
            )}

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700 active:scale-95 cursor-pointer"
              title="Copy as Markdown table"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMarkdown ? 'Table Copied!' : 'Copy Table'}</span>
            </button>
          </div>
        </div>

        {/* 2-Sentence Market Status Summary (Prompt Requirement) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {report.market_summary}
        </div>
      </div>

      {/* Sorting & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" /> Sort By:
          </span>
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setSortBy('landed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sortBy === 'landed' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Best Landed Price
            </button>
            <button
              onClick={() => setSortBy('base')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sortBy === 'base' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Base Item
            </button>
            <button
              onClick={() => setSortBy('eta')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sortBy === 'eta' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fastest ETA
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> Clearance:
          </span>
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setClearanceFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                clearanceFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All (5)
            </button>
            <button
              onClick={() => setClearanceFilter('DDP')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                clearanceFilter === 'DDP' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              DDP (Taxes Pre-paid)
            </button>
            <button
              onClick={() => setClearanceFilter('DDU')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                clearanceFilter === 'DDU' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              DDU (At Customs)
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px] tracking-wider">
              <th className="py-3 px-3">Rank & Store</th>
              <th className="py-3 px-3">Condition Grade</th>
              <th className="py-3 px-3 text-right">Base Price</th>
              <th className="py-3 px-3 text-right">Courier & Ins.</th>
              <th className="py-3 px-3 text-right">Est. Duty & VAT</th>
              <th className="py-3 px-3 text-right font-bold text-sky-400">Total Landed Cost</th>
              <th className="py-3 px-3 text-center">Clearance</th>
              <th className="py-3 px-3 text-right">ETA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {displayedSources.map((source, index) => {
              const isBest = index === 0;
              const totalTaxes = source.pricing.customs_duty + source.pricing.local_vat;

              return (
                <tr
                  key={source.store_name}
                  onClick={() => onSelectSource && onSelectSource(source.rank)}
                  className={`group transition-colors hover:bg-slate-850/60 cursor-pointer ${
                    isBest ? 'bg-sky-950/20' : ''
                  }`}
                >
                  {/* Rank & Store */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] ${
                          isBest
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{source.rank}
                      </span>
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-slate-100 hover:text-sky-400 flex items-center gap-1 transition-colors"
                        title="Open live verified catalog page"
                      >
                        <span>{source.store_name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sky-400" />
                      </a>
                    </div>
                  </td>

                  {/* Condition Grade */}
                  <td className="py-3.5 px-3 text-slate-300 max-w-[150px] truncate" title={source.condition_grade}>
                    {source.condition_grade}
                  </td>

                  {/* Base Price */}
                  <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                    {formatCurrency(source.pricing.base_price, currency)}
                  </td>

                  {/* Courier & Insurance */}
                  <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                    {formatCurrency(source.pricing.shipping_insured, currency)}
                  </td>

                  {/* Est. Duty & VAT */}
                  <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                    <span title={`Duty (${source.duty_percent}%): ${formatCurrency(source.pricing.customs_duty, currency)} + VAT (${source.vat_percent}%): ${formatCurrency(source.pricing.local_vat, currency)}`}>
                      {formatCurrency(totalTaxes, currency)}
                    </span>
                  </td>

                  {/* Total Landed Cost */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-sm text-sky-300">
                    <div className="flex items-center justify-end gap-1.5">
                      {isBest && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 font-bold">
                          Best Price
                        </span>
                      )}
                      <span>{formatCurrency(source.pricing.total_landed_cost, currency)}</span>
                    </div>
                  </td>

                  {/* Clearance Type (DDP vs DDU) */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        source.clearance_type === 'DDP'
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                      }`}
                      title={
                        source.clearance_type === 'DDP'
                          ? 'Delivered Duty Paid: All taxes & duties collected at checkout'
                          : 'Delivered Duty Unpaid: Taxes collected upon arrival by local customs/courier'
                      }
                    >
                      {source.clearance_type}
                    </span>
                  </td>

                  {/* Delivery Timeline (ETA) */}
                  <td className="py-3.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                    {source.eta_business_days}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-500 border-t border-slate-800/60 font-mono">
        <div>
          * CIF = Base Item Price + Insured Freight & Transit Coverage
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> DDP (Taxes pre-paid)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> DDU (Taxes due at customs)
          </span>
        </div>
      </div>
    </div>
  );
};
