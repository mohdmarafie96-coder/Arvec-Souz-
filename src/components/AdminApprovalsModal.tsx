import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, Clock, User, Phone, MapPin, Sparkles } from 'lucide-react';
import { UserProfile, Language } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';
import { fetchAllShoppers, setShopperApproval } from '../firebase/conciergeService';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!isOpen) return;
    loadShoppers();
  }, [isOpen]);

  const loadShoppers = async () => {
    setIsLoading(true);
    const data = await fetchAllShoppers();
    setShoppers(data);
    setIsLoading(false);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.admin.title}</h3>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-xs font-mono">Loading personal shopper applications...</span>
            </div>
          ) : shoppers.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              {t.admin.noPending}
            </div>
          ) : (
            <div className="space-y-3">
              {shoppers.map((shopper) => {
                const isPending = shopper.status === 'pending_approval';
                const isApproved = shopper.status === 'approved';

                return (
                  <div
                    key={shopper.userId}
                    className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {shopper.photoURL ? (
                        <img
                          src={shopper.photoURL}
                          alt={shopper.displayName}
                          className="w-10 h-10 rounded-xl object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{shopper.displayName}</h4>
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
                        <p className="text-xs text-zinc-400 font-mono">{shopper.email}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {shopper.hubCity || 'Europe Hub'}
                          </span>
                          <span>·</span>
                          <span>{shopper.specialization || 'General Luxury'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(shopper.userId, 'approved')}
                            disabled={processingId === shopper.userId}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.admin.approveBtn}</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(shopper.userId, 'rejected')}
                            disabled={processingId === shopper.userId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t.admin.rejectBtn}</span>
                          </button>
                        </>
                      )}
                      {isApproved && shopper.role !== 'admin' && (
                        <button
                          onClick={() => handleUpdateStatus(shopper.userId, 'rejected')}
                          disabled={processingId === shopper.userId}
                          className="text-[11px] font-mono text-zinc-500 hover:text-red-400 underline"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Security Guard: Only approved personal shoppers can issue quotes</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
