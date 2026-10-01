import React from 'react';
import { LogIn, LogOut, User, ShieldCheck, Clock, Languages, Plus, UserPlus, ShieldAlert } from 'lucide-react';
import { Language, UserProfile, SourcingOrder } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';
import { ArvecLogo } from './ArvecLogo';

interface HeaderNavProps {
  lang: Language;
  onToggleLang: () => void;
  user: any;
  userProfile: UserProfile | null;
  orders: SourcingOrder[];
  pendingShoppersCount: number;
  onOpenNewOrder: () => void;
  onOpenNewClient: () => void;
  onOpenPublicTracker: () => void;
  onOpenShopperRegister: () => void;
  onOpenShopperSignIn: () => void;
  onLogout: () => void;
  canManage: boolean;
  onSecretAdminAccess?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  lang,
  onToggleLang,
  user,
  userProfile,
  orders,
  pendingShoppersCount,
  onOpenNewOrder,
  onOpenNewClient,
  onOpenPublicTracker,
  onOpenShopperRegister,
  onOpenShopperSignIn,
  onLogout,
  canManage,
  onSecretAdminAccess,
}) => {
  const [logoClicks, setLogoClicks] = React.useState<number>(0);

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        if (onSecretAdminAccess) onSecretAdminAccess();
        return 0;
      }
      return next;
    });
    setTimeout(() => setLogoClicks(0), 1800);
  };
  const t = TRANSLATIONS[lang];
  const activeOrders = orders.filter((o) => o.stage !== 'Delivered & Settled');

  // Approximate metrics calculation
  let totalVolume = 0;
  let pendingBalance = 0;
  orders.forEach((o) => {
    let factor = 1;
    if (o.currency === 'SAR' || o.currency === 'AED' || o.currency === 'QAR') factor = 0.082;
    totalVolume += o.totalLandedQuote * factor;
    pendingBalance += o.balanceDue * factor;
  });

  const isAdmin = userProfile?.role === 'admin';
  const isApproved = userProfile?.status === 'approved' || isAdmin;
  const isPending = user && !isApproved;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none active:opacity-90 transition-opacity"
          title="Arvec Souz Luxury Concierge"
        >
          <ArvecLogo size="md" showSubtitle={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-widest uppercase text-white">
                {t.appTitle}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold">
                OS
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono tracking-tight block">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Quick Metrics Ribbon (Desktop) */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono border-x border-zinc-800/80 px-6 py-1">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase block">{t.activePipeline}</span>
            <span className="font-bold text-amber-200 text-sm">
              {activeOrders.length} {t.orders}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase block">{t.totalVolume}</span>
            <span className="font-bold text-zinc-200 text-sm">
              KD {Math.round(totalVolume).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase block">{t.pendingBalance}</span>
            <span className="font-bold text-emerald-400 text-sm">
              KD {Math.round(pendingBalance).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions, Language Switcher, and Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Public Track Order Button */}
          <button
            onClick={onOpenPublicTracker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/30 hover:border-amber-500/60 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-sm"
            title="Public Order Tracking Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ar' ? 'تتبع طلبك' : 'Track Order'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Arabic / English"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-sans font-bold">{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Apply or Sign In as Personal Shopper */}
          {!userProfile && (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenShopperRegister}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-zinc-300 hover:text-amber-300 transition-all cursor-pointer"
                title="Apply as Personal Shopper"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'ar' ? 'تسجيل متسوق' : 'Join as Shopper'}</span>
              </button>

              <button
                onClick={onOpenShopperSignIn}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                title="Sign in with Email and Password"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'دخول المتسوق' : 'Shopper Sign In'}</span>
              </button>
            </div>
          )}

          {/* New Job and New Client (if allowed) */}
          {canManage && (
            <>
              <button
                onClick={onOpenNewOrder}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.newJobBtn}</span>
              </button>
              <button
                onClick={onOpenNewClient}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.newClientBtn}</span>
              </button>
            </>
          )}

          {/* Auth State (Personal Shopper Session) */}
          {userProfile && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800"
                title={`Signed in as ${userProfile.displayName} (${userProfile.hubCity || 'Shopper'})`}
              >
                <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-zinc-200 max-w-[80px] truncate hidden sm:inline">
                  {userProfile.displayName}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isApproved ? 'APPROVED' : 'PENDING'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                title={t.signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
