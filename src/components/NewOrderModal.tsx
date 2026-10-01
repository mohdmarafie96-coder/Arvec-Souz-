import React, { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles, Receipt, MapPin } from 'lucide-react';
import { VipClient, Language, PipelineStage, SourcingOrder } from '../types/concierge';
import { saveSourcingOrder } from '../firebase/conciergeService';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: VipClient[];
  shopperId: string;
  shopperName: string;
  lang: Language;
  onOrderCreated?: (order: SourcingOrder) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  clients,
  shopperId,
  shopperName,
  lang,
  onOrderCreated,
}) => {
  const [clientId, setClientId] = useState<string>(clients[0]?.id || '');
  const [brand, setBrand] = useState<string>('Hermès');
  const [title, setTitle] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [sourcingCity, setSourcingCity] = useState<string>('London / Harrods');
  const [destinationCity, setDestinationCity] = useState<string>('Kuwait City, Kuwait');
  const [retailTagPrice, setRetailTagPrice] = useState<number>(7500);
  const [totalLandedQuote, setTotalLandedQuote] = useState<number>(3850);
  const [depositPaid, setDepositPaid] = useState<number>(1500);
  const [currency, setCurrency] = useState<string>('KWD');
  const [receiptVerified, setReceiptVerified] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const selectedClient = clients.find((c) => c.id === clientId);
    // Generate professional Arvec Souz Order Reference (e.g. AS-7892)
    const orderId = `AS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: SourcingOrder = {
      id: orderId,
      shopperId,
      shopperName,
      clientId: selectedClient?.id || 'DIRECT',
      clientName: selectedClient?.name || (lang === 'ar' ? 'عميل كبار الشخصيات' : 'VIP Patron'),
      brand,
      title: title.trim(),
      size: size.trim() || 'Standard Spec',
      image:
        image.trim() ||
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80',
      sourcingCity,
      destinationCity,
      stage: 'Request Logged',
      retailTagPrice,
      sourceCurrency: 'GBP',
      exchangeRate: 0.395,
      convertedRetail: totalLandedQuote * 0.8,
      customsDuty: totalLandedQuote * 0.05,
      shipping: 120,
      commission: totalLandedQuote * 0.15,
      totalLandedQuote,
      depositPaid,
      balanceDue: Math.max(0, totalLandedQuote - depositPaid),
      currency,
      awb: `MALCA-AMIT-${Math.floor(100000 + Math.random() * 900000)}`,
      verifiedSource: true,
      boutiqueReceiptVerified: receiptVerified,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveSourcingOrder(newOrder);
      onClose();
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }
    } catch (err) {
      console.error('Failed to create sourcing order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'تسجيل طلب توريد فاخر جديد' : 'Log New Luxury Sourcing Job'}
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                {lang === 'ar' ? 'ملف توريد موثق عبر الحدود' : 'Cross-border verified procurement dossier'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'العميل المميز (VIP) *' : 'VIP Client *'}
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
              >
                {clients.length === 0 ? (
                  <option value="">
                    {lang === 'ar' ? 'لا يوجد عملاء مسجلين (سجل العميل أولاً)' : 'No VIP clients enrolled yet'}
                  </option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'الدار الفاخرة / العلامة التجارية *' : 'Luxury House / Brand *'}
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Hermès">Hermès</option>
                <option value="Chanel">Chanel</option>
                <option value="Goyard">Goyard</option>
                <option value="Rolex">Rolex</option>
                <option value="Loro Piana">Loro Piana</option>
                <option value="Patek Philippe">Patek Philippe</option>
                <option value="Cartier">Cartier</option>
                <option value="Dior">Dior</option>
                <option value="Bottega Veneta">Bottega Veneta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-medium text-zinc-300 block mb-1">
              {lang === 'ar' ? 'عنوان القطعة ومواصفاتها *' : 'Item Title & Specifications *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Mini Kelly II 20 Noir Epsom GHW or Rolex Daytona 116500LN"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'المقاس / الأبعاد' : 'Size / Dimension'}
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 20cm, 38 EU, Medium"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'مركز التوريد الأوروبي' : 'Sourcing Hub'}
              </label>
              <select
                value={sourcingCity}
                onChange={(e) => setSourcingCity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="London / Harrods">London / Harrods</option>
                <option value="Paris / Rue Cambon">Paris / Rue Cambon</option>
                <option value="Milan / Montenapoleone">Milan / Montenapoleone</option>
                <option value="Geneva / Salon">Geneva / Salon</option>
                <option value="Tokyo / Ginza">Tokyo / Ginza</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'مدينة التسليم في الخليج' : 'Destination GCC City'}
              </label>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Kuwait City, Kuwait">Kuwait City, Kuwait</option>
                <option value="Riyadh, Saudi Arabia">Riyadh, Saudi Arabia</option>
                <option value="Dubai, UAE">Dubai, UAE</option>
                <option value="Doha, Qatar">Doha, Qatar</option>
                <option value="Manama, Bahrain">Manama, Bahrain</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-medium text-zinc-300 block mb-1">
              {lang === 'ar' ? 'رابط صورة القطعة' : 'Product Photo URL (Optional)'}
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reliable Sourcing Checkbox */}
          <div className="p-3 rounded-2xl bg-zinc-950 border border-amber-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <div>
                <span className="text-white font-bold block">
                  {lang === 'ar' ? 'بروتوكول موثوقية المصدر وفاتورة البوتيك' : 'Boutique Receipt & Authenticity Protocol'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {lang === 'ar' ? 'التحقق من الفاتورة الرسمية والرقم التسلسلي الأصلي' : 'Ensures original boutique receipt and tamper-evident packaging'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={receiptVerified}
              onChange={(e) => setReceiptVerified(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded"
            />
          </div>

          {/* Financial Inputs */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[11px] font-mono text-amber-300 uppercase block font-semibold">
              {lang === 'ar' ? 'البيانات المالية للتوريد' : 'Quote Financials'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Retail Tag (£/€)</label>
                <input
                  type="number"
                  value={retailTagPrice}
                  onChange={(e) => setRetailTagPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg py-1.5 px-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Final Landed Quote</label>
                <input
                  type="number"
                  value={totalLandedQuote}
                  onChange={(e) => setTotalLandedQuote(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg py-1.5 px-2 text-amber-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Deposit Paid</label>
                <input
                  type="number"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg py-1.5 px-2 text-emerald-400 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg py-1.5 px-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? lang === 'ar'
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : lang === 'ar'
                ? 'إنشاء طلب التوريد'
                : 'Create Sourcing Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
