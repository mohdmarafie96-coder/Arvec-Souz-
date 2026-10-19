import React, { useState } from 'react';
import { Send, Smartphone, Mail, X, Check } from 'lucide-react';
import { Project } from '../types/clientgate';

interface ManualNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSendNudge: (nudge: {
    projectId: string;
    channel: 'whatsapp' | 'email';
    message: string;
  }) => void;
}

export const ManualNudgeModal: React.FC<ManualNudgeModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSendNudge,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const defaultMsg =
    channel === 'whatsapp'
      ? `Hi ${selectedProject?.clientContact.name.split(' ')[0]}! Sora here from Vanguard Studio. Your latest deliverable (${selectedProject?.title.split('-')[0].trim()}) is awaiting your sign-off to advance to the next milestone.`
      : `Dear ${selectedProject?.clientContact.name},\n\nA gentle reminder that your project deliverable for ${selectedProject?.title} is awaiting review on your ClientGate portal.\n\nPlease review and approve when convenient to keep our production schedule on track.`;

  const [message, setMessage] = useState(defaultMsg);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedProjectId) return;

    onSendNudge({
      projectId: selectedProjectId,
      channel,
      message: message.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Dispatch Client Nudge
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Send an executive reminder directly to the client's WhatsApp or work inbox.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Client Project Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Select Client *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                const proj = projects.find((p) => p.id === e.target.value);
                if (proj) {
                  setMessage(
                    channel === 'whatsapp'
                      ? `Hi ${proj.clientContact.name.split(' ')[0]}! Sora here from Vanguard Studio. Your latest deliverable (${proj.title.split('-')[0].trim()}) is awaiting your sign-off to advance to the next milestone.`
                      : `Dear ${proj.clientContact.name},\n\nA gentle reminder that your project deliverable for ${proj.title} is awaiting review on your ClientGate portal.`
                  );
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName} ({p.clientContact.name} · {p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Channel selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Delivery Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setChannel('whatsapp');
                  setMessage(
                    `Hi ${selectedProject?.clientContact.name.split(' ')[0]}! Sora here from Vanguard Studio. Your latest deliverable (${selectedProject?.title.split('-')[0].trim()}) is awaiting your sign-off to advance to the next milestone.`
                  );
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Instant Ping</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChannel('email');
                  setMessage(
                    `Dear ${selectedProject?.clientContact.name},\n\nA gentle reminder that your project deliverable for ${selectedProject?.title} is awaiting review on your ClientGate portal.`
                  );
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  channel === 'email'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Executive Email Digest</span>
              </button>
            </div>
          </div>

          {/* Recipient Snapshot */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Recipient:</span>
            <span className="text-slate-200 font-semibold">
              {channel === 'whatsapp'
                ? selectedProject?.clientContact.phone
                : selectedProject?.clientContact.email}
            </span>
          </div>

          {/* Message textarea */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Message Content
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
