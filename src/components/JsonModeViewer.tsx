import React, { useState } from 'react';
import { Copy, Check, Download, Code2, Terminal } from 'lucide-react';
import { SourcingReport } from '../types/sourcing';

interface JsonModeViewerProps {
  report: SourcingReport;
}

export const JsonModeViewer: React.FC<JsonModeViewerProps> = ({ report }) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Conform exactly to the schema requested in the user prompt
  const schemaPayload = {
    query: {
      item: report.query.item,
      destination: report.query.destination,
      condition: report.query.condition,
      currency: report.query.currency,
    },
    market_summary: report.market_summary,
    sources: report.sources.map((s) => ({
      rank: s.rank,
      store_name: s.store_name,
      source_url: s.source_url,
      condition_grade: s.condition_grade,
      clearance_type: s.clearance_type,
      eta_business_days: s.eta_business_days,
      pricing: {
        base_price: s.pricing.base_price,
        shipping_insured: s.pricing.shipping_insured,
        customs_duty: s.pricing.customs_duty,
        local_vat: s.pricing.local_vat,
        total_landed_cost: s.pricing.total_landed_cost,
        currency: s.pricing.currency,
      },
      authenticity_guarantee: s.authenticity_guarantee,
    })),
  };

  const jsonString = JSON.stringify(schemaPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arvec_souz_landed_cost_${report.query.item.replace(/\s+/g, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              JSON Structured Mode (API Payload)
            </h3>
            <p className="text-xs text-slate-400">
              Conforms strictly to the API schema with pure structured pricing metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700 active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors active:scale-95 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Code Block with Tabular Numbers */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800/80 p-4 max-h-[500px] overflow-y-auto">
        <pre className="font-mono text-xs text-sky-300 leading-relaxed overflow-x-auto selection:bg-sky-500/30">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};
