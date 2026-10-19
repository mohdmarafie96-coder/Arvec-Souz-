import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, Sparkles, Receipt, MapPin, User, UserPlus } from 'lucide-react';
import { VipClient, Language, PipelineStage, SourcingOrder } from '../types/concierge';
import { saveSourcingOrder } from '../firebase/conciergeService';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: VipClient[];
  shopperId: string;
  shopperName: string;
  lang: Language;
  prefillData?: {
    retail: number;
    totalQuote: number;
    deposit: number;
    currency: string;
  };
  prefillClientId?: string;
  onOrderCreated?: (order: SourcingOrder) => void;
  onOpenNewClientModal?: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  clients,
  shopperId,
  shopperName,
  lang,
  prefillData,
  prefillClientId,
  onOrderCreated,
  onOpenNewClientModal,
}) => {
  const [clientId, setClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [brand, setBrand] = useState<string>('Hermès');
  const [title, setTitle] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [sourcingCity, setSourcingCity] = useState<string>('London / Harrods');
  const [destinationCity, setDestinationCity] = useState<string>('Kuwait City, Kuwait');
  const [retailTagPrice, setRetailTagPrice] = useState<number | ''>('');
  const [totalLandedQuote, setTotalLandedQuote] = useState<number | ''>('');
  const [depositPaid, setDepositPaid] = useState<number | ''>('');
  const [currency, setCurrency] = useState<string>('KWD');
  const [receiptVerified, setReceiptVerified] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync prefilled data if provided
  useEffect(() => {
    if (isOpen) {
      if (prefillClientId) {
        setClientId(prefillClientId);
        const matched = clients.find((c) => c.id === prefillClientId);
        if (matched) {
          if (matched.city.includes('Kuwait')) setDestinationCity('Kuwait City, Kuwait');
          else if (matched.city.includes('Saudi')) setDestinationCity('Riyadh, Saudi Arabia');
          else if (matched.city.includes('UAE') || matched.city.includes('Dubai')) setDestinationCity('Dubai, UAE');
          if (matched.currency) setCurrency(matched.currency);
        }
      } else {
        setClientId('');
      }

      if (prefillData) {
        setRetailTagPrice(prefillData.retail || '');
        setTotalLandedQuote(prefillData.totalQuote || '');
        setDepositPaid(prefillData.deposit || '');
        if (prefillData.currency) setCurrency(prefillData.currency);
      }
    }
  }, [isOpen, prefillData, prefillClientId, clients]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleClientSelect = (id: string) => {
    setClientId(id);
    const matched = clients.find((c) => c.id === id);
    if (matched) {
      setCustomClientName(matched.name);
      if (matched.city.includes('Kuwait')) setDestinationCity('Kuwait City, Kuwait');
      else if (matched.city.includes('Saudi')) setDestinationCity('Riyadh, Saudi Arabia');
      else if (matched.city.includes('Dubai') || matched.city.includes('UAE')) setDestinationCity('Dubai, UAE');
      if (matched.currency) setCurrency(matched.currency);
    } else {
      setCustomClientName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    // Generate professional Arvec Souz Order Reference (e.g. AS-7892)
    const orderId = `AS-${Math.floor(1000 + Math.random() * 9000)}`;

    const numRetail = Number(retailTagPrice) || 0;
    const numQuote = Number(totalLandedQuote) || 0;
    const numDeposit = Number(depositPaid) || 0;

    // Client is strictly optional
    const finalClientName = selectedClient
      ? selectedClient.name
      : customClientName.trim()
      ? customClientName.trim()
      : lang === 'ar'
      ? 'عميل كبار الشخصيات (طلب خاص)'
      : 'VIP Private Patron';

    const finalClientId = selectedClient ? selectedClient.id : 'DIRECT';

    const newOrder: SourcingOrder = {
      id: orderId,
      shopperId,
      shopperName,
      clientId: finalClientId,
      clientName: finalClientName,
      brand,
      title: title.trim(),
      size: size.trim() || 'Standard Spec',
      image:
        image.trim() ||
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80',
      sourcingCity,
      destinationCity,
      stage: 'Request Logged',
      retailTagPrice: numRetail,
      sourceCurrency: sourcingCity.includes('London') ? 'GBP' : 'EUR',
      exchangeRate: sourcingCity.includes('London') ? 0.395 : 0.334,
      convertedRetail: numQuote > 0 ? numQuote * 0.8 : numRetail * 0.395,
      customsDuty: numQuote > 0 ? numQuote * 0.05 : numRetail * 0.395 * 0.05,
      shipping: 85,
      commission: numQuote > 0 ? numQuote * 0.15 : numRetail * 0.395 * 0.15,
      totalLandedQuote: numQuote > 0 ? numQuote : numRetail * 0.395 * 1.25,
      depositPaid: numDeposit,
      balanceDue: Math.max(0, (numQuote > 0 ? numQuote : numRetail * 0.395 * 1.25) - numDeposit),
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

  const calculatedBalance = Math.max(
    0,
    (Number(totalLandedQuote) || 0) - (Number(depositPaid) || 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center justify-center">
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
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Section 1: VIP Client Selection (STRICTLY OPTIONAL) */}
          <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'ar' ? 'العميل المميز (اختياري)' : 'VIP Client (Optional)'}</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {lang === 'ar' ? '— ليس إلزامياً' : '— Not required'}
                </span>
              </label>

              {onOpenNewClientModal && (
                <button
                  type="button"
                  onClick={onOpenNewClientModal}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-mono cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{lang === 'ar' ? '+ تسجيل عميل جديد' : '+ New Client'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">
                  {lang === 'ar' ? 'اختيار من دليل العملاء' : 'Select from VIP Directory'}
                </label>
                <select
                  value={clientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">
                    {lang === 'ar'
                      ? '— بدون تحديد عميل (طلب مباشر / خاص) —'
                      : '— None / Direct Client (Private Patron) —'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">
                  {lang === 'ar' ? 'اسم العميل / المرجع (اختياري)' : 'Custom Client Name / Ref (Optional)'}
                </label>
                <input
                  type="text"
                  value={selectedClient ? selectedClient.name : customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  disabled={Boolean(selectedClient)}
                  placeholder={
                    selectedClient
                      ? selectedClient.name
                      : lang === 'ar'
                      ? 'مثال: عميل خاص / اسم الزبون'
                      : 'e.g. Private Patron (or leave blank)'
                  }
                  className={`w-full bg-zinc-900 border border-zinc-750 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 ${
                    selectedClient ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* VIP Client Dossier Badge if linked */}
            {selectedClient && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-amber-200">
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Linked Dossier: {selectedClient.name}</span>
                </span>
                <span className="text-zinc-400">
                  Shoe: <strong className="text-white">{selectedClient.shoeSize}</strong> · Ring: <strong className="text-white">{selectedClient.ringSize}</strong> · RTW: <strong className="text-white">{selectedClient.rtwSize}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Luxury House & Item Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'الدار الفاخرة *' : 'Luxury House / Brand *'}
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Hermès">Hermès</option>
                <option value="Chanel">Chanel</option>
                <option value="Goyard">Goyard</option>
                <option value="Rolex">Rolex</option>
                <option value="Loro Piana">Loro Piana</option>
                <option value="Patek Philippe">Patek Philippe</option>
                <option value="Cartier">Cartier</option>
                <option value="Audemars Piguet">Audemars Piguet</option>
                <option value="Dior">Dior</option>
                <option value="Bottega Veneta">Bottega Veneta</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'عنوان القطعة ومواصفاتها *' : 'Item Title & Specifications *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={lang === 'ar' ? 'مثال: Birkin 25 Togo Noir GHW أو حقيبة كلاسيك...' : 'e.g. Birkin 25 Togo Noir GHW or Classic Flap Bag...'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Sizing, Origin, Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">
                {lang === 'ar' ? 'المقاس / الأبعاد' : 'Size / Dimension'}
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: مقاس 25 / Size 38' : 'e.g. Size 25 / 41mm'}
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="London / Harrods">London / Harrods</option>
                <option value="Paris / Rue du Faubourg">Paris / Rue du Faubourg</option>
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
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
              placeholder="https://..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reliable Sourcing Checkbox */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <span className="text-white font-bold block">
                  {lang === 'ar' ? 'بروتوكول موثوقية المصدر وفاتورة البوتيك' : 'Boutique Receipt & Authenticity Protocol'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {lang === 'ar' ? 'التحقق من الفاتورة الرسمية والرقم التسلسلي الأصلي والشحن المؤمن' : 'Guarantees original boutique invoice, tamper-proof packaging, and insured courier'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={receiptVerified}
              onChange={(e) => setReceiptVerified(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Financial Inputs */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-amber-300 uppercase block font-semibold">
                {lang === 'ar' ? 'البيانات المالية للتوريد' : 'Quote Financials'}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Balance Due: <strong className="text-amber-400">{calculatedBalance.toLocaleString()} {currency}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Retail Tag (£/€)</label>
                <input
                  type="number"
                  value={retailTagPrice === '' ? '' : retailTagPrice}
                  onChange={(e) => setRetailTagPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl py-1.5 px-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Final Landed Quote</label>
                <input
                  type="number"
                  value={totalLandedQuote === '' ? '' : totalLandedQuote}
                  onChange={(e) => setTotalLandedQuote(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl py-1.5 px-2.5 text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Deposit Paid</label>
                <input
                  type="number"
                  value={depositPaid === '' ? '' : depositPaid}
                  onChange={(e) => setDepositPaid(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl py-1.5 px-2.5 text-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl py-1.5 px-2.5 text-white font-mono cursor-pointer"
                >
                  <option value="KWD">KWD</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                  <option value="QAR">QAR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
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
