/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw,
  Shuffle,
  Wand2,
  BookOpen,
  Settings,
  HelpCircle,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FaceColors, FaceName, MoveNotation, MoveQueueItem, SolveRecord, TimerStatus, ColorThemeKey } from './types/cube';
import { RubiksScene } from './components/RubiksScene';
import { SpeedTimer } from './components/SpeedTimer';
import { KeyboardHUD } from './components/KeyboardHUD';
import { AlgorithmsModal } from './components/AlgorithmsModal';
import { SettingsModal } from './components/SettingsModal';
import { generateScramble, parseAlgorithm, parseMoveString, invertAlgorithm, getInverseMove } from './utils/scramble';
import { COLOR_THEMES } from './utils/themes';
import { soundFx } from './utils/audio';

const STORAGE_SOLVES_KEY = 'rubiks_studio_solves_v1';
const STORAGE_SETTINGS_KEY = 'rubiks_studio_settings_v1';

export default function App() {
  // Cube configuration
  const [cubeSize, setCubeSize] = useState<2 | 3>(3);
  const [currentTheme, setCurrentTheme] = useState<ColorThemeKey>('classic');
  const [animationSpeed, setAnimationSpeed] = useState<number>(180);
  const [inspectionEnabled, setInspectionEnabled] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Gameplay & Solver State
  const [currentScramble, setCurrentScramble] = useState<string>('');
  const [isSolved, setIsSolved] = useState<boolean>(true);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [movesCount, setMovesCount] = useState<number>(0);
  const [movesHistory, setMovesHistory] = useState<MoveQueueItem[]>([]);
  const [externalMoveQueue, setExternalMoveQueue] = useState<MoveQueueItem[]>([]);
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);

  // Modals & HUD
  const [isAlgorithmsOpen, setIsAlgorithmsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [activeFaceButtonsVisible, setActiveFaceButtonsVisible] = useState<boolean>(false);

  // High Scores & Solve Records
  const [solves, setSolves] = useState<SolveRecord[]>([]);

  // Load saved solves & settings from localStorage
  useEffect(() => {
    try {
      const savedSolves = localStorage.getItem(STORAGE_SOLVES_KEY);
      if (savedSolves) setSolves(JSON.parse(savedSolves));

      const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.cubeSize) setCubeSize(parsed.cubeSize);
        if (parsed.theme) setCurrentTheme(parsed.theme);
        if (parsed.speed) setAnimationSpeed(parsed.speed);
        if (parsed.inspection !== undefined) setInspectionEnabled(parsed.inspection);
        if (parsed.muted !== undefined) {
          setIsMuted(parsed.muted);
          soundFx.setMuted(parsed.muted);
        }
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  // Save settings on update
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_SETTINGS_KEY,
        JSON.stringify({
          cubeSize,
          theme: currentTheme,
          speed: animationSpeed,
          inspection: inspectionEnabled,
          muted: isMuted,
        })
      );
    } catch {
      // LocalStorage fallback
    }
  }, [cubeSize, currentTheme, animationSpeed, inspectionEnabled, isMuted]);

  // Generate initial scramble
  useEffect(() => {
    setCurrentScramble(generateScramble(cubeSize));
  }, [cubeSize]);

  // Queue a single or double move notation
  const handleTriggerMove = useCallback(
    (notation: MoveNotation) => {
      const item = parseMoveString(notation);
      if (!item) return;

      setExternalMoveQueue((prev) => [...prev, item]);
      setMovesHistory((prev) => [...prev, item]);
      setMovesCount((prev) => prev + 1);
      setIsSolved(false);

      setLastPressedKey(notation);
      setTimeout(() => setLastPressedKey(null), 300);
    },
    []
  );

  // Clear top item from move queue once processed by Three.js
  const handleClearQueueItem = useCallback(() => {
    setExternalMoveQueue((prev) => prev.slice(1));
  }, []);

  // Callback when a 3D slice finishes turning
  const handleMoveComplete = useCallback((_move: MoveNotation, solved: boolean) => {
    setIsSolved(solved);
  }, []);

  // Execute a WCA scramble
  const handleApplyScramble = useCallback(() => {
    const scramble = generateScramble(cubeSize);
    setCurrentScramble(scramble);
    const parsedMoves = parseAlgorithm(scramble);

    // Apply with fast snappy duration for scramble
    const fastMoves = parsedMoves.map((m) => ({
      ...m,
      duration: Math.min(80, animationSpeed * 0.5),
    }));

    setExternalMoveQueue((prev) => [...prev, ...fastMoves]);
    setMovesHistory(fastMoves);
    setMovesCount(0);
    setIsSolved(false);
    setTimerStatus('idle');
  }, [cubeSize, animationSpeed]);

  // Undo last move
  const handleUndoMove = useCallback(() => {
    if (movesHistory.length === 0) return;
    const lastMove = movesHistory[movesHistory.length - 1];
    const inverse = getInverseMove(lastMove);

    setExternalMoveQueue((prev) => [...prev, inverse]);
    setMovesHistory((prev) => prev.slice(0, -1));
    setMovesCount((prev) => Math.max(0, prev - 1));
  }, [movesHistory]);

  // Auto-Solve: rewind all applied moves back to solved state smoothly
  const handleAutoSolve = useCallback(() => {
    if (movesHistory.length === 0) {
      setIsSolved(true);
      return;
    }

    const unwindingMoves = invertAlgorithm(movesHistory).map((m) => ({
      ...m,
      duration: Math.min(90, animationSpeed * 0.6),
    }));

    setExternalMoveQueue((prev) => [...prev, ...unwindingMoves]);
    setMovesHistory([]);
    setMovesCount(0);
  }, [movesHistory, animationSpeed]);

  // Execute an algorithm from the modal library
  const handleExecuteAlgorithm = useCallback(
    (algString: string) => {
      const parsed = parseAlgorithm(algString);
      setExternalMoveQueue((prev) => [...prev, ...parsed]);
      setMovesHistory((prev) => [...prev, ...parsed]);
      setMovesCount((prev) => prev + parsed.length);
      setIsSolved(false);
    },
    []
  );

  // Save solve record
  const handleSolveFinished = useCallback((record: SolveRecord) => {
    setSolves((prev) => {
      const updated = [record, ...prev];
      try {
        localStorage.setItem(STORAGE_SOLVES_KEY, JSON.stringify(updated));
      } catch {
        // LocalStorage fallback
      }
      return updated;
    });
  }, []);

  // Clear records
  const handleClearSolves = useCallback(() => {
    setSolves([]);
    try {
      localStorage.removeItem(STORAGE_SOLVES_KEY);
    } catch {
      // LocalStorage fallback
    }
  }, []);

  // Global Keyboard listener for cube face moves (U, D, L, R, F, B, M, E, S, and arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or modal is open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isAlgorithmsOpen ||
        isSettingsOpen ||
        isHelpOpen
      ) {
        return;
      }

      // Undo with Ctrl+Z or Backspace
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'Backspace') {
        e.preventDefault();
        handleUndoMove();
        return;
      }

      // Cube rotation shortcuts via Arrow keys
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleTriggerMove("x'" as MoveNotation);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleTriggerMove('x' as MoveNotation);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleTriggerMove("y'" as MoveNotation);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleTriggerMove('y' as MoveNotation);
        return;
      }

      // Face keys: U, D, L, R, F, B, M, E, S
      const key = e.key.toUpperCase();
      const validFaces: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B'];
      const validSlices = ['M', 'E', 'S'];

      if (validFaces.includes(key as FaceName) || validSlices.includes(key)) {
        e.preventDefault();
        const notation = (e.shiftKey ? `${key}'` : key) as MoveNotation;
        handleTriggerMove(notation);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTriggerMove,
    handleUndoMove,
    isAlgorithmsOpen,
    isSettingsOpen,
    isHelpOpen,
  ]);

  // Compute best solve time
  const bestSolveMs = solves.length > 0 ? Math.min(...solves.map((s) => s.timeMs)) : null;
  const formatTimeBrief = (ms: number) => {
    const sec = (ms / 1000).toFixed(2);
    return `${sec}s`;
  };

  const activeColors: FaceColors = COLOR_THEMES[currentTheme].colors;

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* 1. TOP BAR (Strict 3-zone Top Bar Contract: Brand, Links/Tools, Primary Actions) */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Rubik's Studio 3D
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {cubeSize}x{cubeSize}
          </span>
        </div>

        {/* Zone 2: Navigation Links / Interactive Modals */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsAlgorithmsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Algorithms</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all active:scale-95"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors"
            title="How to play and keyboard shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              soundFx.setMuted(next);
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Scramble & Solve/Reset) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyScramble}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all active:scale-95 shadow-sm whitespace-nowrap"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Scramble</span>
          </button>

          <button
            onClick={handleAutoSolve}
            title="Smoothly rewind or restore solved state"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all active:scale-95 shadow-md shadow-blue-600/20 whitespace-nowrap"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto Solve</span>
            <span className="sm:hidden">Solve</span>
          </button>
        </div>
      </header>

      {/* 2. SCRAMBLE NOTATION BANNER & QUICK STATS */}
      <div className="absolute top-16 inset-x-0 z-20 flex flex-col items-center pointer-events-none px-4">
        {currentScramble && (
          <div className="pointer-events-auto max-w-xl text-center bg-slate-900/60 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-slate-800/70 shadow-lg">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">
              WCA Scramble
            </span>
            <span className="font-mono text-xs sm:text-sm font-semibold text-slate-200 tracking-wider break-words">
              {currentScramble}
            </span>
          </div>
        )}

        {/* Personal Best Pill */}
        {bestSolveMs !== null && (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-amber-400/90 bg-amber-950/40 border border-amber-500/20 px-2.5 py-0.5 rounded-full pointer-events-auto">
            <Trophy className="w-3 h-3" />
            <span>PB: {formatTimeBrief(bestSolveMs)}</span>
          </div>
        )}
      </div>

      {/* 3. THREE.JS 3D INTERACTIVE SCENE */}
      <div className="w-full h-full">
        <RubiksScene
          cubeSize={cubeSize}
          colors={activeColors}
          animationSpeed={animationSpeed}
          onMoveComplete={handleMoveComplete}
          externalMoveQueue={externalMoveQueue}
          clearQueueItem={handleClearQueueItem}
          isInteractive={true}
        />
      </div>

      {/* 4. SPEEDCUBING TIMER (Centered Lower HUD) */}
      <div className="absolute bottom-24 sm:bottom-28 inset-x-0 z-20 flex justify-center pointer-events-none">
        <SpeedTimer
          status={timerStatus}
          setStatus={setTimerStatus}
          inspectionEnabled={inspectionEnabled}
          movesCount={movesCount}
          currentScramble={currentScramble}
          cubeSize={cubeSize}
          onSolveFinished={handleSolveFinished}
          isSolved={isSolved}
        />
      </div>

      {/* 5. BOTTOM KEYBOARD HUD & TOUCH CONTROLS */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center px-4">
        <KeyboardHUD
          onTriggerMove={handleTriggerMove}
          lastPressedKey={lastPressedKey}
          activeFaceButtonsVisible={activeFaceButtonsVisible}
          toggleFaceButtons={() => setActiveFaceButtonsVisible(!activeFaceButtonsVisible)}
        />
      </div>

      {/* 6. ALGORITHMS CODEX MODAL */}
      <AlgorithmsModal
        isOpen={isAlgorithmsOpen}
        onClose={() => setIsAlgorithmsOpen(false)}
        onExecuteAlgorithm={handleExecuteAlgorithm}
      />

      {/* 7. SETTINGS & SOLVE HISTORY MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cubeSize={cubeSize}
        setCubeSize={(size) => {
          setCubeSize(size);
          setMovesHistory([]);
          setMovesCount(0);
          setIsSolved(true);
        }}
        currentTheme={currentTheme}
        setTheme={setCurrentTheme}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        inspectionEnabled={inspectionEnabled}
        setInspectionEnabled={setInspectionEnabled}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        solves={solves}
        onClearSolves={handleClearSolves}
      />

      {/* 8. HELP & KEYBOARD CONTROLS MODAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                Controls & Shortcuts
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">🎮 3D Touch & Mouse Interaction</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-300">Click & Drag any sticker</strong>: physically turn that face in 3D.</li>
                  <li><strong className="text-slate-300">Drag background or Right-Click</strong>: orbit the camera smoothly 360°.</li>
                  <li><strong className="text-slate-300">Mouse Wheel</strong>: zoom in / out.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-1">⌨️ Standard Keyboard Face Turns</h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">U</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">Shift+U</kbd> : Up face</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">D</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">Shift+D</kbd> : Down face</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">L</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">Shift+L</kbd> : Left face</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">R</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">Shift+R</kbd> : Right face</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">F</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">Shift+F</kbd> : Front face</div>
                  <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">B</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">Shift+B</kbd> : Back face</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-1">🔄 Whole Cube Tilts & Timer</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-300">Arrow Keys</strong>: rotate/tilt the whole cube (X and Y axes).</li>
                  <li><strong className="text-slate-300">Spacebar</strong>: hold to arm the speedcubing timer, release to start! Press again to stop.</li>
                  <li><strong className="text-slate-300">Ctrl + Z or Backspace</strong>: undo your last move.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
