import React from 'react';
import { User, Phone, MapPin, Sparkles, UserPlus, MessageCircle } from 'lucide-react';
import { VipClient, Language } from '../types/concierge';
import { TRANSLATIONS } from '../utils/translations';

interface ClientsTabProps {
  clients: VipClient[];
  lang: Language;
  onOpenNewClient: () => void;
  onNewOrderForClient: (clientId: string) => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  lang,
  onOpenNewClient,
  onNewOrderForClient,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {lang === 'ar' ? 'دليل عملاء كبار الشخصيات وملف القياسات' : 'VIP Client Directory & Sizing Dossier'}
          </h2>
          <p className="text-xs text-zinc-400">
            {lang === 'ar'
              ? 'سجل سري للمقاسات الدقيقة والعملات المفضلة لرواد التوريد الفاخر'
              : 'Confidential measurements, preferred currencies, and sourcing history for high-net-worth patrons.'}
          </p>
        </div>
        <button
          onClick={onOpenNewClient}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.newClientBtn}</span>
        </button>
      </div>

      {/* Grid */}
      {clients.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-slate-200">
              {lang === 'ar' ? 'لا يوجد عملاء VIP مسجلين' : 'No VIP Clients Yet'}
            </h4>
            <p className="text-xs text-zinc-400">{t.emptyClients}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{client.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                        VIP
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">{client.city}</p>
                  </div>
                  <a
                    href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>

                {/* Sizing dossier */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                    {lang === 'ar' ? 'ملف المقاسات الدقيقة' : 'Measurements & Profile'}
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-zinc-300">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Shoe:</span>
                      <span className="font-bold text-white">{client.shoeSize || '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Ring:</span>
                      <span className="font-bold text-white">{client.ringSize || '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">RTW:</span>
                      <span className="font-bold text-white truncate block">{client.rtwSize || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1 text-zinc-400">
                  <span>{client.phone}</span>
                  <span>Currency: <strong className="text-white">{client.currency}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">ID: {client.id}</span>
                <button
                  onClick={() => onNewOrderForClient(client.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  + {lang === 'ar' ? 'طلب توريد' : 'Sourcing Job'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
