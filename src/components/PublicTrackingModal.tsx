import React from 'react';
import { X, ShieldCheck, ExternalLink, PackageCheck, Truck, Check, Sparkles } from 'lucide-react';
import { SourcingOrder, Language, PipelineStage } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';

interface PublicTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SourcingOrder | null;
  lang: Language;
}

const STAGES: PipelineStage[] = [
  'Request Logged',
  'Boutique Sourced',
  'Deposit Received',
  'Acquired & Packed',
  'International Courier',
  'Cleared Customs',
  'Delivered & Settled',
];

export const PublicTrackingModal: React.FC<PublicTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  lang,
}) => {
  if (!isOpen || !order) return null;
  const t = TRANSLATIONS[lang];
  const currentStageIdx = STAGES.indexOf(order.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-300">
              {t.appTitle} CONCIERGE
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-zinc-400">Order: {order.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Stage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{order.title}</h2>
            <span className="text-xs text-zinc-400 font-medium block">
              {order.brand} · {order.size}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              {t.tracking.dispatchStatus}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 border border-amber-500/30 text-xs font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t.stages[order.stage]}
            </span>
          </div>
        </div>

        {/* Product Image & Logistics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-5">
            <img
              src={order.image}
              alt={order.title}
              className="w-full h-56 rounded-2xl object-cover border border-zinc-800 bg-zinc-950 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>

          <div className="sm:col-span-7 space-y-3.5 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">{t.tracking.origin}:</span>
                <span className="text-white font-bold">{order.sourcingCity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{t.tracking.destination}:</span>
                <span className="text-white font-bold">{order.destinationCity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{t.tracking.awb}:</span>
                <span className="text-amber-300 font-bold font-mono">{order.awb || 'Allocated Upon Transit'}</span>
              </div>
            </div>

            {/* Confidential Public Pricing View (Cost & Margin are HIDDEN) */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">{t.tracking.totalQuote}:</span>
                <span className="text-white font-bold">
                  {order.currency} {Number(order.totalLandedQuote).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{t.tracking.depositPaid}:</span>
                <span className="text-emerald-400 font-bold">
                  {order.currency} {Number(order.depositPaid).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-800">
                <span className="text-zinc-300 font-semibold">{t.tracking.balanceOnDelivery}:</span>
                <span className="text-sm font-bold text-amber-200">
                  {order.currency} {Number(order.balanceDue).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Luxury Journey Timeline */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            {t.tracking.timeline}
          </h4>
          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
            {STAGES.map((stg, idx) => {
              const isPassed = idx <= currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={stg} className="relative flex items-center justify-between">
                  <span
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-amber-400 text-zinc-950 ring-4 ring-amber-500/20'
                        : isPassed
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-600'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-amber-200' : isPassed ? 'text-zinc-200' : 'text-zinc-500'
                    }`}
                  >
                    {t.stages[stg]}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isCurrent
                        ? 'text-amber-300 font-bold'
                        : isPassed
                        ? 'text-zinc-500'
                        : 'text-zinc-600'
                    }`}
                  >
                    {isCurrent ? 'In Progress' : isPassed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>{t.reliableSourcing}</span>
          <a
            href={`https://wa.me/96599887766?text=Inquiry%20regarding%20${encodeURIComponent(order.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 hover:underline flex items-center gap-1"
          >
            <span>{t.tracking.whatsappConcierge}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
