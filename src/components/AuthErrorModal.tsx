import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  ArrowRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';

export const AuthErrorModal: React.FC = () => {
  const { authError, clearAuthError, loginWithRedirectOption, setGuestNickname, profile } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [guestNameInput, setGuestNameInput] = useState<string>(profile?.displayName || 'Arcade Cuber');
  const [showNicknameInput, setShowNicknameInput] = useState<boolean>(false);

  if (!authError) return null;

  const currentDomain = authError.domain;
  const isUnauthorizedDomain =
    authError.code === 'auth/unauthorized-domain' ||
    authError.code === 'auth/popup-closed-by-user';

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestNickname(guestNameInput);
    clearAuthError();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Sign-In Window Closed</h3>
              <p className="text-xs text-amber-400/90 font-mono">
                {authError.code === 'auth/unauthorized-domain'
                  ? 'Domain Authorization Required'
                  : 'Popup Blocked or Closed'}
              </p>
            </div>
          </div>
          <button
            onClick={clearAuthError}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-300">
          {/* Explanation */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 leading-relaxed space-y-2">
            <p className="font-semibold text-slate-200">
              Why did the sign-in window close immediately on Vercel?
            </p>
            <p className="text-slate-400">
              For security, Google and Firebase only permit sign-in from registered domains. Your Vercel deployment URL (
              <span className="font-mono text-sky-400 font-bold">{currentDomain}</span>) must be added to the Firebase Console's Authorized Domains list.
            </p>
          </div>

          {/* 3-Step Quick Fix */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-slate-400">
              Quick 1-Minute Fix:
            </h4>

            {/* Step 1: Copy Domain */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-slate-300 block">1. Copy your Vercel domain:</span>
                <span className="font-mono text-sky-300 text-[11px] select-all">{currentDomain}</span>
              </div>
              <button
                onClick={handleCopyDomain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Step 2: Open Firebase Console */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-slate-300 block">2. Open Firebase Authorized Domains:</span>
                <span className="text-slate-500 text-[11px]">Settings &gt; Authorized domains &gt; Add domain</span>
              </div>
              <a
                href={authError.consoleUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap shadow-sm shadow-blue-500/20"
              >
                <span>Open Settings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step 3: Paste and Done */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-slate-300 block">3. Click "Add domain" & paste!</span>
              <span className="text-slate-500 text-[11px]">Once added, Google sign-in works instantly without redeploying.</span>
            </div>
          </div>

          {/* Alternative: Play Right Now without Google */}
          <div className="pt-3 border-t border-slate-800/80">
            {!showNicknameInput ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <div>
                  <span className="font-bold text-emerald-300 block">Want to play right now?</span>
                  <span className="text-slate-400 text-[11px]">Set a nickname to track points & high scores locally.</span>
                </div>
                <button
                  onClick={() => setShowNicknameInput(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                >
                  Set Nickname & Play
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveNickname} className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <label className="text-xs font-bold text-emerald-300 block">Enter Player Nickname:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    maxLength={30}
                    placeholder="e.g. SpeedMaster"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Save & Play
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={() => {
              loginWithRedirectOption();
              clearAuthError();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline decoration-slate-600 underline-offset-4"
          >
            Try Redirect Mode
          </button>

          <button
            onClick={clearAuthError}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
