import React, { useState } from 'react';
import { Search, ShieldCheck, Truck, Package, ArrowRight, Sparkles } from 'lucide-react';
import { SourcingOrder, Language } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';

interface PublicTrackerSectionProps {
  orders: SourcingOrder[];
  lang: Language;
  onTrackOrder: (order: SourcingOrder) => void;
}

export const PublicTrackerSection: React.FC<PublicTrackerSectionProps> = ({
  orders,
  lang,
  onTrackOrder,
}) => {
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const query = trackingInput.trim().toUpperCase();
    if (!query) return;

    const matched = orders.find(
      (o) =>
        o.id.toUpperCase() === query ||
        o.id.toUpperCase().replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
        (o.awb && o.awb.toUpperCase() === query)
    );

    if (matched) {
      onTrackOrder(matched);
      setTrackingInput('');
    } else {
      setErrorMsg(
        lang === 'ar'
          ? `لم يتم العثور على شحنة بالرقم "${query}". يرجى التأكد من رقم المرجع المستلم من المتسوق الشخصي.`
          : `No order found with reference "${query}". Please check the Order Number provided by your personal shopper.`
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Tracking Box */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl space-y-6 text-center">
        <div className="space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>arvecsouz.vercel.app · Live Concierge Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {lang === 'ar' ? 'تتبع شحنتك وطلبك الفاخر مباشرة' : 'Track Your Luxury Shipment'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {lang === 'ar'
              ? 'أدخل رقم مرجع الطلب (Order No) المزود لك من قِبل المتسوق الشخصي لمتابعة مراحل الشراء، التخليص الجمركي، وحركة الشحن لحظة بلحظة.'
              : 'Enter the Order Reference Number provided by your personal shopper to monitor boutique procurement, customs clearance, and armored courier transit.'}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTrackSubmit} className="max-w-xl mx-auto space-y-3">
          <div className="relative">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل رقم الطلب (مثال: AS-1042 أو ORD-1001)...' : 'Enter Order Reference No (e.g. AS-1042 or ORD-1001)...'}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl py-3.5 pl-4 pr-12 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {lang === 'ar' ? 'تتبع' : 'Track'}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-mono text-center animate-in fade-in duration-200">
              {errorMsg}
            </p>
          )}
        </form>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-mono text-zinc-500 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'أصالة معتمدة وفاتورة أصلية' : 'Boutique Receipt Verified'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ar' ? 'شحن دبلوماسي / بريد سريع مؤمن' : 'Armored Courier Transit'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
