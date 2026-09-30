import React from 'react';
import { X, Volume2, VolumeX, Gauge, Palette, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { ColorThemeKey, SolveRecord } from '../types/cube';
import { COLOR_THEMES } from '../utils/themes';
import { soundFx } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cubeSize: 2 | 3;
  setCubeSize: (size: 2 | 3) => void;
  currentTheme: ColorThemeKey;
  setTheme: (theme: ColorThemeKey) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  inspectionEnabled: boolean;
  setInspectionEnabled: (val: boolean) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  solves: SolveRecord[];
  onClearSolves: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cubeSize,
  setCubeSize,
  currentTheme,
  setTheme,
  animationSpeed,
  setAnimationSpeed,
  inspectionEnabled,
  setInspectionEnabled,
  isMuted,
  setIsMuted,
  solves,
  onClearSolves,
}) => {
  if (!isOpen) return null;

  const speedOptions = [
    { label: 'Speedcuber', ms: 110 },
    { label: 'Snappy', ms: 175 },
    { label: 'Standard', ms: 250 },
    { label: 'Cinematic', ms: 380 },
  ];

  const formatMs = (ms: number) => {
    const sec = (ms / 1000).toFixed(2);
    return `${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">Cube Settings & Stats</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cube Dimension */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              Cube Dimensions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCubeSize(3)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  cubeSize === 3
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                3x3x3 Classic
              </button>
              <button
                onClick={() => setCubeSize(2)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  cubeSize === 2
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                2x2x2 Pocket
              </button>
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" />
              Color Palette
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(COLOR_THEMES) as ColorThemeKey[]).map((key) => {
                const theme = COLOR_THEMES[key];
                const isSelected = currentTheme === key;

                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-xs font-medium">{theme.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.U }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.R }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.F }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.D }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turn Animation Speed */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5" />
              Turn Animation Speed
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {speedOptions.map((opt) => (
                <button
                  key={opt.ms}
                  onClick={() => setAnimationSpeed(opt.ms)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    animationSpeed === opt.ms
                      ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{opt.ms}ms</div>
                </button>
              ))}
            </div>
          </div>

          {/* Inspection & Sound Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">WCA 15s Inspection</div>
                  <div className="text-[11px] text-slate-400">Countdown timer before solve begins</div>
                </div>
              </div>
              <button
                onClick={() => setInspectionEnabled(!inspectionEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  inspectionEnabled ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    inspectionEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-400" />}
                <div>
                  <div className="text-xs font-semibold text-slate-200">Mechanical Turn Sounds</div>
                  <div className="text-[11px] text-slate-400">Tactile plastic snaps & solve fanfare</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  soundFx.setMuted(next);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !isMuted ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    !isMuted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Recent Solves Table */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Solve History ({solves.length})
              </label>
              {solves.length > 0 && (
                <button
                  onClick={onClearSolves}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {solves.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                No recorded solves yet. Scramble and solve to log your times!
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
                {solves.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono w-5">#{solves.length - idx}</span>
                      <span className="font-mono font-bold text-slate-200">{formatMs(s.timeMs)}</span>
                      <span className="text-[10px] text-slate-400">({s.cubeSize}x{s.cubeSize})</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>{s.movesCount} moves</span>
                      <span>{s.tps} TPS</span>
                      <span className="text-slate-500 text-[10px]">{s.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
