import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  MapPin,
  Package,
  Users,
  TrendingUp,
  ArrowLeft,
  KeyRound,
  ExternalLink,
  Search,
  Filter,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  LogOut,
  Building2,
  Receipt,
  Truck,
  Languages,
} from 'lucide-react';
import { UserProfile, SourcingOrder, VipClient, Language, PipelineStage } from '../types/concierge';
import {
  subscribeToShoppers,
  setShopperApproval,
  subscribeToOrders,
  subscribeToClients,
  updateOrderStageInDb,
} from '../firebase/conciergeService';

interface AdminPortalPageProps {
  lang: Language;
  onToggleLang: () => void;
  onExitAdmin: () => void;
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  lang,
  onToggleLang,
  onExitAdmin,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('arvec_admin_session') === 'true';
    } catch {
      return false;
    }
  });
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Data states
  const [shoppers, setShoppers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<SourcingOrder[]>([]);
  const [clients, setClients] = useState<VipClient[]>([]);

  // Navigation tabs in Admin Portal
  const [adminTab, setAdminTab] = useState<'shoppers' | 'pipeline' | 'clients' | 'financials'>('shoppers');
  const [shopperFilter, setShopperFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Unlock Admin Session with Username and Password
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    const cleanUser = adminUsername.trim().toLowerCase();
    const cleanPass = adminPassword.trim();

    // Restricted exclusively to Mohd Marafie
    const allowedUsers = ['marafie', 'mohdmarafie', 'mohdmarafie96@gmail.com', 'admin'];
    const isUserValid = allowedUsers.includes(cleanUser);
    const isPassValid = cleanPass === 'marafie2026';

    if (isUserValid && isPassValid) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('arvec_admin_session', 'true');
      } catch {
        // ignore
      }
      setAuthError(null);
    } else {
      setAuthError(
        lang === 'ar'
          ? 'اسم المستخدم أو كلمة المرور غير صحيحة. الوصول مقيد للمشرف العام فقط.'
          : 'Access Denied: Invalid username or password. Restricted to Mohd Marafie only.'
      );
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('arvec_admin_session');
      localStorage.removeItem('arvec_admin_session');
    } catch {
      // ignore
    }
    setAdminUsername('');
    setAdminPassword('');
    setAuthError(null);
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubShoppers = subscribeToShoppers((list) => setShoppers(list));
    const unsubOrders = subscribeToOrders((list) => setOrders(list));
    const unsubClients = subscribeToClients((list) => setClients(list));

    return () => {
      unsubShoppers();
      unsubOrders();
      unsubClients();
    };
  }, [isAuthenticated]);

  // Shopper Actions
  const handleShopperStatus = async (shopperId: string, status: 'approved' | 'rejected', email?: string) => {
    setProcessingId(shopperId);
    // Optimistic instant state update
    setShoppers((prev) =>
      prev.map((s) =>
        s.userId === shopperId || (email && s.email.toLowerCase() === email.toLowerCase())
          ? { ...s, status, approvedAt: new Date().toISOString(), approvedBy: 'admin_marafie' }
          : s
      )
    );
    try {
      await setShopperApproval(shopperId, status, 'admin_marafie', email);
    } catch (err) {
      console.error('Shopper status change failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingShoppersCount = shoppers.filter((s) => s.status === 'pending_approval').length;
  const approvedShoppersCount = shoppers.filter((s) => s.status === 'approved').length;

  // Financial aggregates
  const totalVolumeKWD = orders.reduce((sum, o) => sum + (o.currency === 'KWD' ? o.totalLandedQuote : o.totalLandedQuote * 0.1), 0);
  const totalDepositsKWD = orders.reduce((sum, o) => sum + (o.currency === 'KWD' ? o.depositPaid : o.depositPaid * 0.1), 0);
  const totalReceivablesKWD = orders.reduce((sum, o) => sum + (o.currency === 'KWD' ? o.balanceDue : o.balanceDue * 0.1), 0);

  // If not authenticated, render the Secure Admin Gate
  if (!isAuthenticated) {
    return (
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-purple-500/30"
      >
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'ar' ? 'العودة للموقع الرئيسي' : 'Return to Main App'}</span>
            </button>
            <button
              onClick={onToggleLang}
              className="text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {lang === 'ar' ? 'بوابة إدارة أرفيك سوز المستقلة' : 'Arvec Souz | Executive Admin Portal'}
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              {lang === 'ar'
                ? 'وصول مقيد ومحمي · يتطلب اسم المستخدم وكلمة المرور'
                : 'Restricted Executive Access · Username & Password Required'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 font-mono leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-300 font-medium block mb-1">
                {lang === 'ar' ? 'اسم المستخدم الإداري *' : 'Admin Username *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="username"
                  value={adminUsername}
                  onChange={(e) => {
                    setAdminUsername(e.target.value);
                    setAuthError(null);
                  }}
                  required
                  placeholder={lang === 'ar' ? 'أدخل اسم المستخدم الإداري...' : 'Enter admin username...'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-white font-mono focus:outline-none focus:border-amber-500 text-sm"
                />
                <User className="w-4 h-4 text-zinc-500 absolute right-3 rtl:right-auto rtl:left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-zinc-300 font-medium block mb-1">
                {lang === 'ar' ? 'كلمة المرور الإدارية *' : 'Master Password *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAuthError(null);
                  }}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-white font-mono focus:outline-none focus:border-amber-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-3 text-zinc-500 hover:text-zinc-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !adminUsername.trim() || !adminPassword.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? (lang === 'ar' ? 'جاري التحقق...' : 'Verifying Credentials...')
                  : (lang === 'ar' ? 'تسجيل دخول المشرف العام' : 'Access Admin Command')}
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <span className="text-[10px] font-mono text-zinc-500">
              Confidential · Master Concierge Sourcing Controls
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Shoppers
  const filteredShoppers = shoppers.filter((s) => {
    if (shopperFilter === 'pending') return s.status === 'pending_approval';
    if (shopperFilter === 'approved') return s.status === 'approved';
    return true;
  });

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30"
    >
      {/* 1. Independent Admin Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">ARVEC SOUZ</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  EXECUTIVE ADMIN
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Independent Admin Desk · Mohd Marafie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'الموقع العام' : 'Public App'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-zinc-950 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
              title="Lock Admin Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Admin Metric Cards */}
      <section className="bg-zinc-900/50 border-b border-zinc-800/80 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                {lang === 'ar' ? 'طلبات قيد المراجعة' : 'Pending Shoppers'}
              </span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-white">{pendingShoppersCount}</div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {lang === 'ar' ? 'تتطلب اعتماد الإدارة' : 'Awaiting accreditation'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                {lang === 'ar' ? 'المتسوقين المعتمدين' : 'Active Shoppers'}
              </span>
              <User className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-white">{approvedShoppersCount}</div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {lang === 'ar' ? 'مراكز لندن وباريس وميلانو' : 'Licensed European shoppers'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                {lang === 'ar' ? 'إجمالي طلبات التوريد' : 'Total Orders'}
              </span>
              <Package className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-white">{orders.length}</div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {lang === 'ar' ? 'جميع المتسوقين' : 'Across all personal shoppers'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                {lang === 'ar' ? 'العملاء المسجلين' : 'VIP Patrons'}
              </span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-white">{clients.length}</div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {lang === 'ar' ? 'ملفات كبار الشخصيات' : 'Verified patron CRM profiles'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Sub-Nav / Admin Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 text-xs">
          <button
            onClick={() => setAdminTab('shoppers')}
            className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'shoppers'
                ? 'bg-purple-950/60 text-purple-200 border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'اعتماد المتسوقين' : 'Shopper Accreditation'}</span>
            {pendingShoppersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-mono text-[10px] font-black animate-pulse">
                {pendingShoppersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('pipeline')}
            className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'pipeline'
                ? 'bg-purple-950/60 text-purple-200 border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'مراقبة خط التوريد الشامل' : 'Global Procurement Pipeline'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px]">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setAdminTab('clients')}
            className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'clients'
                ? 'bg-purple-950/60 text-purple-200 border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'سجل عملاء كبار الشخصيات' : 'VIP Patrons Database'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px]">
              {clients.length}
            </span>
          </button>

          <button
            onClick={() => setAdminTab('financials')}
            className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'financials'
                ? 'bg-purple-950/60 text-purple-200 border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الرقابة المالية والتحصيلات' : 'Financials & Receivables'}</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-7 space-y-6">
        
        {/* TAB 1: SHOPPER ACCREDITATION & APPROVALS */}
        {adminTab === 'shoppers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShopperFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    shopperFilter === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'طلبات بانتظار الاعتماد' : 'Pending Verification'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-mono text-[10px] font-black">
                    {pendingShoppersCount}
                  </span>
                </button>

                <button
                  onClick={() => setShopperFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    shopperFilter === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'المعتمدين' : 'Approved'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-200 font-mono text-[10px]">
                    {approvedShoppersCount}
                  </span>
                </button>

                <button
                  onClick={() => setShopperFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    shopperFilter === 'all'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{lang === 'ar' ? 'الكل' : 'All'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                    {shoppers.length}
                  </span>
                </button>
              </div>

              <span className="text-xs text-zinc-400 font-mono">
                {lang === 'ar' ? 'المتسوق المعتمد فقط يمكنه إنشاء طلبات وتتبع رسمي' : 'Only approved personal shoppers can generate valid quotes'}
              </span>
            </div>

            {filteredShoppers.length === 0 ? (
              <div className="py-16 text-center space-y-2 bg-zinc-900/40 rounded-3xl border border-zinc-800/80">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  {shopperFilter === 'pending'
                    ? (lang === 'ar' ? 'لا توجد طلبات متسوقين معلقة حالياً' : 'No personal shoppers currently awaiting approval.')
                    : (lang === 'ar' ? 'لا توجد حسابات مسجلة في هذا القسم' : 'No personal shopper accounts in this view.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredShoppers.map((shopper) => {
                  const isPending = shopper.status === 'pending_approval';
                  const isApproved = shopper.status === 'approved';

                  return (
                    <div
                      key={shopper.userId}
                      className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      <div className="space-y-2.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h4 className="text-base font-bold text-white">{shopper.displayName}</h4>
                          <span
                            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {shopper.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
                          <span>{shopper.email}</span>
                          {shopper.phone && (
                            <span className="flex items-center gap-1 text-zinc-300">
                              <Phone className="w-3 h-3 text-amber-400" />
                              {shopper.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {shopper.hubCity || 'Europe'}
                          </span>
                        </div>

                        <div className="text-xs text-amber-200/90 font-medium">
                          {shopper.specialization || 'Luxury Goods & High Horology'}
                        </div>

                        {shopper.experience && (
                          <p className="text-xs text-zinc-400 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 leading-relaxed font-mono">
                            "{shopper.experience}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleShopperStatus(shopper.userId, 'approved', shopper.email)}
                              disabled={processingId === shopper.userId}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-600/20 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{lang === 'ar' ? 'اعتماد المتسوق' : 'Approve Shopper'}</span>
                            </button>

                            <button
                              onClick={() => handleShopperStatus(shopper.userId, 'rejected', shopper.email)}
                              disabled={processingId === shopper.userId}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-red-950 text-zinc-400 hover:text-red-400 text-xs font-semibold border border-zinc-800 transition-all cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                            </button>
                          </>
                        ) : isApproved ? (
                          <button
                            onClick={() => handleShopperStatus(shopper.userId, 'rejected', shopper.email)}
                            disabled={processingId === shopper.userId}
                            className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-red-950 text-xs font-mono text-zinc-400 hover:text-red-400 border border-zinc-800 transition-all cursor-pointer"
                          >
                            {lang === 'ar' ? 'إلغاء الاعتماد' : 'Revoke Access'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleShopperStatus(shopper.userId, 'approved', shopper.email)}
                            disabled={processingId === shopper.userId}
                            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                          >
                            {lang === 'ar' ? 'إعادة الاعتماد' : 'Re-Approve'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GLOBAL PROCUREMENT PIPELINE CONTROL */}
        {adminTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{lang === 'ar' ? 'جميع طلبات التوريد المسجلة في النظام:' : 'All Active Sourcing Jobs across the system:'}</span>
              <span className="font-mono text-amber-300">{orders.length} Active Jobs</span>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center space-y-2 bg-zinc-900/40 rounded-3xl border border-zinc-800/80">
                <Package className="w-8 h-8 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400 font-mono">
                  {lang === 'ar' ? 'لا توجد طلبات توريد مسجلة حالياً' : 'No procurement orders in the system.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono text-amber-300">{ord.id}</span>
                        <span className="text-xs font-bold text-white truncate">{ord.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {ord.brand}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                        <span>Shopper: <strong>{ord.shopperName}</strong></span>
                        <span>·</span>
                        <span>Client: <strong>{ord.clientName}</strong></span>
                        <span>·</span>
                        <span>AWB: {ord.awb}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-zinc-400">Landed Quote: <strong className="text-amber-300">{ord.currency} {ord.totalLandedQuote.toLocaleString()}</strong></span>
                        <span>·</span>
                        <span className="text-zinc-400">Balance Due: <strong className="text-emerald-400">{ord.currency} {ord.balanceDue.toLocaleString()}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <select
                        value={ord.stage}
                        onChange={(e) => updateOrderStageInDb(ord.id, e.target.value as PipelineStage)}
                        className="bg-zinc-950 border border-zinc-750 text-xs font-semibold text-amber-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Request Logged">Request Logged</option>
                        <option value="Boutique Sourced">Boutique Sourced</option>
                        <option value="Deposit Received">Deposit Received</option>
                        <option value="Acquired & Packed">Acquired & Packed</option>
                        <option value="International Courier">International Courier</option>
                        <option value="Cleared Customs">Cleared Customs</option>
                        <option value="Delivered & Settled">Delivered & Settled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VIP PATRONS DATABASE */}
        {adminTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{lang === 'ar' ? 'سجل عملاء كبار الشخصيات ومقاساتهم الدقيقة:' : 'VIP Patrons Sizing and Profiling Database:'}</span>
              <span className="font-mono text-amber-300">{clients.length} Patrons</span>
            </div>

            {clients.length === 0 ? (
              <div className="py-16 text-center space-y-2 bg-zinc-900/40 rounded-3xl border border-zinc-800/80">
                <Users className="w-8 h-8 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400 font-mono">
                  {lang === 'ar' ? 'لا يوجد عملاء مسجلين حالياً' : 'No VIP clients enrolled in the system.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {c.city}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[9px]">EU Shoe</span>
                        <span className="text-white font-bold">{c.shoeSize || '—'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px]">Ring</span>
                        <span className="text-white font-bold">{c.ringSize || '—'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px]">RTW</span>
                        <span className="text-white font-bold">{c.rtwSize || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FINANCIALS & RECEIVABLES */}
        {adminTab === 'financials' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-xs font-mono text-zinc-400 block uppercase">
                  {lang === 'ar' ? 'إجمالي حجم التوريد المقدر' : 'Gross Sourced Volume'}
                </span>
                <div className="text-2xl font-black font-mono text-white">
                  KWD {Math.round(totalVolumeKWD).toLocaleString()}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-emerald-500/20 space-y-1">
                <span className="text-xs font-mono text-emerald-400 block uppercase">
                  {lang === 'ar' ? 'العربين المحصلة مسبقاً' : 'Deposits In-Hand'}
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  KWD {Math.round(totalDepositsKWD).toLocaleString()}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/20 space-y-1">
                <span className="text-xs font-mono text-amber-300 block uppercase">
                  {lang === 'ar' ? 'المتبقي عند التسليم' : 'Receivables Upon Delivery'}
                </span>
                <div className="text-2xl font-black font-mono text-amber-300">
                  KWD {Math.round(totalReceivablesKWD).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs text-zinc-400">
              <h4 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'بروتوكول الرقابة المالية وإصدار الفواتير' : 'Financial Governance & Audit Protocol'}
              </h4>
              <p className="leading-relaxed font-mono">
                {lang === 'ar'
                  ? 'يتم تحصيل جميع العربين عبر الحسابات البنكية المعتمدة لأرفيك سوز قبل بدء عملية الشراء في بوتيكات باريس ولندن، مع مطابقة فواتير الشراء الرسمية وتوثيق الدفعات المتبقية عند التسليم النهائي.'
                  : 'All procurement retainers and boutique purchases are audited against verified store invoices. Final balances are settled directly via diplomatic armored courier upon door-to-door handoff.'}
              </p>
            </div>
          </div>
        )}

      </main>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 py-4 px-6 text-center text-xs font-mono text-zinc-500">
        Arvec Souz © 2026 · Private Concierge Executive Administration Desk
      </footer>
    </div>
  );
};
