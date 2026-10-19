import React, { useState } from 'react';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Search,
  Grid3X3,
  ListFilter,
  Send,
  BellRing,
  Sparkles,
  Smartphone,
  Mail,
} from 'lucide-react';
import { Project, ProjectStatus, NudgeLogEntry } from '../types/clientgate';

interface AgencyDashboardProps {
  projects: Project[];
  nudgeLogs: NudgeLogEntry[];
  onOpenClientPortal: (projectId: string) => void;
  onOpenAddDeliverable: (projectId: string) => void;
  onCopyMagicLink: (project: Project) => void;
  onTriggerManualNudge: () => void;
  copiedToken: string | null;
}

export const AgencyDashboard: React.FC<AgencyDashboardProps> = ({
  projects,
  nudgeLogs,
  onOpenClientPortal,
  onOpenAddDeliverable,
  onCopyMagicLink,
  onTriggerManualNudge,
  copiedToken,
}) => {
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Compute metrics
  const activeProjectsCount = projects.length;
  const pendingSignOffsCount = projects.filter((p) => p.status === 'Awaiting Client').length;
  const revisionsCount = projects.filter((p) => p.status === 'Revisions Requested').length;
  const approvedCount = projects.filter((p) => p.status === 'Approved').length;

  const avgTurnaround = (
    projects.reduce((acc, p) => acc + p.turnaroundHours, 0) / (projects.length || 1)
  ).toFixed(1);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch =
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner & Metrics Bar */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Agency Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Active client delivery pipelines, pending sign-offs, and automated review nudges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddDeliverable(projects[0]?.id)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Deliverable</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Projects</span>
              <FolderKanban className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {activeProjectsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across 3 creative disciplines
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Sign-Offs</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-300 font-mono tabular-nums">
              {pendingSignOffsCount}
            </div>
            <div className="text-xs text-amber-400/80 mt-1">
              Awaiting client approval
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Avg. Turnaround</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {avgTurnaround}
              <span className="text-sm font-normal text-slate-400 ml-1">hrs</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              4.2h faster than agency baseline
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Approval Health</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-300 font-mono tabular-nums">
              88%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              First-round sign-off rate
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Layout: Projects (2/3) + Client Nudge Log (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Projects Grid / List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Controls Bar: Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Projects ({activeProjectsCount})
              </button>
              <button
                onClick={() => setFilter('Awaiting Client')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'Awaiting Client'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Awaiting ({pendingSignOffsCount})
              </button>
              <button
                onClick={() => setFilter('Revisions Requested')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'Revisions Requested'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Revisions ({revisionsCount})
              </button>
              <button
                onClick={() => setFilter('Approved')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'Approved'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved ({approvedCount})
              </button>
            </div>

            {/* Search Input & View Switcher */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter client or title..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    layoutMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    layoutMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Compact List View"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Projects Content: Grid or List */}
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <FolderKanban className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">No projects match the selected filter.</p>
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Clear filter & show all
              </button>
            </div>
          ) : layoutMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProjects.map((project) => {
                const activeDeliverable =
                  project.deliverables.find((d) => d.id === project.activeDeliverableId) ||
                  project.deliverables[0];

                const currentMilestone = project.milestones[project.currentMilestoneIndex];
                const totalMilestones = project.milestones.length;
                const progressPercent = Math.round(
                  ((project.currentMilestoneIndex + (project.status === 'Approved' ? 1 : 0.5)) /
                    totalMilestones) *
                    100
                );

                return (
                  <div
                    key={project.id}
                    className="group rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    {/* Top Row: Client Name, Category & Status Tag */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                            {project.clientContact.avatarInitials}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {project.clientName}
                            </h3>
                            <div className="text-[11px] text-slate-400">
                              {project.clientContact.name} · {project.clientContact.role}
                            </div>
                          </div>
                        </div>

                        {/* Status Tag */}
                        {project.status === 'Awaiting Client' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Awaiting Client
                          </span>
                        )}
                        {project.status === 'Revisions Requested' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 font-mono">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            Revisions Requested
                          </span>
                        )}
                        {project.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Approved
                          </span>
                        )}
                      </div>

                      {/* Project Title & Category */}
                      <div>
                        <div className="text-xs font-medium text-slate-200 line-clamp-1">
                          {project.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {project.category}
                        </div>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono">
                            Step {project.currentMilestoneIndex + 1} of {totalMilestones}
                          </span>
                          <span className="text-indigo-400 font-mono font-semibold">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Active: <span className="text-slate-300">{currentMilestone?.title}</span>
                        </div>
                      </div>

                      {/* Active Deliverable Snapshot */}
                      {activeDeliverable && (
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-200 truncate">
                              {activeDeliverable.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                              {activeDeliverable.version}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>
                              Revisions: {activeDeliverable.revisionsUsed}/{activeDeliverable.revisionLimit}
                            </span>
                            <span>Due: {activeDeliverable.deadline}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onCopyMagicLink(project)}
                        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Copy Client Magic Link to Clipboard"
                      >
                        {copiedToken === project.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Magic Link</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenAddDeliverable(project.id)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Attach New Deliverable"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenClientPortal(project.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                          <span>Review Stage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact List View */
            <div className="divide-y divide-slate-800 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {project.clientName}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-xs text-slate-400 truncate">{project.title}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Step {project.currentMilestoneIndex + 1} of {project.milestones.length} ·{' '}
                      {project.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => onCopyMagicLink(project)}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedToken === project.token ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Link</span>
                    </button>
                    <button
                      onClick={() => onOpenClientPortal(project.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Client Nudge Log (Live Activity Sidebar - 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Automated Nudge Engine
                </h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active (+48h)
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatches gentle, executive reminders to non-technical clients via WhatsApp & Email when review approvals stall.
            </p>

            {/* Nudge Activity Feed */}
            <div className="space-y-3 pt-1">
              {nudgeLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-slate-200">
                      {entry.channel === 'whatsapp' ? (
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>{entry.clientName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{entry.timeAgo}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {entry.projectTitle} · {entry.deliverableTitle}
                  </div>

                  <p className="text-[11px] text-slate-300 italic bg-slate-900/80 p-2 rounded border border-slate-800/50 leading-relaxed font-sans">
                    "{entry.messageSnippet}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                    <span>To: {entry.recipient}</span>
                    <span
                      className={`font-semibold ${
                        entry.status === 'Delivered & Read'
                          ? 'text-emerald-400'
                          : entry.status === 'Scheduled (+48h)'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Trigger Nudge Button */}
            <div className="pt-2">
              <button
                onClick={onTriggerManualNudge}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-98"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dispatch Instant WhatsApp Nudge</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
