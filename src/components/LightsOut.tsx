import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Shuffle, Trophy, Clock, Zap } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { calculateSoloPoints, saveGameSolve } from '../firebase/gameService';
import { soundFx } from '../utils/audio';

export const LightsOut: React.FC = () => {
  const size = 5;
  const totalNodes = size * size;

  // Board state: boolean array where true = ON (lit), false = OFF (dark)
  const [grid, setGrid] = useState<boolean[]>(Array(totalNodes).fill(true));
  const [moves, setMoves] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const { user, profile, addPoints } = useAuth();

  // Scramble board by simulating random valid clicks so it is guaranteed solvable
  const scrambleBoard = () => {
    let nextGrid = Array(totalNodes).fill(true);
    const clickCount = 14;

    for (let c = 0; c < clickCount; c++) {
      const idx = Math.floor(Math.random() * totalNodes);
      const r = Math.floor(idx / size);
      const col = idx % size;

      nextGrid[idx] = !nextGrid[idx];
      if (r > 0) nextGrid[idx - size] = !nextGrid[idx - size];
      if (r < size - 1) nextGrid[idx + size] = !nextGrid[idx + size];
      if (col > 0) nextGrid[idx - 1] = !nextGrid[idx - 1];
      if (col < size - 1) nextGrid[idx + 1] = !nextGrid[idx + 1];
    }

    setGrid(nextGrid);
    setMoves(0);
    setIsSolved(false);
    setEarnedPoints(null);
    setIsPlaying(true);
    setElapsedMs(0);
    startTimeRef.current = performance.now();
  };

  useEffect(() => {
    scrambleBoard();
  }, []);

  // Timer loop
  useEffect(() => {
    if (isPlaying && !isSolved) {
      const tick = () => {
        setElapsedMs(performance.now() - startTimeRef.current);
        timerRafRef.current = requestAnimationFrame(tick);
      };
      timerRafRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    }
    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    };
  }, [isPlaying, isSolved]);

  const toggleNode = (idx: number) => {
    if (isSolved) return;
    if (!isPlaying) {
      setIsPlaying(true);
      startTimeRef.current = performance.now();
    }

    const r = Math.floor(idx / size);
    const col = idx % size;
    const nextGrid = [...grid];

    nextGrid[idx] = !nextGrid[idx];
    if (r > 0) nextGrid[idx - size] = !nextGrid[idx - size];
    if (r < size - 1) nextGrid[idx + size] = !nextGrid[idx + size];
    if (col > 0) nextGrid[idx - 1] = !nextGrid[idx - 1];
    if (col < size - 1) nextGrid[idx + 1] = !nextGrid[idx + 1];

    const nextMoves = moves + 1;
    setGrid(nextGrid);
    setMoves(nextMoves);
    soundFx.playTurnSound(1.6);

    // Check if all nodes are ON
    const allOn = nextGrid.every((lit) => lit);
    if (allOn) {
      setIsSolved(true);
      setIsPlaying(false);
      const finalMs = performance.now() - startTimeRef.current;
      setElapsedMs(finalMs);

      const points = calculateSoloPoints('lights_out', finalMs, nextMoves);
      setEarnedPoints(points.totalPoints);
      soundFx.playSolvedFanfare();
      confetti({ origin: { y: 0.7 }, particleCount: 150 });

      if (user) {
        saveGameSolve({
          id: `lights_${Date.now()}`,
          userId: user.uid,
          userName: profile?.displayName || 'Player',
          gameType: 'lights_out',
          timeMs: Math.round(finalMs),
          movesCount: nextMoves,
          pointsEarned: points.totalPoints,
          createdAt: new Date().toISOString(),
        });
        addPoints(points.totalPoints, Math.round(finalMs));
      }
    }
  };

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${sec}.${hundredths < 10 ? '0' : ''}${hundredths}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full select-none">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums font-bold text-sm">{formatTime(elapsedMs)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">MOVES:</span>
            <span className="tabular-nums font-bold text-sm text-slate-200">{moves}</span>
          </div>
        </div>

        <button
          onClick={scrambleBoard}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-amber-600/20"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>
      </div>

      {/* Grid */}
      <div className="relative p-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="grid grid-cols-5 gap-2.5 w-72 h-72 sm:w-80 sm:h-80">
          {grid.map((lit, idx) => (
            <button
              key={idx}
              onClick={() => toggleNode(idx)}
              className={`rounded-2xl border transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer ${
                lit
                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 border-amber-300 shadow-lg shadow-amber-500/30'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <Zap
                className={`w-5 h-5 transition-transform ${
                  lit ? 'text-white fill-white scale-110 drop-shadow-md' : 'text-slate-700'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Solved Victory Overlay */}
        {isSolved && earnedPoints !== null && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Grid Fully Powered!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cleared in {formatTime(elapsedMs)} with {moves} moves
            </p>
            <div className="my-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-sky-500/20 border border-amber-500/30 text-amber-300 font-mono font-black text-lg">
              +{earnedPoints} Solo Points!
            </div>
            <button
              onClick={scrambleBoard}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
            >
              Play Next Grid
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 mt-3 text-center">
        Goal: Turn ALL crystal nodes ON. Clicking any node flips itself and orthogonal neighbors.
      </div>
    </div>
  );
};
