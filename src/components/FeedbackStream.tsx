import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Clock,
  MapPin,
  AlertTriangle,
  UserCheck,
  Building,
} from 'lucide-react';
import { Comment, AuthorRole } from '../types/clientgate';

interface FeedbackStreamProps {
  comments: Comment[];
  clientName: string;
  defaultAuthorName: string;
  onAddComment: (comment: {
    author: string;
    authorRole: AuthorRole;
    content: string;
    timecode?: string;
    isScopeAdjustment?: boolean;
  }) => void;
  activeTaggedTimestamp?: string | null;
  onClearTaggedTimestamp?: () => void;
}

export const FeedbackStream: React.FC<FeedbackStreamProps> = ({
  comments,
  clientName,
  defaultAuthorName,
  onAddComment,
  activeTaggedTimestamp,
  onClearTaggedTimestamp,
}) => {
  const [content, setContent] = useState('');
  const [role, setRole] = useState<AuthorRole>('client');
  const [isScopeAdjustment, setIsScopeAdjustment] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const authorName =
      role === 'client'
        ? `${defaultAuthorName} (Client)`
        : 'Sora Lind (Agency Creative Lead)';

    onAddComment({
      author: authorName,
      authorRole: role,
      content: content.trim(),
      timecode: activeTaggedTimestamp || undefined,
      isScopeAdjustment,
    });

    setContent('');
    setIsScopeAdjustment(false);
    if (onClearTaggedTimestamp) onClearTaggedTimestamp();
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Review Feedback & Discussion Thread
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {comments.length} notes
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          No sign-in required · Live synced
        </span>
      </div>

      {/* Add New Note Box */}
      <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        {/* Author Role Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Commenting as:</span>
            <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  role === 'client'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{defaultAuthorName} (Client)</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('agency')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  role === 'agency'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Vanguard Agency</span>
              </button>
            </div>
          </div>

          {/* Active Timecode Tag Badge */}
          {activeTaggedTimestamp && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Attached to {activeTaggedTimestamp}</span>
              {onClearTaggedTimestamp && (
                <button
                  type="button"
                  onClick={onClearTaggedTimestamp}
                  className="text-amber-400 hover:text-white ml-1 text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={
              role === 'client'
                ? 'Leave concise feedback, revision notes, or questions regarding this deliverable...'
                : 'Reply to client note or provide technical specification details...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
          />
        </div>

        {/* Bottom Options & Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isScopeAdjustment}
              onChange={(e) => setIsScopeAdjustment(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span>Flag as scope adjustment (outside original brief)</span>
              {isScopeAdjustment && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </span>
          </label>

          <button
            type="submit"
            disabled={!content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Note</span>
          </button>
        </div>
      </form>

      {/* List of Existing Notes */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const isClient = comment.authorRole === 'client';

          return (
            <div
              key={comment.id}
              className={`p-4 rounded-xl border transition-colors space-y-2 text-xs ${
                isClient
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-indigo-950/20 border-indigo-900/40 hover:border-indigo-800/60'
              }`}
            >
              {/* Comment Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isClient
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {isClient ? 'C' : 'A'}
                  </div>
                  <span className="font-semibold text-slate-200">
                    {comment.author}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isClient
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    }`}
                  >
                    {isClient ? 'Client' : 'Agency Lead'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                  {comment.timecode && (
                    <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {comment.timecode}
                    </span>
                  )}
                  {comment.pinLocation && (
                    <span className="inline-flex items-center gap-1 text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      <MapPin className="w-3 h-3 text-indigo-400" />
                      Pin ({comment.pinLocation.x}%, {comment.pinLocation.y}%)
                    </span>
                  )}
                  <span>{comment.timestamp}</span>
                </div>
              </div>

              {/* Comment Body */}
              <p className="text-slate-300 leading-relaxed font-sans text-xs pt-1">
                {comment.content}
              </p>

              {/* Scope Adjustment Warning Badge */}
              {comment.isScopeAdjustment && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded font-mono mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Flagged as Scope Adjustment: Will be billed under revision addendum #02.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
