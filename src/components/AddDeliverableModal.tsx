import React, { useState } from 'react';
import { Plus, X, Image, Video, Box, Calendar, Clock, Sparkles } from 'lucide-react';
import { Project, DeliverableType } from '../types/clientgate';

interface AddDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId?: string;
  onAddDeliverable: (deliverable: {
    projectId: string;
    title: string;
    version: string;
    type: DeliverableType;
    revisionLimit: number;
    deadline: string;
    notesFromAgency: string;
  }) => void;
}

export const AddDeliverableModal: React.FC<AddDeliverableModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onAddDeliverable,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjectId || projects[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [type, setType] = useState<DeliverableType>('image');
  const [revisionLimit, setRevisionLimit] = useState<number>(2);
  const [deadline, setDeadline] = useState('In 3 days, 5:00 PM');
  const [notesFromAgency, setNotesFromAgency] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProjectId) return;

    onAddDeliverable({
      projectId: selectedProjectId,
      title: title.trim(),
      version: version.trim() || 'v1.0',
      type,
      revisionLimit,
      deadline,
      notesFromAgency: notesFromAgency.trim() || 'Please review this milestone deliverable for sign-off.',
    });

    setTitle('');
    setNotesFromAgency('');
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
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Attach New Deliverable
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Publish an asset to the client magic portal for review, revision tracking, and sign-off.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Project Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Select Client Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName} — {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Deliverable Title & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-slate-300 font-medium mb-1.5">
                Deliverable Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Social Cutdown 15s Teaser v1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Asset Type Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Asset Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('image')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  type === 'image'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Image className="w-3.5 h-3.5" />
                <span>Image / Brand</span>
              </button>
              <button
                type="button"
                onClick={() => setType('video')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  type === 'video'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video / Motion</span>
              </button>
              <button
                type="button"
                onClick={() => setType('render3d')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  type === 'render3d'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D / Render</span>
              </button>
            </div>
          </div>

          {/* Revision Limit & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Included Revision Limit
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={revisionLimit}
                onChange={(e) => setRevisionLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Sign-off Deadline
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Oct 8, 2026, 5:00 PM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Agency Review Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Reviewer Instructions & Notes
            </label>
            <textarea
              rows={3}
              value={notesFromAgency}
              onChange={(e) => setNotesFromAgency(e.target.value)}
              placeholder="Provide context for the client on what to examine (e.g. check typography specs, color grading, pacing)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500 leading-relaxed placeholder-slate-500 font-sans"
            />
          </div>

          {/* Submit */}
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
              disabled={!title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Deliverable</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
