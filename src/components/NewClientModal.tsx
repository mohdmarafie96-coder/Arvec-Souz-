import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin } from 'lucide-react';
import { Language } from '../types/concierge';
import { saveVipClient } from '../firebase/conciergeService';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  lang: Language;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  lang,
}) => {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('Kuwait City, Kuwait');
  const [shoeSize, setShoeSize] = useState<string>('');
  const [ringSize, setRingSize] = useState<string>('');
  const [rtwSize, setRtwSize] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    const clientId = `CLI-${Math.floor(100 + Math.random() * 900)}`;

    try {
      await saveVipClient({
        id: clientId,
        createdBy: creatorId,
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        shoeSize: shoeSize.trim() || '—',
        ringSize: ringSize.trim() || '—',
        rtwSize: rtwSize.trim() || '—',
        currency: city.includes('Kuwait') ? 'KWD' : city.includes('Saudi') ? 'SAR' : 'AED',
        totalOrders: 0,
        lifetimeSpend: '—',
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to create VIP client:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'ar' ? 'تسجيل عميل كبار الشخصيات (VIP)' : 'Enroll VIP Patron'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-medium text-zinc-300 block mb-1">
              {lang === 'ar' ? 'الاسم واللقب الكريم *' : 'Full Honorific & Name *'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Sheikha Al-Sabah or H.E. Princess Reema"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'رقم الواتساب للتواصل *' : 'WhatsApp / Phone *'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+965 9988 7766"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'المدينة والدولة *' : 'City & GCC Country *'}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="Kuwait City, Kuwait"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              {lang === 'ar' ? 'ملف المقاسات الدقيقة (أحذية، خواتم، أزياء)' : 'Sizing Specs (Apparel, Footwear, Jewelry)'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">EU Shoe</label>
                <input
                  type="text"
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                  placeholder="38 EU"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg py-1 px-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Ring Size</label>
                <input
                  type="text"
                  value={ringSize}
                  onChange={(e) => setRingSize(e.target.value)}
                  placeholder="52 EU"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg py-1 px-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">RTW Size</label>
                <input
                  type="text"
                  value={rtwSize}
                  onChange={(e) => setRtwSize(e.target.value)}
                  placeholder="36 FR"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg py-1 px-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? lang === 'ar'
                  ? 'جاري التسجيل...'
                  : 'Enrolling...'
                : lang === 'ar'
                ? 'تسجيل العميل'
                : 'Register Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
