/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shuffle,
  Wand2,
  BookOpen,
  Settings,
  HelpCircle,
  Trophy,
  Volume2,
  VolumeX,
  GraduationCap,
  Sparkles,
  LogIn,
  User,
  Layers,
  Grid,
  Zap,
} from 'lucide-react';
import { FaceColors, FaceName, MoveNotation, MoveQueueItem, SolveRecord, TimerStatus, ColorThemeKey } from './types/cube';
import { RubiksScene } from './components/RubiksScene';
import { SpeedTimer } from './components/SpeedTimer';
import { KeyboardHUD } from './components/KeyboardHUD';
import { AlgorithmsModal } from './components/AlgorithmsModal';
import { SettingsModal } from './components/SettingsModal';
import { RubiksTutorial } from './components/RubiksTutorial';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AuthErrorModal } from './components/AuthErrorModal';
import { SlidePuzzle } from './components/SlidePuzzle';
import { LightsOut } from './components/LightsOut';
import { ArvecLogo } from './components/ArvecLogo';
import { generateScramble, parseAlgorithm, parseMoveString, invertAlgorithm, getInverseMove } from './utils/scramble';
import { COLOR_THEMES } from './utils/themes';
import { soundFx } from './utils/audio';
import { useAuth } from './firebase/authContext';
import { saveGameSolve, getRankTitle } from './firebase/gameService';

const STORAGE_SOLVES_KEY = 'arvec_souz_solves_v1';
const STORAGE_SETTINGS_KEY = 'arvec_souz_settings_v1';

type ActiveGame = 'rubiks' | 'slide' | 'lights';

export default function App() {
  // Game Selector
  const [activeGame, setActiveGame] = useState<ActiveGame>('rubiks');

  // Firebase Auth & Points
  const { user, profile, loginWithGoogle, addPoints } = useAuth();

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
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isAlgorithmsOpen, setIsAlgorithmsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [activeFaceButtonsVisible, setActiveFaceButtonsVisible] = useState<boolean>(false);

  // High Scores & Solve Records
  const [solves, setSolves] = useState<SolveRecord[]>([]);

  // Load saved settings
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

  // Save settings
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

  // Initial scramble
  useEffect(() => {
    setCurrentScramble(generateScramble(cubeSize));
  }, [cubeSize]);

  // Queue move
  const handleTriggerMove = useCallback((notation: MoveNotation) => {
    const item = parseMoveString(notation);
    if (!item) return;

    setExternalMoveQueue((prev) => [...prev, item]);
    setMovesHistory((prev) => [...prev, item]);
    setMovesCount((prev) => prev + 1);
    setIsSolved(false);

    setLastPressedKey(notation);
    setTimeout(() => setLastPressedKey(null), 300);
  }, []);

  const handleClearQueueItem = useCallback(() => {
    setExternalMoveQueue((prev) => prev.slice(1));
  }, []);

  const handleMoveComplete = useCallback((_move: MoveNotation, solved: boolean) => {
    setIsSolved(solved);
  }, []);

  const handleApplyScramble = useCallback(() => {
    const scramble = generateScramble(cubeSize);
    setCurrentScramble(scramble);
    const parsedMoves = parseAlgorithm(scramble);

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

  const handleUndoMove = useCallback(() => {
    if (movesHistory.length === 0) return;
    const lastMove = movesHistory[movesHistory.length - 1];
    const inverse = getInverseMove(lastMove);

    setExternalMoveQueue((prev) => [...prev, inverse]);
    setMovesHistory((prev) => prev.slice(0, -1));
    setMovesCount((prev) => Math.max(0, prev - 1));
  }, [movesHistory]);

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

  const handleExecuteAlgorithm = useCallback((algString: string) => {
    const parsed = parseAlgorithm(algString);
    setExternalMoveQueue((prev) => [...prev, ...parsed]);
    setMovesHistory((prev) => [...prev, ...parsed]);
    setMovesCount((prev) => prev + parsed.length);
    setIsSolved(false);
  }, []);

  // Handle solo Rubik solve completion with points
  const handleSolveFinished = useCallback(
    (record: SolveRecord, pointsEarned: number) => {
      setSolves((prev) => {
        const updated = [record, ...prev];
        try {
          localStorage.setItem(STORAGE_SOLVES_KEY, JSON.stringify(updated));
        } catch {
          // fallback
        }
        return updated;
      });

      // Save to Firebase Firestore if logged in
      if (user) {
        saveGameSolve({
          id: `rubik_${Date.now()}`,
          userId: user.uid,
          userName: profile?.displayName || user.displayName || 'Player',
          gameType: cubeSize === 3 ? 'rubiks_3x3' : 'rubiks_2x2',
          timeMs: record.timeMs,
          movesCount: record.movesCount,
          pointsEarned,
          scramble: record.scramble,
          tps: record.tps,
          createdAt: new Date().toISOString(),
        });
        addPoints(pointsEarned, record.timeMs);
      }
    },
    [user, profile, cubeSize, addPoints]
  );

  const handleClearSolves = useCallback(() => {
    setSolves([]);
    try {
      localStorage.removeItem(STORAGE_SOLVES_KEY);
    } catch {
      // fallback
    }
  }, []);

  // Global Keyboard listener for cube face moves
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        activeGame !== 'rubiks' ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isAlgorithmsOpen ||
        isSettingsOpen ||
        isHelpOpen ||
        isTutorialOpen ||
        isLeaderboardOpen
      ) {
        return;
      }

      if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'Backspace') {
        e.preventDefault();
        handleUndoMove();
        return;
      }

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
    activeGame,
    handleTriggerMove,
    handleUndoMove,
    isAlgorithmsOpen,
    isSettingsOpen,
    isHelpOpen,
    isTutorialOpen,
    isLeaderboardOpen,
  ]);

  const activeColors: FaceColors = COLOR_THEMES[currentTheme].colors;
  const userRank = getRankTitle(profile?.totalPoints || 0);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none flex flex-col">
      {/* 1. TOP BAR (Strict 3-zone Top Bar Contract: Brand, Game Links/Tabs, Primary Actions) */}
      <header className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md shrink-0">
        {/* Zone 1: Single text element wordmark with Arvec Souz 3D logo */}
        <div className="flex items-center gap-3">
          <ArvecLogo size="md" showSubtitle={false} />

          {/* User Solo Points Pill */}
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs hover:bg-amber-500/20 transition-all cursor-pointer"
            title="View Hall of Fame Leaderboard & Ranks"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="font-bold">{profile?.totalPoints || 0} Pts</span>
            <span className="text-slate-500">·</span>
            <span className="text-[10px] text-amber-400/80 uppercase">{userRank}</span>
          </button>
        </div>

        {/* Zone 2: Multiple Games Navigation Bar */}
        <nav className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveGame('rubiks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeGame === 'rubiks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rubik's 3D</span>
          </button>

          <button
            onClick={() => setActiveGame('slide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeGame === 'slide'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>15-Slider</span>
          </button>

          <button
            onClick={() => setActiveGame('lights')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeGame === 'lights'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Matrix Flux</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Account Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {activeGame === 'rubiks' && (
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 transition-all active:scale-95 whitespace-nowrap shadow-sm shadow-emerald-500/10"
              title="Open step-by-step interactive 3D Rubik's tutorial"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Tutorial (+Bonus Pts)</span>
              <span className="md:hidden">Learn</span>
            </button>
          )}

          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
            title="Leaderboard & Point System"
          >
            <Trophy className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Sign-In or Avatar */}
          {user ? (
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Player'}
                  className="w-6 h-6 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-xs font-semibold text-slate-200 max-w-[70px] truncate hidden lg:inline">
                {profile?.displayName || user.displayName}
              </span>
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-600/20 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. GAME CONTAINER */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {activeGame === 'rubiks' && (
          <>
            {/* Scramble HUD */}
            <div className="absolute top-3 inset-x-0 z-20 flex flex-col items-center pointer-events-none px-4">
              {currentScramble && (
                <div className="pointer-events-auto max-w-xl text-center bg-slate-900/70 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-slate-800/80 shadow-lg">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">
                    WCA Scramble
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-semibold text-slate-200 tracking-wider break-words">
                    {currentScramble}
                  </span>
                </div>
              )}
            </div>

            {/* Top-Right Quick Action Bar for Rubik's */}
            <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
              <button
                onClick={handleApplyScramble}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-slate-800 hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Scramble</span>
              </button>
              <button
                onClick={handleAutoSolve}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all active:scale-95 shadow-md shadow-blue-600/20"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Auto Solve</span>
              </button>
            </div>

            {/* 3D Scene */}
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

            {/* Speedcubing Timer */}
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

            {/* Keyboard HUD */}
            <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center px-4">
              <KeyboardHUD
                onTriggerMove={handleTriggerMove}
                lastPressedKey={lastPressedKey}
                activeFaceButtonsVisible={activeFaceButtonsVisible}
                toggleFaceButtons={() => setActiveFaceButtonsVisible(!activeFaceButtonsVisible)}
              />
            </div>
          </>
        )}

        {activeGame === 'slide' && (
          <div className="w-full h-full flex items-center justify-center">
            <SlidePuzzle onPointsAwarded={() => {}} />
          </div>
        )}

        {activeGame === 'lights' && (
          <div className="w-full h-full flex items-center justify-center">
            <LightsOut />
          </div>
        )}
      </div>

      {/* 3. MODALS */}
      {/* Rubik's Interactive Step-by-Step Tutorial */}
      <RubiksTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onExecuteMoves={(moves) => {
          handleExecuteAlgorithm(moves);
          setIsTutorialOpen(false);
        }}
      />

      {/* Leaderboard & Profile Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Auth Error & Vercel Domain Troubleshooting Modal */}
      <AuthErrorModal />

      {/* Algorithms Codex Modal */}
      <AlgorithmsModal
        isOpen={isAlgorithmsOpen}
        onClose={() => setIsAlgorithmsOpen(false)}
        onExecuteAlgorithm={handleExecuteAlgorithm}
      />

      {/* Settings Modal */}
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

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                Arvec Souz Game Guide
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
                <h4 className="font-semibold text-slate-200 mb-1">🎮 3D Rubik's Cube Controls</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-300">Click & Drag any sticker</strong>: turn that face directly.</li>
                  <li><strong className="text-slate-300">Keyboard</strong>: U, D, L, R, F, B (Shift for prime counter-clockwise).</li>
                  <li><strong className="text-slate-300">Arrows</strong>: tilt and rotate whole cube in 3D.</li>
                  <li><strong className="text-slate-300">Spacebar</strong>: start and stop speedcubing timer.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-1">🏆 Solo Point System</h4>
                <p className="text-slate-400 leading-relaxed">
                  Every solo solve automatically computes Base Points + Speed Bonus + Move Efficiency Bonus. Sign in with Google to log your points on the global Arvec Souz leaderboard!
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-1">🎓 Interactive Tutorial</h4>
                <p className="text-slate-400 leading-relaxed">
                  Click the <strong>Tutorial</strong> button in the top bar for a 7-stage interactive layer-by-layer masterclass with 3D move replays and bonus arcade point rewards!
                </p>
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
