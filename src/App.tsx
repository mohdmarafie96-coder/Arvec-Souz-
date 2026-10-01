/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Table,
  PackageCheck,
  Code2,
  BookmarkCheck,
  Share2,
  FileSpreadsheet,
  Globe,
  LogIn,
  LogOut,
  User,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ConditionTier, SourcingReport } from './types/sourcing';
import { ArvecLogo } from './components/ArvecLogo';
import { SourcingInputForm } from './components/SourcingInputForm';
import { ExecutiveSummaryTable } from './components/ExecutiveSummaryTable';
import { ItemizedSourceBreakdown } from './components/ItemizedSourceBreakdown';
import { JsonModeViewer } from './components/JsonModeViewer';
import { AuthErrorModal } from './components/AuthErrorModal';
import { fetchSourcingReport } from './utils/sourcingEngine';
import { useAuth } from './firebase/authContext';
import { saveSourcingReportToFirestore } from './firebase/sourcingService';

type ViewMode = 'all' | 'table' | 'itemized' | 'json';

export default function App() {
  const { user, profile, loginWithGoogle, logout } = useAuth();

  // Active Sourcing Query & Report State (null initially until user submits)
  const [report, setReport] = useState<SourcingReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Execute new sourcing query
  const handleSearch = async (params: {
    item: string;
    condition: ConditionTier;
    country: string;
    currency: string;
  }) => {
    setIsLoading(true);
    setIsSaved(false);
    setSaveSuccessMsg(null);

    try {
      const result = await fetchSourcingReport(
        params.item,
        params.condition,
        params.country,
        params.currency
      );
      setReport(result);
    } catch (err) {
      console.error('Failed to run sourcing query:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save report to Firestore
  const handleSaveReport = async () => {
    if (!report) return;
    if (!user) {
      loginWithGoogle();
      return;
    }

    try {
      await saveSourcingReportToFirestore(
        user.uid,
        profile?.displayName || user.displayName || 'Authorized Client',
        report
      );
      setIsSaved(true);
      setSaveSuccessMsg('Report saved securely to your Arvec Souz portfolio!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to save report:', err);
    }
  };

  const handleScrollToSource = (rank: number) => {
    const el = document.getElementById(`source-card-${rank}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      {/* 1. TOP BAR CONTRACT: Brand Wordmark — Navigation Links — Primary Actions */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        {/* Zone 1: Single text element brand wordmark */}
        <div className="flex items-center gap-4">
          <ArvecLogo size="md" showSubtitle={false} />
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-sky-400 font-semibold">ENGINE:</span>
            <span>Smart Item Sourcing & Landed Cost</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / View Segmented Control (only when report exists) */}
        {report && (
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Complete Report
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Comparison Table</span>
            </button>
            <button
              onClick={() => setViewMode('itemized')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'itemized'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Top 5 Sources</span>
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'json'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON Mode</span>
            </button>
          </nav>
        )}

        {/* Zone 3: Actions & Account Authentication */}
        <div className="flex items-center gap-2 sm:gap-3">
          {report && (
            <button
              onClick={handleSaveReport}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border cursor-pointer ${
                isSaved
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
              title="Save this quote to your Firestore portfolio"
            >
              <BookmarkCheck className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved to Cloud' : 'Save Quote'}</span>
            </button>
          )}

          {/* User Sign-In or Avatar */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Client'}
                    className="w-5 h-5 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-200 max-w-[90px] truncate hidden md:inline">
                  {profile?.displayName || user.displayName}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-600/20 whitespace-nowrap cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 px-4 py-2 text-xs font-medium text-center animate-in fade-in duration-200">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* 2. MAIN APPLICATION CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Hero Title & Mission Brief */}
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Autonomous Verified Marketplace Sourcing & Customs Clearance
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Smart Item Sourcing & Landed Cost Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Extracts item parameters, filters out unverified or out-of-stock listings across accredited global secondary and authorized retail networks, and executes deterministic CIF landed cost arithmetic: <strong>Item Base + Freight & Insurance + Customs Duty + Import VAT</strong>.
          </p>
        </div>

        {/* Operational Workflow Form (Query Extraction & Normalization) */}
        <SourcingInputForm onSearch={handleSearch} isLoading={isLoading} />

        {/* Report Display or Clean Initial Prompt State */}
        {report ? (
          <>
            {/* Mobile View Switcher */}
            <div className="flex md:hidden items-center justify-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  viewMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('itemized')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  viewMode === 'itemized' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Top 5
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  viewMode === 'json' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                JSON
              </button>
            </div>

            {/* Output Components Rendering */}
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Component 1: Executive Summary & Comparison Table */}
              {(viewMode === 'all' || viewMode === 'table') && (
                <ExecutiveSummaryTable report={report} onSelectSource={handleScrollToSource} />
              )}

              {/* Component 2: Itemized Breakdown (Top 5 Sources) */}
              {(viewMode === 'all' || viewMode === 'itemized') && (
                <ItemizedSourceBreakdown sources={report.sources} currency={report.query.currency} />
              )}

              {/* Component 3: JSON Structured Mode (Optional / API Integration) */}
              {(viewMode === 'all' || viewMode === 'json') && (
                <JsonModeViewer report={report} />
              )}
            </div>
          </>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/50 border border-slate-800/80 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-100">Ready to Source & Compute Landed Cost</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your item name, model year, reference, size, or material in the search box above to calculate accurate CIF pricing across 5 verified global sources.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>Arvec Souz © 2026 · Smart Item Sourcing & Landed Cost Engine</span>
          <span className="hidden sm:inline">·</span>
          <span>Verified Sources: Sotheby's, Chrono24, WatchBox, FASHIONPHILE, B&H Photo, Farfetch</span>
        </div>
      </footer>

      {/* Vercel Domain & Auth Troubleshooting Modal */}
      <AuthErrorModal />
    </div>
  );
}
