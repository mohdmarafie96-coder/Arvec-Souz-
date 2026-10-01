import React, { useState } from 'react';
import { Search, Eye, Trash2, ShieldCheck, ArrowRight, PackageOpen } from 'lucide-react';
import { SourcingOrder, Language, PipelineStage } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';
import { updateOrderStageInDb, deleteOrderFromDb } from '../firebase/conciergeService';

interface PipelineTabProps {
  orders: SourcingOrder[];
  lang: Language;
  onPreviewOrder: (order: SourcingOrder) => void;
  canManage: boolean;
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

export const PipelineTab: React.FC<PipelineTabProps> = ({
  orders,
  lang,
  onPreviewOrder,
  canManage,
}) => {
  const [search, setSearch] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  const t = TRANSLATIONS[lang];

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    const matchSearch =
      o.title.toLowerCase().includes(term) ||
      o.clientName.toLowerCase().includes(term) ||
      o.brand.toLowerCase().includes(term) ||
      o.id.toLowerCase().includes(term);
    const matchStage = stageFilter === 'ALL' || o.stage === stageFilter;
    const matchBrand = brandFilter === 'ALL' || o.brand === brandFilter;
    return matchSearch && matchStage && matchBrand;
  });

  const handleStageChange = async (orderId: string, stage: PipelineStage) => {
    if (!canManage) return;
    try {
      await updateOrderStageInDb(orderId, stage);
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!canManage) return;
    if (confirm(`Delete sourcing record ${orderId}?`)) {
      try {
        await deleteOrderFromDb(orderId);
      } catch (err) {
        console.error('Failed to delete order:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'البحث بالقطعة أو العميل...' : 'Search item, brand, or client...'}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">{lang === 'ar' ? 'جميع المراحل (٧)' : 'All Stages (7)'}</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {t.stages[s]}
              </option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">{lang === 'ar' ? 'جميع الدور الفاخرة' : 'All Luxury Houses'}</option>
            <option value="Hermès">Hermès</option>
            <option value="Chanel">Chanel</option>
            <option value="Goyard">Goyard</option>
            <option value="Rolex">Rolex</option>
            <option value="Loro Piana">Loro Piana</option>
            <option value="Patek Philippe">Patek Philippe</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{lang === 'ar' ? 'مكتب التخليص المعتمد' : 'Verified Clearing Desk'}</span>
        </div>
      </div>

      {/* Grid */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-slate-200">
              {lang === 'ar' ? 'لا توجد طلبات توريد حالياً' : 'No Sourcing Jobs Yet'}
            </h4>
            <p className="text-xs text-zinc-400">{t.emptyPipeline}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const stageIdx = STAGES.indexOf(order.stage);

            return (
              <div
                key={order.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-200 font-bold">
                        {order.id}
                      </span>
                      <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 font-mono">
                        {order.brand}
                      </span>
                    </div>
                    {order.boutiqueReceiptVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Receipt Verified
                      </span>
                    )}
                  </div>

                  {/* Title & image */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={order.image}
                      alt={order.title}
                      className="w-16 h-16 rounded-2xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                    <div className="space-y-0.5 min-w-0">
                      <h4
                        className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors truncate"
                        title={order.title}
                      >
                        {order.title}
                      </h4>
                      <p className="text-xs text-zinc-400 font-medium">{order.size}</p>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono pt-0.5">
                        <span className="text-zinc-500">VIP:</span>
                        <span className="text-zinc-200 font-semibold truncate">{order.clientName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                    <span className="truncate">{order.sourcingCity.split('/')[0]}</span>
                    <span className="text-amber-400">✈</span>
                    <span className="truncate text-zinc-300 font-semibold">{order.destinationCity.split(',')[0]}</span>
                  </div>

                  {/* Stage Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-mono uppercase block">
                      Phase ({stageIdx + 1}/7)
                    </label>
                    <select
                      value={order.stage}
                      onChange={(e) => handleStageChange(order.id, e.target.value as PipelineStage)}
                      disabled={!canManage}
                      className="w-full bg-zinc-950 border border-zinc-800 text-xs font-semibold rounded-xl py-2 px-3 text-zinc-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-60"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {t.stages[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Financial and actions */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Landed Quote</span>
                      <span className="text-white font-bold">
                        {order.currency} {Number(order.totalLandedQuote).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Remaining Due</span>
                      <span
                        className={`font-bold ${
                          order.balanceDue > 0 ? 'text-amber-300' : 'text-emerald-400'
                        }`}
                      >
                        {order.currency} {Number(order.balanceDue).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => onPreviewOrder(order)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>{lang === 'ar' ? 'معاينة العميل' : 'Client View'}</span>
                    </button>

                    {canManage && (
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-950 border border-transparent hover:border-zinc-800 transition-colors"
                        title="Delete job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
