import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, MessageSquare, ExternalLink, X, ShieldCheck, Share2 } from 'lucide-react';
import { SourcingOrder, Language } from '../types/concierge';

interface OrderCreatedSuccessModalProps {
  order: SourcingOrder | null;
  onClose: () => void;
  lang: Language;
}

export const OrderCreatedSuccessModal: React.FC<OrderCreatedSuccessModalProps> = ({
  order,
  onClose,
  lang,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!order) return null;

  // Professional Client Dispatch Message Templates
  const englishMessage = `🏛 ARVEC SOUZ | PRIVATE CONCIERGE PROCUREMENT
Europe ⇄ GCC Verified Luxury Desk

Dear ${order.clientName},
Your luxury procurement order for ${order.title} (${order.brand}) has been registered on our London/Paris sourcing desk.

📦 Order Reference: ${order.id}
🔗 Track Your Order Live: https://arvecsouz.vercel.app

To track your shipment and real-time courier milestones, visit the portal above and enter your Order Reference No: ${order.id}.

• Current Stage: ${order.stage}
• Sourcing Hub: ${order.sourcingCity}
• Remaining Balance Due Upon Delivery: ${order.currency} ${Number(order.balanceDue).toLocaleString()}
• Authenticity Protocol: 100% Guaranteed with Original Boutique Invoice

Arvec Souz Luxury Concierge Desk`;

  const arabicMessage = `🏛 أرفيك سوز | مكتب الكونسيرج الخاص
التوريد الفاخر المعتمد · أوروبا ⇄ الخليج العربي

سعادة ${order.clientName} المحترم/ة،
تم تسجيل وتوثيق طلب التوريد الخاص بكم لقطعة ${order.title} من دار ${order.brand} عبر مكتب التوريد المعتمد لدينا في أوروبا.

📦 رقم مرجع الشحنة: ${order.id}
🔗 رابط التتبع المباشر: https://arvecsouz.vercel.app

لتتبع خط سير الشحنة ومراحل التخليص الجمركي لحظة بلحظة، يرجى زيارة الرابط أعلاه وإدخال رقم المرجع الخاص بكم: ${order.id}.

• المرحلة الحالية: ${order.stage}
• مركز التوريد: ${order.sourcingCity}
• المبلغ المتبقي عند الاستلام: ${order.currency} ${Number(order.balanceDue).toLocaleString()}
• ضمان الأصالة: موثق ١٠٠٪ مع فاتورة البوتيك الأصلية

أرفيك سوز · مكتب كونسيرج التوريد الفاخر`;

  const activeMessage = lang === 'ar' ? arabicMessage : englishMessage;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(activeMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {lang === 'ar' ? 'تم إنشاء رقم التتبع بنجاح' : 'Order Reference & Tracking Generated'}
              </h3>
              <p className="text-xs text-zinc-400">
                {lang === 'ar' ? 'إشعار تتبع رسمي مخصص لإرساله للعميل المميز' : 'Official VIP client tracking notice ready for dispatch'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generated Order Reference Highlight Box */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              {lang === 'ar' ? 'رقم مرجع الشحنة والتتبع المعتمد' : 'Generated Order Tracking Reference'}
            </span>
            <span className="text-2xl font-black font-mono text-amber-300">{order.id}</span>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 border border-amber-500/20 font-bold">
            arvecsouz.vercel.app
          </span>
        </div>

        {/* Formatted Message Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{lang === 'ar' ? 'نص إشعار العميل المهني:' : 'Executive Client Message Preview:'}</span>
            <span className="text-[11px] font-mono text-amber-400">
              {lang === 'ar' ? 'صيغة واتساب رسمية' : 'Formal Concierge Format'}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto selection:bg-amber-500/30">
            {activeMessage}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied to Clipboard!') : (lang === 'ar' ? 'نسخ إشعار العميل' : 'Copy VIP Notice')}</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إرسال عبر واتساب للعميل' : 'Send via WhatsApp'}</span>
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 hover:text-white"
          >
            {lang === 'ar' ? 'إغلاق ومتابعة' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
