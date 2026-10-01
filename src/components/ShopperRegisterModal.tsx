import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, MapPin, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Language, UserProfile } from '../types/concierge';
import { registerShopperApplication } from '../firebase/conciergeService';

interface ShopperRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onRegistered: (profile: UserProfile) => void;
  onOpenLogin?: () => void;
}

export const ShopperRegisterModal: React.FC<ShopperRegisterModalProps> = ({
  isOpen,
  onClose,
  lang,
  onRegistered,
  onOpenLogin,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [hubCity, setHubCity] = useState<string>('London / Harrods Desk');
  const [specialization, setSpecialization] = useState<string>('Hermès Leather & High Horology');
  const [experience, setExperience] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    if (password.length < 6) {
      setPasswordError(
        lang === 'ar'
          ? 'كلمة المرور يجب أن لا تقل عن ٦ أحرف'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(
        lang === 'ar'
          ? 'كلمات المرور غير متطابقة'
          : 'Passwords do not match'
      );
      return;
    }

    setPasswordError(null);
    setIsSubmitting(true);
    const userId = `shopper_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const newShopper: UserProfile = {
      userId,
      email: email.trim().toLowerCase(),
      password: password.trim(),
      displayName: fullName.trim(),
      role: 'shopper',
      status: 'pending_approval',
      hubCity,
      phone: phone.trim(),
      specialization,
      experience: experience.trim() || (lang === 'ar' ? 'علاقات مباشرة مع البوتيكات الأوروبية' : 'Direct European boutique relations'),
      createdAt: new Date().toISOString(),
    };

    try {
      await registerShopperApplication(newShopper);
      setIsSuccess(true);
      onRegistered(newShopper);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {lang === 'ar' ? 'طلب اعتماد متسوق شخصي جديد' : 'Personal Shopper Accreditation'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {lang === 'ar' ? 'يخضع الطلب للمراجعة والموافقة من قبل الإدارة' : 'Applications require Admin approval to ensure reliable sourcing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-base font-bold text-white">
                {lang === 'ar' ? 'تم تقديم الطلب وهو قيد المراجعة' : 'Application Submitted & Pending Review'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                {lang === 'ar'
                  ? 'تم إرسال بيانات حسابك إلى لوحة إدارة المتسوقين لدى محمد معرفي (Admin). ستتمكن من تسجيل طلبات التوريد فور اعتماد حسابك لضمان موثوقية وأصالة المصادر.'
                  : 'Your personal shopper profile has been routed to Admin (Mohd Marafie) for accreditation verification. You will be able to log procurement jobs once approved.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {lang === 'ar' ? 'حسناً، متابعة' : 'Understood, Proceed'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={lang === 'ar' ? 'اسم المتسوق الكامل...' : 'Personal shopper full name...'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-zinc-300 block mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="shopper@domain.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300 block mb-1">
                  {lang === 'ar' ? 'رقم الواتساب للتواصل *' : 'WhatsApp Number *'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+965 ..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-zinc-300 block mb-1">
                  {lang === 'ar' ? 'كلمة المرور للحساب *' : 'Account Password *'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300 block mb-1">
                  {lang === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-zinc-300 block mb-1">
                  {lang === 'ar' ? 'مركز التوريد الأساسي *' : 'Primary Sourcing Hub *'}
                </label>
                <select
                  value={hubCity}
                  onChange={(e) => setHubCity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="London / Harrods Desk">London / Harrods Desk</option>
                  <option value="Paris / Rue Cambon Desk">Paris / Rue Cambon Desk</option>
                  <option value="Milan / Montenapoleone Desk">Milan / Montenapoleone Desk</option>
                  <option value="Geneva / Salon Desk">Geneva / Salon Desk</option>
                  <option value="Tokyo / Ginza Desk">Tokyo / Ginza Desk</option>
                  <option value="Dubai / GCC Concierge">Dubai / GCC Concierge</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-zinc-300 block mb-1">
                  {lang === 'ar' ? 'تخصص الدور الفاخرة *' : 'Luxury Specialization *'}
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Hermès Leather & High Horology">Hermès Leather & High Horology</option>
                  <option value="Chanel Haute Couture & Fine Leather">Chanel Haute Couture & Fine Leather</option>
                  <option value="Rolex & Patek Philippe Timepieces">Rolex & Patek Philippe Timepieces</option>
                  <option value="Loro Piana & Cashmere RTW">Loro Piana & Cashmere RTW</option>
                  <option value="Cartier & Van Cleef High Jewelry">Cartier & Van Cleef High Jewelry</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'نبذة عن الخبرة وعلاقات البوتيكات' : 'Sourcing Experience & Boutique Network'}
              </label>
              <textarea
                rows={2}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: خبرة ٥ سنوات في كونسيرج باريس ولندن، وعلاقات مباشرة مع مدراء متاجر هيرميس وشانيل...' : 'e.g. 5+ years procuring rare leather from Rue Cambon and Bond St with VIP boutique tier status...'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Protocol Notice */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-amber-500/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                {lang === 'ar'
                  ? 'لضمان موثوقية المصادر، يتم تدقيق واعتماد حسابات المتسوقين يدوياً من قِبل محمد معرفي قبل منح صلاحيات إصدار عروض الأسعار.'
                  : 'To guarantee reliable sourcing, all personal shopper accounts are audited and approved by Admin (Mohd Marafie) before issuing quotes.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              {onOpenLogin ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                >
                  {lang === 'ar'
                    ? 'لديك حساب معتمد مسبقاً؟ تسجيل الدخول'
                    : 'Already registered? Sign in with email & password'}
                </button>
              ) : <div />}

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim() || !email.trim() || password.length < 6}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {isSubmitting
                    ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                    : (lang === 'ar' ? 'إرسال طلب الاعتماد' : 'Submit Application')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
