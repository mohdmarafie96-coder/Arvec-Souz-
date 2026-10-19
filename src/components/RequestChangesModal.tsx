import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Clock, X, Send } from 'lucide-react';
import { Project, Deliverable } from '../types/clientgate';

interface RequestChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  deliverable: Deliverable;
  activeTimecode?: string | null;
  onSubmitRevisions: (details: {
    feedback: string;
    isScopeAdjustment: boolean;
    timecode?: string;
  }) => void;
}

export const RequestChangesModal: React.FC<RequestChangesModalProps> = ({
  isOpen,
  onClose,
  project,
  deliverable,
  activeTimecode,
  onSubmitRevisions,
}) => {
  const [feedback, setFeedback] = useState('');
  const [isScopeAdjustment, setIsScopeAdjustment] = useState(false);
  const [attachTimecode, setAttachTimecode] = useState(Boolean(activeTimecode));

  if (!isOpen) return null;

  const revisionsRemaining = Math.max(0, deliverable.revisionLimit - deliverable.revisionsUsed);
  const isAtLimit = deliverable.revisionsUsed >= deliverable.revisionLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    onSubmitRevisions({
      feedback: feedback.trim(),
      isScopeAdjustment,
      timecode: attachTimecode && activeTimecode ? activeTimecode : undefined,
    });
    setFeedback('');
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
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Request Deliverable Revisions
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {project.clientName} · {deliverable.title} ({deliverable.version})
          </p>
        </div>

        {/* Scope & Revision Counter Warning */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between font-mono ${
            isAtLimit
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="space-y-0.5">
            <span className="font-bold">
              {isAtLimit ? 'Included Revision Limit Reached' : 'Revision Scope Status'}
            </span>
            <div className="text-[11px] opacity-80">
              {deliverable.revisionsUsed} of {deliverable.revisionLimit} complimentary revisions used
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-900 font-bold text-xs border border-slate-700">
            {revisionsRemaining} remaining
          </span>
        </div>

        {/* Revision Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {activeTimecode && (
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attachTimecode}
                onChange={(e) => setAttachTimecode(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Anchor revision note to current timecode: <strong>{activeTimecode}</strong></span>
              </span>
            </label>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Specific Changes Requested *
            </label>
            <textarea
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe clearly what needs adjusting (e.g. typography sizing, color contrast, timing adjustments)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white font-sans text-xs focus:outline-none focus:border-amber-500 leading-relaxed placeholder-slate-500"
            />
          </div>

          {/* Scope-breaking Checkbox */}
          <label className="flex items-start gap-2.5 text-slate-400 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isScopeAdjustment}
              onChange={(e) => setIsScopeAdjustment(e.target.checked)}
              className="mt-0.5 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px] leading-relaxed">
              Flag as Scope Adjustment: This revision introduces elements outside the initial design brief and may require an addendum fee.
            </span>
          </label>

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
              disabled={!feedback.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-amber-600/20 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Revision Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
