import React, { useState } from 'react';
import { X, Lock, Mail, ShieldAlert, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { Language, UserProfile } from '../types/concierge';
import { authenticateShopper } from '../firebase/conciergeService';

interface ShopperSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLoginSuccess: (profile: UserProfile) => void;
  onOpenRegister: () => void;
}

export const ShopperSignInModal: React.FC<ShopperSignInModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLoginSuccess,
  onOpenRegister,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningType, setWarningType] = useState<'pending' | 'rejected' | 'credentials' | 'not_found' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setWarningType(null);

    try {
      const res = await authenticateShopper(email, password);

      if (res.success && res.profile) {
        // Successfully verified and approved
        localStorage.setItem('arvec_active_shopper', JSON.stringify(res.profile));
        onLoginSuccess(res.profile);
        onClose();
        return;
      }

      if (res.error === 'pending_approval' || res.status === 'pending_approval') {
        setWarningType('pending');
        setErrorMessage(
          lang === 'ar'
            ? 'طلب اعتمادك قيد المراجعة حالياً من قبل الإدارة (محمد معرفي). فقط المتسوقون المعتمدون مسموح لهم بتسجيل الدخول.'
            : 'Access Pending: Your shopper account is awaiting approval from Admin (Mohd Marafie). Only shoppers approved by the admin are able to sign in.'
        );
      } else if (res.error === 'rejected' || res.status === 'rejected') {
        setWarningType('rejected');
        setErrorMessage(
          lang === 'ar'
            ? 'تم رفض طلب اعتماد هذا الحساب من قِبل الإدارة.'
            : 'Application Rejected: This shopper account was not approved by administration.'
        );
      } else if (res.error === 'not_found') {
        setWarningType('not_found');
        setErrorMessage(
          lang === 'ar'
            ? 'لا يوجد حساب مسجل بهذا البريد الإلكتروني. يرجى تقديم طلب اعتماد متسوق أولاً.'
            : 'No shopper account registered with this email. Please apply as a personal shopper first.'
        );
      } else {
        setWarningType('credentials');
        setErrorMessage(
          lang === 'ar'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            : 'Incorrect email or password. Please verify your credentials.'
        );
      }
    } catch (err) {
      console.error('Shopper sign in error:', err);
      setErrorMessage(
        lang === 'ar' ? 'تعذر تسجيل الدخول حالياً، يرجى المحاولة لاحقاً.' : 'Sign in failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-100">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {lang === 'ar' ? 'تسجيل دخول المتسوق الشخصي' : 'Personal Shopper Sign In'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {lang === 'ar' ? 'متاح فقط للمتسوقين المعتمدين من الإدارة' : 'Accredited Shoppers Approved by Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning / Error Notice */}
        {errorMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 font-mono ${
              warningType === 'pending'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {warningType === 'pending' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-zinc-300 block mb-1">
              {lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                required
                placeholder="shopper@domain.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-9 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-zinc-300 block mb-1">
              {lang === 'ar' ? 'كلمة المرور *' : 'Password *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-9 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">
              {lang === 'ar'
                ? 'كلمة المرور المسجلة عند تقديم طلب المتسوق'
                : 'Password entered when joining as personal shopper'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? (lang === 'ar' ? 'جاري التحقق والاعتماد...' : 'Verifying Approval...')
                : (lang === 'ar' ? 'تسجيل الدخول بالبريد وكلمة المرور' : 'Sign In with Email & Password')}
            </button>
          </div>
        </form>

        {/* Footer switch to registration */}
        <div className="pt-2 border-t border-zinc-800/70 text-center">
          <p className="text-xs text-zinc-400 font-mono">
            {lang === 'ar' ? 'متسوق جديد؟' : 'New personal shopper?'}
            {' '}
            <button
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer ml-1"
            >
              {lang === 'ar' ? 'تقديم طلب انضمام واعتماد' : 'Apply for accreditation'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
