import React, { useState } from 'react';
import { ExternalLink, Copy, Check, TrendingUp, ShieldCheck, Clock, Award } from 'lucide-react';
import { SourcingReport } from '../types/sourcing';
import { formatCurrency } from '../utils/destinationsAndCurrencies';

interface ExecutiveSummaryTableProps {
  report: SourcingReport;
  onSelectSource?: (rank: number) => void;
}

export const ExecutiveSummaryTable: React.FC<ExecutiveSummaryTableProps> = ({
  report,
  onSelectSource,
}) => {
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);
  const currency = report.query.currency;

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
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                1. Executive Summary & Market Comparison
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {report.query.item} · {report.query.condition} · Destination: {report.query.destination}
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700 active:scale-95 cursor-pointer"
            title="Copy as Markdown table"
          >
            {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMarkdown ? 'Table Copied!' : 'Copy Markdown Table'}</span>
          </button>
        </div>

        {/* 2-Sentence Market Status Summary (Prompt Requirement) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {report.market_summary}
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
            {report.sources.map((source, index) => {
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
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-slate-100 hover:text-sky-400 flex items-center gap-1 transition-colors"
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
                          Best Landed
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
