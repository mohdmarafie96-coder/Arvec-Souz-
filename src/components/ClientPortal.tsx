import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Share2,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Project, Deliverable } from '../types/clientgate';
import { ImageInspectionStage } from './ImageInspectionStage';
import { VideoPreviewStage } from './VideoPreviewStage';
import { FeedbackStream } from './FeedbackStream';

interface ClientPortalProps {
  project: Project;
  onApproveClick: (deliverable: Deliverable) => void;
  onRequestChangesClick: (deliverable: Deliverable) => void;
  onAddComment: (comment: {
    author: string;
    authorRole: 'client' | 'agency';
    content: string;
    timecode?: string;
    isScopeAdjustment?: boolean;
  }) => void;
  onCopyMagicLink: (project: Project) => void;
  copiedToken: string | null;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  project,
  onApproveClick,
  onRequestChangesClick,
  onAddComment,
  onCopyMagicLink,
  copiedToken,
}) => {
  const [taggedTimestamp, setTaggedTimestamp] = useState<string | null>(null);

  const activeDeliverable =
    project.deliverables.find((d) => d.id === project.activeDeliverableId) ||
    project.deliverables[0];

  const currentMilestone = project.milestones[project.currentMilestoneIndex];
  const isApproved = project.status === 'Approved' || activeDeliverable?.status === 'Approved';
  const isRevisions = project.status === 'Revisions Requested';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* 1. Executive Brand Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
              <span>{project.agencyName}</span>
              <span className="text-slate-600">/</span>
              <span>Client Review Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {project.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Prepared exclusively for <strong className="text-slate-200">{project.clientName}</strong> · Reviewer: {project.clientContact.name} ({project.clientContact.role})
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onCopyMagicLink(project)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
              title="Copy shareable link"
            >
              {copiedToken === project.token ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied URL</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share Portal</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Milestone High-Level Progress Tracker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 tracking-wide">
              Project Milestone Tracker
            </span>
            <span className="text-indigo-400 font-mono text-[11px]">
              Step {project.currentMilestoneIndex + 1} of {project.milestones.length} Active
            </span>
          </div>

          {/* Stepper Chain */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {project.milestones.map((ms, index) => {
              const isPast = index < project.currentMilestoneIndex;
              const isCurrent = index === project.currentMilestoneIndex;
              const isFuture = index > project.currentMilestoneIndex;

              return (
                <div
                  key={ms.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                    isPast
                      ? 'bg-slate-950/60 border-emerald-500/30 text-slate-300'
                      : isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold">0{ms.stepNumber}</span>
                    {isPast && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        In Review
                      </span>
                    )}
                    {isFuture && <span>Upcoming</span>}
                  </div>
                  <div className="font-medium text-[11px] truncate" title={ms.title}>
                    {ms.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Asset Stage */}
      {activeDeliverable && (
        <div className="space-y-4">
          {/* Active Deliverable Lead-In & Instructions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {activeDeliverable.title}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {activeDeliverable.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeDeliverable.notesFromAgency}
              </p>
            </div>

            {/* Status Indicator Tag */}
            <div className="shrink-0">
              {isApproved ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Approved & Signed Off</span>
                </div>
              ) : isRevisions ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Revisions In Progress</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Awaiting Your Approval</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Inspection Canvas or Video Player */}
          {activeDeliverable.type === 'video' ? (
            <VideoPreviewStage
              deliverable={activeDeliverable}
              onTagTimestamp={(timeStr) => setTaggedTimestamp(timeStr)}
            />
          ) : (
            <ImageInspectionStage
              deliverable={activeDeliverable}
              projectCategory={project.category}
              onDropPin={(pin) => {
                setTaggedTimestamp(`Pin (${pin.x}%, ${pin.y}%)`);
              }}
            />
          )}

          {/* Persistent High-Contrast Executive Action Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Context: Revision scope & Deadline */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="font-semibold text-white">Review Deadline:</span>
                <span className="font-mono text-amber-300">{activeDeliverable.deadline}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Revision Policy: {activeDeliverable.revisionsUsed} of {activeDeliverable.revisionLimit} included revisions used
              </div>
            </div>

            {/* Right Buttons: Approve vs Request Changes */}
            <div className="flex items-center gap-3">
              {isApproved ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Phase Approved ({activeDeliverable.approvedBy?.name || project.clientContact.name})</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onRequestChangesClick(activeDeliverable)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    onClick={() => onApproveClick(activeDeliverable)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Deliverable</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Feedback & Comment Stream */}
      {activeDeliverable && (
        <FeedbackStream
          comments={activeDeliverable.comments}
          clientName={project.clientName}
          defaultAuthorName={project.clientContact.name}
          onAddComment={onAddComment}
          activeTaggedTimestamp={taggedTimestamp}
          onClearTaggedTimestamp={() => setTaggedTimestamp(null)}
        />
      )}
    </div>
  );
};
