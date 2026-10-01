import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, Clock, User, Phone, MapPin, Sparkles, Building2, Briefcase } from 'lucide-react';
import { UserProfile, Language } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';
import { subscribeToShoppers, setShopperApproval } from '../firebase/conciergeService';

interface AdminApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentAdminUid: string;
}

export const AdminApprovalsModal: React.FC<AdminApprovalsModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentAdminUid,
}) => {
  const [shoppers, setShoppers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToShoppers((liveShoppers) => {
      setShoppers(liveShoppers);
    });
    return () => unsub();
  }, [isOpen]);

  const handleUpdateStatus = async (shopperId: string, status: 'approved' | 'rejected') => {
    setProcessingId(shopperId);
    try {
      await setShopperApproval(shopperId, status, currentAdminUid);
      setShoppers((prev) =>
        prev.map((s) => (s.userId === shopperId ? { ...s, status } : s))
      );
    } catch (err) {
      console.error('Update status failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const pendingCount = shoppers.filter((s) => s.status === 'pending_approval').length;
  const approvedCount = shoppers.filter((s) => s.status === 'approved').length;

  const filteredShoppers = shoppers.filter((s) => {
    if (filter === 'pending') return s.status === 'pending_approval';
    if (filter === 'approved') return s.status === 'approved';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{t.admin.title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-zinc-400">{t.admin.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="px-6 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 flex items-center gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'طلبات قيد المراجعة' : 'Pending Verification'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-mono font-bold">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filter === 'approved'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'المتسوقين المعتمدين' : 'Approved Shoppers'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-mono font-bold">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>{lang === 'ar' ? 'الكل' : 'All Applicants'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono">
              {shoppers.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredShoppers.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {filter === 'pending'
                  ? (lang === 'ar' ? 'لا توجد طلبات متسوقين معلقة حالياً' : 'No personal shoppers currently awaiting approval.')
                  : (lang === 'ar' ? 'لا توجد حسابات متسوقين مسجلة' : 'No shopper accounts found in this view.')}
              </p>
            </div>
          ) : (
            filteredShoppers.map((shopper) => {
              const isPending = shopper.status === 'pending_approval';
              const isApproved = shopper.status === 'approved';
              const isRejected = shopper.status === 'rejected';

              return (
                <div
                  key={shopper.userId}
                  className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-zinc-700"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{shopper.displayName}</h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {isApproved
                          ? t.shopperStatusApproved
                          : isPending
                          ? t.shopperStatusPending
                          : t.shopperStatusRejected}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono">
                      <span>{shopper.email}</span>
                      {shopper.phone && (
                        <span className="flex items-center gap-1 text-zinc-300">
                          <Phone className="w-3 h-3 text-amber-400" />
                          {shopper.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono pt-0.5">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <strong>{shopper.hubCity || 'European Hub'}</strong>
                      </span>
                      <span>·</span>
                      <span className="text-amber-200/90 font-medium">
                        {shopper.specialization || 'Luxury Goods'}
                      </span>
                    </div>

                    {shopper.experience && (
                      <p className="text-[11px] text-zinc-500 italic bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                        "{shopper.experience}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(shopper.userId, 'approved')}
                          disabled={processingId === shopper.userId}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'اعتماد المتسوق' : 'Approve Shopper'}</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(shopper.userId, 'rejected')}
                          disabled={processingId === shopper.userId}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 text-xs font-semibold border border-zinc-800 transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                        </button>
                      </>
                    ) : isApproved ? (
                      <button
                        onClick={() => handleUpdateStatus(shopper.userId, 'rejected')}
                        disabled={processingId === shopper.userId}
                        className="text-xs font-mono text-zinc-500 hover:text-red-400 underline py-1 px-2"
                      >
                        {lang === 'ar' ? 'إلغاء الاعتماد' : 'Revoke Access'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(shopper.userId, 'approved')}
                        disabled={processingId === shopper.userId}
                        className="text-xs font-mono text-amber-300 hover:underline py-1 px-2"
                      >
                        {lang === 'ar' ? 'إعادة الاعتماد' : 'Re-Approve'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>{lang === 'ar' ? 'مكتب التوثيق: يُسمح فقط للمتسوقين المعتمدين بإصدار عروض التوريد' : 'Accreditation Guard: Only approved personal shoppers can issue quotes'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
