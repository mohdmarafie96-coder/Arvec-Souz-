import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, X, Sparkles } from 'lucide-react';
import { Project, Deliverable } from '../types/clientgate';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  deliverable: Deliverable;
  onConfirmApproval: (details: { signerName: string; signerRole: string }) => void;
}

export const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  onClose,
  project,
  deliverable,
  onConfirmApproval,
}) => {
  const [signerName, setSignerName] = useState(project.clientContact.name);
  const [signerRole, setSignerRole] = useState(project.clientContact.role);
  const [agreed, setAgreed] = useState(true);

  if (!isOpen) return null;

  const currentMilestone = project.milestones[project.currentMilestoneIndex];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !agreed) return;

    onConfirmApproval({
      signerName: signerName.trim(),
      signerRole: signerRole.trim() || 'Client Executive',
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
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Confirm Milestone Sign-Off
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {project.clientName} · {currentMilestone?.title || 'Deliverable Approval'}
          </p>
        </div>

        {/* Deliverable Review Summary */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>Deliverable:</span>
            <span className="font-semibold text-slate-200">{deliverable.title}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>Version Approved:</span>
            <span className="text-emerald-400 font-bold">{deliverable.version}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>Next Milestone:</span>
            <span className="text-indigo-300">
              {project.milestones[project.currentMilestoneIndex + 1]?.title || 'Final Project Delivery'}
            </span>
          </div>
        </div>

        {/* Signature Form */}
        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Signer Full Name *
            </label>
            <input
              type="text"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="e.g. Julian Vance"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Role / Title
            </label>
            <input
              type="text"
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              placeholder="e.g. Founder & CEO"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Legal Acknowledgement Checkbox */}
          <label className="flex items-start gap-2.5 text-slate-400 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px] leading-relaxed">
              I officially approve this deliverable as completed. I understand this locks this phase, logs a cryptographically signed approval receipt, and initiates the next milestone.
            </span>
          </label>

          {/* Action Buttons */}
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
              disabled={!signerName.trim() || !agreed}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Lock Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
