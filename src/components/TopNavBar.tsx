import React from 'react';
import {
  LayoutDashboard,
  ExternalLink,
  Plus,
  Share2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Project, ActiveView } from '../types/clientgate';

interface TopNavBarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenAddDeliverable: (projectId: string) => void;
  onCopyMagicLink: (project: Project) => void;
  copiedToken: string | null;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeView,
  onViewChange,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenAddDeliverable,
  onCopyMagicLink,
  copiedToken,
}) => {
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-white text-base shadow-sm">
              C
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              ClientGate
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            / Vanguard Creative Studio
          </span>
        </div>

        {/* Zone 2: Primary View Switcher & Project Quick Picker */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => onViewChange('agency')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeView === 'agency'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Agency Command</span>
            </button>

            <button
              onClick={() => onViewChange('client')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeView === 'client'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </button>
          </div>

          {/* If viewing Client Portal, show interactive project selector */}
          {activeView === 'client' && (
            <div className="relative flex items-center">
              <span className="text-xs text-slate-500 hidden md:inline mr-2">
                Viewing as:
              </span>
              <div className="relative">
                <select
                  value={currentProject?.id}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-700/80 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                      {p.clientName} ({p.title.split('-')[0].trim()})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentProject && (
            <button
              onClick={() => onCopyMagicLink(currentProject)}
              title="Copy Client Magic Sign-off Link"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copiedToken === currentProject.token ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold hidden sm:inline">Copied Link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Magic Link</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onOpenAddDeliverable(currentProject?.id || projects[0]?.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Deliverable</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
