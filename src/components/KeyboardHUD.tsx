import React from 'react';
import { FaceName, MoveNotation } from '../types/cube';

interface KeyboardHUDProps {
  onTriggerMove: (notation: MoveNotation) => void;
  lastPressedKey: string | null;
  activeFaceButtonsVisible: boolean;
  toggleFaceButtons: () => void;
}

export const KeyboardHUD: React.FC<KeyboardHUDProps> = ({
  onTriggerMove,
  lastPressedKey,
  activeFaceButtonsVisible,
  toggleFaceButtons,
}) => {
  const faces: { name: FaceName; label: string; cw: MoveNotation; ccw: MoveNotation }[] = [
    { name: 'U', label: 'Up', cw: 'U', ccw: "U'" },
    { name: 'D', label: 'Down', cw: 'D', ccw: "D'" },
    { name: 'L', label: 'Left', cw: 'L', ccw: "L'" },
    { name: 'R', label: 'Right', cw: 'R', ccw: "R'" },
    { name: 'F', label: 'Front', cw: 'F', ccw: "F'" },
    { name: 'B', label: 'Back', cw: 'B', ccw: "B'" },
  ];

  return (
    <div className="flex flex-col items-center gap-2 pointer-events-auto">
      {/* On-Screen Touch / Click Turn Dock */}
      {activeFaceButtonsVisible && (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2 px-3 shadow-2xl flex flex-wrap justify-center gap-1.5 max-w-lg transition-all">
          {faces.map((f) => {
            const isCwActive = lastPressedKey?.toUpperCase() === f.cw;
            const isCcwActive = lastPressedKey?.toUpperCase() === f.ccw;

            return (
              <div key={f.name} className="flex items-center bg-slate-950/60 rounded-xl p-1 border border-slate-800/50">
                <button
                  onClick={() => onTriggerMove(f.cw)}
                  title={`${f.label} Clockwise [Key: ${f.name}]`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    isCwActive
                      ? 'bg-blue-600 text-white scale-95 shadow-md shadow-blue-500/20'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {f.cw}
                </button>
                <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                <button
                  onClick={() => onTriggerMove(f.ccw)}
                  title={`${f.label} Counter-Clockwise [Key: Shift+${f.name}]`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    isCcwActive
                      ? 'bg-blue-600 text-white scale-95 shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {f.ccw}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Keyboard Quick Bar Indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800/60">
        <span className="hidden sm:inline">Keys:</span>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          {['U', 'D', 'L', 'R', 'F', 'B'].map((k) => (
            <kbd
              key={k}
              className={`px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold transition-colors ${
                lastPressedKey?.toUpperCase() === k ? 'bg-blue-600 text-white border-blue-500' : 'text-slate-300'
              }`}
            >
              {k}
            </kbd>
          ))}
          <span className="text-slate-500 mx-1">·</span>
          <span className="text-slate-400 text-[11px]">Shift for ( ' ) prime</span>
        </div>

        <button
          onClick={toggleFaceButtons}
          className="ml-2 text-slate-400 hover:text-slate-200 transition-colors underline decoration-slate-600 underline-offset-4 text-[11px]"
        >
          {activeFaceButtonsVisible ? 'Hide Buttons' : 'Show Buttons'}
        </button>
      </div>
    </div>
  );
};
