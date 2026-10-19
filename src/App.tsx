import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { PipelineTab } from './components/PipelineTab';
import { ClientsTab } from './components/ClientsTab';
import { CalculatorTab } from './components/CalculatorTab';
import { PublicTrackerSection } from './components/PublicTrackerSection';
import { NewOrderModal } from './components/NewOrderModal';
import { NewClientModal } from './components/NewClientModal';
import { ShopperRegisterModal } from './components/ShopperRegisterModal';
import { ShopperSignInModal } from './components/ShopperSignInModal';
import { AdminPortalPage } from './components/AdminPortalPage';
import { OrderCreatedSuccessModal } from './components/OrderCreatedSuccessModal';
import { PublicTrackingModal } from './components/PublicTrackingModal';
import {
  SourcingOrder,
  VipClient,
  Language,
  UserProfile,
  PipelineStage,
} from './types/concierge';
import {
  subscribeToOrders,
  subscribeToClients,
  subscribeToShoppers,
  saveSourcingOrder,
  saveVipClient,
  syncUserProfile,
} from './firebase/conciergeService';
import { useAuth } from './firebase/authContext';
import { TRANSLATIONS } from './utils/translations';
import {
  Package,
  Calculator,
  Users,
  Truck,
  Plus,
  UserPlus,
  Sparkles,
  TrendingUp,
  MapPin,
  Compass,
} from 'lucide-react';

type TabView = 'pipeline' | 'calculator' | 'clients' | 'tracking';

export function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<TabView>('pipeline');
  const [currentPage, setCurrentPage] = useState<'main' | 'admin'>('main');

  // Auth Context
  const { user, profile: authProfile, logout: authLogout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Data Collections
  const [orders, setOrders] = useState<SourcingOrder[]>([]);
  const [clients, setClients] = useState<VipClient[]>([]);
  const [shoppers, setShoppers] = useState<UserProfile[]>([]);

  // Modals
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isShopperRegisterOpen, setIsShopperRegisterOpen] = useState(false);
  const [isShopperSignInOpen, setIsShopperSignInOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<SourcingOrder | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<SourcingOrder | null>(null);

  // Quote transfer from calculator
  const [quoteTransferData, setQuoteTransferData] = useState<{
    retail: number;
    totalQuote: number;
    deposit: number;
    currency: string;
  } | null>(null);

  const [selectedClientIdForOrder, setSelectedClientIdForOrder] = useState<string | null>(null);

  // 1. Route listener for /adminmarafie
  useEffect(() => {
    const checkRoute = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        if (path === '/adminmarafie' || hash === '#adminmarafie' || path.includes('adminmarafie')) {
          setCurrentPage('admin');
        } else {
          setCurrentPage('main');
        }
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  // 2. Profile resolution: authProfile or active shopper in localStorage
  useEffect(() => {
    if (authProfile) {
      setUserProfile({
        userId: authProfile.userId,
        email: authProfile.email,
        displayName: authProfile.displayName,
        photoURL: authProfile.photoURL,
        role: authProfile.role,
        status: authProfile.status,
        hubCity: authProfile.hubCity,
        createdAt: new Date().toISOString(),
      });
    } else {
      try {
        const stored = localStorage.getItem('arvec_active_shopper');
        if (stored) {
          setUserProfile(JSON.parse(stored));
        } else {
          setUserProfile(null);
        }
      } catch {
        setUserProfile(null);
      }
    }
  }, [authProfile]);

  // 3. Live Firestore Subscriptions
  useEffect(() => {
    const unsubOrders = subscribeToOrders((list) => setOrders(list));
    const unsubClients = subscribeToClients((list) => setClients(list));
    const unsubShoppers = subscribeToShoppers((list) => setShoppers(list));

    return () => {
      unsubOrders();
      unsubClients();
      unsubShoppers();
    };
  }, []);

  // Handlers
  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('arvec_active_shopper');
    } catch {
      // ignore
    }
    setUserProfile(null);
    await authLogout();
  };

  const handleCreateOrder = async (orderData: Partial<SourcingOrder>) => {
    const newId = `ARV-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullOrder: SourcingOrder = {
      id: newId,
      shopperId: userProfile?.userId || 'shopper_marafie',
      shopperName: userProfile?.displayName || 'Arvec Personal Shopper',
      clientId: orderData.clientId || 'client_vip',
      clientName: orderData.clientName || 'VIP Client',
      brand: orderData.brand || 'Hermès',
      title: orderData.title || 'Birkin 25 Togo Noir GHW',
      size: orderData.size || 'Size 25',
      image: orderData.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
      sourcingCity: orderData.sourcingCity || 'Paris (Rue du Faubourg)',
      destinationCity: orderData.destinationCity || 'Kuwait City',
      stage: (orderData.stage as PipelineStage) || 'Request Logged',
      retailTagPrice: orderData.retailTagPrice || 8500,
      sourceCurrency: orderData.sourceCurrency || 'EUR',
      exchangeRate: orderData.exchangeRate || 0.334,
      convertedRetail: orderData.convertedRetail || 2839,
      customsDuty: orderData.customsDuty || 142,
      shipping: orderData.shipping || 85,
      commission: orderData.commission || 425,
      totalLandedQuote: orderData.totalLandedQuote || 3491,
      depositPaid: orderData.depositPaid || 1750,
      balanceDue: orderData.balanceDue || 1741,
      currency: orderData.currency || 'KWD',
      awb: orderData.awb || `DHL-${Math.floor(100000000 + Math.random() * 900000000)}`,
      verifiedSource: true,
      boutiqueReceiptVerified: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveSourcingOrder(fullOrder);
      setCreatedOrder(fullOrder);
      setIsNewOrderOpen(false);
      setQuoteTransferData(null);
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  };

  const handleCreateClient = async (clientData: Partial<VipClient>) => {
    const newClient: VipClient = {
      id: `client_${Date.now()}`,
      createdBy: userProfile?.userId || 'admin',
      name: clientData.name || 'Sheikha Al-Sabah',
      phone: clientData.phone || '+965 9988 7766',
      city: clientData.city || 'Kuwait City',
      shoeSize: clientData.shoeSize || 'EU 38.5',
      ringSize: clientData.ringSize || '52 / 6',
      rtwSize: clientData.rtwSize || 'FR 36 / S',
      currency: clientData.currency || 'KWD',
      totalOrders: 0,
      lifetimeSpend: '0 KWD',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveVipClient(newClient);
      setIsNewClientOpen(false);
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  const pendingShoppersCount = shoppers.filter((s) => s.status === 'pending_approval').length;
  const isApproved = userProfile?.status === 'approved' || userProfile?.role === 'admin';
  const t = TRANSLATIONS[lang];

  // Pipeline Key Figures
  const activeOrders = orders.filter((o) => o.stage !== 'Delivered & Settled');
  const inTransitOrders = orders.filter(
    (o) => o.stage === 'International Courier' || o.stage === 'Cleared Customs'
  );
  const totalVolumeKWD = orders.reduce((sum, o) => {
    const factor = o.currency === 'KWD' ? 1 : 0.082;
    return sum + o.totalLandedQuote * factor;
  }, 0);

  // If on /adminmarafie route, render dedicated Executive Admin Portal
  if (currentPage === 'admin') {
    return (
      <AdminPortalPage
        lang={lang}
        onToggleLang={handleToggleLang}
        onExitAdmin={() => {
          setCurrentPage('main');
          if (typeof window !== 'undefined' && window.history.pushState) {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200"
    >
      {/* 1. Header Navigation */}
      <HeaderNav
        lang={lang}
        onToggleLang={handleToggleLang}
        user={user}
        userProfile={userProfile}
        orders={orders}
        pendingShoppersCount={pendingShoppersCount}
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onOpenNewClient={() => setIsNewClientOpen(true)}
        onOpenPublicTracker={() => setActiveTab('tracking')}
        onOpenShopperRegister={() => setIsShopperRegisterOpen(true)}
        onOpenShopperSignIn={() => setIsShopperSignInOpen(true)}
        onLogout={handleLogout}
        canManage={Boolean(isApproved)}
      />

      {/* 2. Organized Hero Header & Metrics Strip */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950 px-4 sm:px-6 lg:px-8 py-7">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold">
                  {lang === 'ar' ? 'مكتب الكونسيرج الفاخر المعتمد' : 'Verified Luxury Concierge OS'}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-400 font-mono">
                  London / Paris / Milan ⇄ GCC
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {lang === 'ar' ? 'إدارة التوريد الشخصي وتتبع الشحنات' : 'Concierge Sourcing & Landed Quotes'}
              </h1>
              <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                {lang === 'ar'
                  ? 'منصة متكاملة للمتسوقين الشخصيين لحساب تكاليف الاستيراد الدقيقة، تنظيم طلبات عملاء VIP، وتتبع الشحنات بالرمز السري.'
                  : 'End-to-end luxury procurement desk. Live European boutique conversion, customs tariffs, armored courier tracking, and client dossiers.'}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsNewOrderOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'طلب توريد جديد' : 'New Sourcing Job'}</span>
              </button>

              <button
                onClick={() => setIsNewClientOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-semibold text-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'تسجيل عميل VIP' : 'New VIP Client'}</span>
              </button>
            </div>
          </div>

          {/* 3 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-zinc-400 font-medium">
                  {lang === 'ar' ? 'الطلبات النشطة' : 'Active Pipeline'}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-amber-200 font-mono tabular-nums">
                  {activeOrders.length} {lang === 'ar' ? 'طلب' : 'Orders'}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {orders.length} {lang === 'ar' ? 'إجمالي مسجل' : 'total all-time'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-zinc-400 font-medium">
                  {lang === 'ar' ? 'شحنات قيد النقل' : 'In Courier Transit'}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-indigo-300 font-mono tabular-nums">
                  {inTransitOrders.length} {lang === 'ar' ? 'شحنة' : 'Shipments'}
                </div>
                <div className="text-[11px] text-indigo-400 font-mono">
                  {lang === 'ar' ? 'عبر الشحن الجوي السريع' : 'Air express courier'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-zinc-400 font-medium">
                  {lang === 'ar' ? 'إجمالي قيمة التوريد' : 'Total Sourcing Volume'}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono tabular-nums">
                  {totalVolumeKWD.toLocaleString(undefined, { maximumFractionDigits: 0 })} KWD
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  {lang === 'ar' ? 'القيمة الإجمالية المستقرة' : 'Landed equivalent value'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Clean Segmented Tab Control */}
      <div className="sticky top-16 z-30 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto py-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800/90 rounded-xl">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pipeline'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.tabs.pipeline}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-300">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>{t.tabs.calculator}</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.tabs.clients}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-300">
                {clients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tracking'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{t.tabs.tracking}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Tab Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pipeline' && (
          <PipelineTab
            orders={orders}
            lang={lang}
            onPreviewOrder={(order: SourcingOrder) => setTrackingModalOrder(order)}
            canManage={Boolean(isApproved)}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorTab
            lang={lang}
            onTransferQuote={(data: { retail: number; totalQuote: number; deposit: number; currency: string }) => {
              setQuoteTransferData(data);
              setIsNewOrderOpen(true);
            }}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            clients={clients}
            lang={lang}
            onOpenNewClient={() => setIsNewClientOpen(true)}
            onNewOrderForClient={(clientId: string) => {
              setSelectedClientIdForOrder(clientId);
              setIsNewOrderOpen(true);
            }}
          />
        )}

        {activeTab === 'tracking' && (
          <PublicTrackerSection
            orders={orders}
            lang={lang}
            onTrackOrder={(order: SourcingOrder) => setTrackingModalOrder(order)}
          />
        )}
      </main>

      {/* 5. Minimalist Luxury Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">ARVEC SOUZ</span>
            <span>·</span>
            <span>Europe ⇄ GCC Private Concierge Desk</span>
          </div>
          <div>
            London · Paris · Milan · Kuwait City · Riyadh · Dubai
          </div>
        </div>
      </footer>

      {/* 6. Modals */}
      {/* New Sourcing Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => {
          setIsNewOrderOpen(false);
          setQuoteTransferData(null);
          setSelectedClientIdForOrder(null);
        }}
        clients={clients}
        shopperId={userProfile?.userId || 'shopper_marafie'}
        shopperName={userProfile?.displayName || 'Arvec Personal Shopper'}
        lang={lang}
        onOrderCreated={(order: SourcingOrder) => {
          setCreatedOrder(order);
          setIsNewOrderOpen(false);
        }}
      />

      {/* New VIP Client Modal */}
      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        creatorId={userProfile?.userId || 'admin'}
        lang={lang}
      />

      {/* Order Created Success Receipt Modal */}
      <OrderCreatedSuccessModal
        order={createdOrder}
        onClose={() => setCreatedOrder(null)}
        lang={lang}
      />

      {/* Tracking Modal */}
      <PublicTrackingModal
        isOpen={Boolean(trackingModalOrder)}
        onClose={() => setTrackingModalOrder(null)}
        order={trackingModalOrder}
        lang={lang}
      />

      {/* Shopper Registration Modal */}
      <ShopperRegisterModal
        isOpen={isShopperRegisterOpen}
        onClose={() => setIsShopperRegisterOpen(false)}
        lang={lang}
        onRegistered={(newProfile: UserProfile) => {
          setUserProfile(newProfile);
        }}
        onOpenLogin={() => {
          setIsShopperRegisterOpen(false);
          setIsShopperSignInOpen(true);
        }}
      />

      {/* Shopper Sign In Modal */}
      <ShopperSignInModal
        isOpen={isShopperSignInOpen}
        onClose={() => setIsShopperSignInOpen(false)}
        lang={lang}
        onOpenRegister={() => {
          setIsShopperSignInOpen(false);
          setIsShopperRegisterOpen(true);
        }}
        onLoginSuccess={(newProfile: UserProfile) => {
          setUserProfile(newProfile);
        }}
      />
    </div>
  );
}

export default App;
