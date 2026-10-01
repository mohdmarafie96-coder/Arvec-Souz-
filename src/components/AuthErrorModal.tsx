import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, X, UserCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../firebase/authContext';

export const AuthErrorModal: React.FC = () => {
  const { authError, clearAuthError, loginAsAdmin, loginAsShopper } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);

  if (!authError) return null;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(authError.domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-zinc-100">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Access Verification & Sign-In</h3>
              <p className="text-xs text-amber-300/80 font-mono">Sign-In Window Closed / Direct Access Available</p>
            </div>
          </div>
          <button
            onClick={clearAuthError}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Instant Credential Access Options */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
            Instant Direct Sign-In (Bypasses Browser Popup Restrictions)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                loginAsAdmin();
                clearAuthError();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin (Mohd Marafie)</span>
            </button>

            <button
              onClick={() => {
                loginAsShopper();
                clearAuthError();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Personal Shopper</span>
            </button>
          </div>
        </div>

        {/* Domain Whitelist Information */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3 text-xs">
          <span className="text-zinc-400 font-medium block">
            Why did the Google window close? For security, Google OAuth requires registering your Vercel or cloud domain in Firebase Console.
          </span>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-750 font-mono text-[11px]">
            <span className="text-sky-300 truncate max-w-[280px]">{authError.domain}</span>
            <button
              onClick={handleCopyDomain}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <a
            href={authError.consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-300 hover:underline text-xs font-mono"
          >
            <span>Open Firebase Authorized Domains Settings</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={clearAuthError}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
