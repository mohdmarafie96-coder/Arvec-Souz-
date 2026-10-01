/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Calculator,
  Users,
  Search,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Language, UserProfile, SourcingOrder, VipClient } from './types/concierge';
import { TRANSLATIONS } from './utils/translations';
import { HeaderNav } from './components/HeaderNav';
import { PipelineTab } from './components/PipelineTab';
import { CalculatorTab } from './components/CalculatorTab';
import { ClientsTab } from './components/ClientsTab';
import { PublicTrackerSection } from './components/PublicTrackerSection';
import { NewOrderModal } from './components/NewOrderModal';
import { NewClientModal } from './components/NewClientModal';
import { PublicTrackingModal } from './components/PublicTrackingModal';
import { OrderCreatedSuccessModal } from './components/OrderCreatedSuccessModal';
import { AdminApprovalsModal } from './components/AdminApprovalsModal';
import { ShopperRegisterModal } from './components/ShopperRegisterModal';
import { AuthErrorModal } from './components/AuthErrorModal';
import { useAuth } from './firebase/authContext';
import {
  syncUserProfile,
  subscribeToOrders,
  subscribeToClients,
  subscribeToShoppers,
} from './firebase/conciergeService';

type TabView = 'pipeline' | 'calculator' | 'clients' | 'tracking';

export default function App() {
  const { user, profile: authProfile, loginWithGoogle, logout } = useAuth();

  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<TabView>('pipeline');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Live Firestore collections (started empty with ZERO samples)
  const [orders, setOrders] = useState<SourcingOrder[]>([]);
  const [clients, setClients] = useState<VipClient[]>([]);
  const [shoppersList, setShoppersList] = useState<UserProfile[]>([]);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState<boolean>(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isShopperRegisterOpen, setIsShopperRegisterOpen] = useState<boolean>(false);
  const [previewOrder, setPreviewOrder] = useState<SourcingOrder | null>(null);
  const [createdOrderSuccess, setCreatedOrderSuccess] = useState<SourcingOrder | null>(null);

  const t = TRANSLATIONS[lang];

  // Purge any legacy sample mock data from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('arvec_concierge_orders');
      localStorage.removeItem('arvec_concierge_clients');
    } catch {
      // ignore
    }
  }, []);

  // Sync user profile upon authentication
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
    } else if (user) {
      syncUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }).then((p) => setUserProfile(p));
    } else {
      setUserProfile(null);
    }
  }, [user, authProfile]);

  // Subscribe to real-time Firestore collections
  useEffect(() => {
    const unsubOrders = subscribeToOrders((liveOrders) => {
      setOrders(liveOrders);

      // Check if URL has ?track=AS-XXXX or ?order=AS-XXXX query
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const trackCode = urlParams.get('track') || urlParams.get('order');
        if (trackCode) {
          const match = liveOrders.find(
            (o) => o.id.toUpperCase() === trackCode.toUpperCase()
          );
          if (match) {
            setPreviewOrder(match);
          }
        }
      }
    });

    const unsubClients = subscribeToClients((liveClients) => {
      setClients(liveClients);
    });

    const unsubShoppers = subscribeToShoppers((liveShoppers) => {
      setShoppersList(liveShoppers);
    });

    return () => {
      unsubOrders();
      unsubClients();
      unsubShoppers();
    };
  }, []);

  const isAdmin = userProfile?.role === 'admin';
  const isApproved = userProfile?.status === 'approved' || isAdmin;
  const isPending = userProfile && !isApproved;
  const pendingShoppersCount = shoppersList.filter((s) => s.status === 'pending_approval').length;

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleTransferQuote = (quoteData: {
    retail: number;
    totalQuote: number;
    deposit: number;
    currency: string;
  }) => {
    if (!userProfile) {
      loginWithGoogle();
      return;
    }
    setIsNewOrderOpen(true);
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200 ${
        lang === 'ar' ? 'font-arabic' : ''
      }`}
    >
      {/* 1. Header Navigation */}
      <HeaderNav
        lang={lang}
        onToggleLang={handleToggleLang}
        user={userProfile || user}
        userProfile={userProfile}
        orders={orders}
        pendingShoppersCount={pendingShoppersCount}
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onOpenNewClient={() => setIsNewClientOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenPublicTracker={() => setActiveTab('tracking')}
        onOpenShopperRegister={() => setIsShopperRegisterOpen(true)}
        onLogin={loginWithGoogle}
        onLogout={logout}
        canManage={Boolean(isApproved)}
      />

      {/* 2. Sub-Nav / Tabs Segmented Control */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/90 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-zinc-850 text-amber-200 border-amber-500/35'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>{t.tabs.pipeline}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-zinc-850 text-amber-200 border-amber-500/35'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t.tabs.calculator}</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-zinc-850 text-amber-200 border-amber-500/35'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t.tabs.clients}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                {clients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-zinc-850 text-amber-200 border-amber-500/35'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.tabs.tracking}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{t.reliableSourcing}</span>
          </div>
        </div>
      </div>

      {/* 3. Pending Shopper Approval Alert Banner */}
      {isPending && (
        <div className="bg-amber-950/70 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t.pendingApprovalMsg}</span>
          </div>
        </div>
      )}

      {/* 4. Main Tab Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {activeTab === 'pipeline' && (
          <PipelineTab
            orders={orders}
            lang={lang}
            onPreviewOrder={(ord) => setPreviewOrder(ord)}
            canManage={Boolean(isApproved)}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorTab lang={lang} onTransferQuote={handleTransferQuote} />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            clients={clients}
            lang={lang}
            onOpenNewClient={() => {
              if (!userProfile) loginWithGoogle();
              else setIsNewClientOpen(true);
            }}
            onNewOrderForClient={(clientId) => {
              if (!userProfile) loginWithGoogle();
              else setIsNewOrderOpen(true);
            }}
          />
        )}

        {activeTab === 'tracking' && (
          <PublicTrackerSection
            orders={orders}
            lang={lang}
            onTrackOrder={(ord) => setPreviewOrder(ord)}
          />
        )}
      </main>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950/80 py-6 px-4 text-center text-xs text-zinc-500 font-mono">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>Arvec Souz © 2026 · {t.appSubtitle}</span>
          <span className="hidden sm:inline">·</span>
          <span>Europe ⇄ GCC Luxury Concierge Network</span>
        </div>
      </footer>

      {/* Modals */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        clients={clients}
        shopperId={userProfile?.userId || 'GUEST'}
        shopperName={userProfile?.displayName || 'Personal Shopper'}
        lang={lang}
        onOrderCreated={(ord) => setCreatedOrderSuccess(ord)}
      />

      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        creatorId={userProfile?.userId || 'GUEST'}
        lang={lang}
      />

      <PublicTrackingModal
        isOpen={Boolean(previewOrder)}
        onClose={() => setPreviewOrder(null)}
        order={previewOrder}
        lang={lang}
      />

      {/* Official VIP Dispatch Note Generated */}
      <OrderCreatedSuccessModal
        order={createdOrderSuccess}
        onClose={() => setCreatedOrderSuccess(null)}
        lang={lang}
      />

      {isAdmin && (
        <AdminApprovalsModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          lang={lang}
          currentAdminUid={userProfile?.userId || ''}
        />
      )}

      {/* Shopper Application Modal */}
      <ShopperRegisterModal
        isOpen={isShopperRegisterOpen}
        onClose={() => setIsShopperRegisterOpen(false)}
        lang={lang}
        onRegistered={(newProfile) => {
          setUserProfile(newProfile);
        }}
      />

      <AuthErrorModal />
    </div>
  );
}
