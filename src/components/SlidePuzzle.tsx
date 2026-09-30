import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Shuffle, Trophy, Clock, Play } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { calculateSoloPoints, saveGameSolve } from '../firebase/gameService';
import { soundFx } from '../utils/audio';

interface SlidePuzzleProps {
  onPointsAwarded?: (points: number) => void;
}

export const SlidePuzzle: React.FC<SlidePuzzleProps> = ({ onPointsAwarded }) => {
  const size = 4; // 4x4 (15 puzzle)
  const totalTiles = size * size;

  // Board state: numbers 1 to 15, and 0 representing the empty space
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const { user, profile, addPoints } = useAuth();

  // Initialize solved board
  const getSolvedBoard = useCallback(() => {
    const arr = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
    arr.push(0); // empty tile at bottom-right
    return arr;
  }, [totalTiles]);

  // Check if board is currently solved
  const checkSolved = (currentBoard: number[]) => {
    for (let i = 0; i < totalTiles - 1; i++) {
      if (currentBoard[i] !== i + 1) return false;
    }
    return currentBoard[totalTiles - 1] === 0;
  };

  // Shuffle board by performing random valid moves to ensure solvability
  const shuffleBoard = () => {
    let current = getSolvedBoard();
    let emptyIdx = totalTiles - 1;
    const moveCount = 120;

    for (let i = 0; i < moveCount; i++) {
      const row = Math.floor(emptyIdx / size);
      const col = emptyIdx % size;
      const neighbors: number[] = [];

      if (row > 0) neighbors.push(emptyIdx - size); // above
      if (row < size - 1) neighbors.push(emptyIdx + size); // below
      if (col > 0) neighbors.push(emptyIdx - 1); // left
      if (col < size - 1) neighbors.push(emptyIdx + 1); // right

      const randomTarget = neighbors[Math.floor(Math.random() * neighbors.length)];
      current[emptyIdx] = current[randomTarget];
      current[randomTarget] = 0;
      emptyIdx = randomTarget;
    }

    setBoard([...current]);
    setMoves(0);
    setIsSolved(false);
    setEarnedPoints(null);
    setIsPlaying(true);
    setElapsedMs(0);
    startTimeRef.current = performance.now();
  };

  useEffect(() => {
    setBoard(getSolvedBoard());
  }, [getSolvedBoard]);

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

  // Move tile if adjacent to empty space
  const moveTile = (index: number) => {
    if (isSolved) return;
    const emptyIdx = board.indexOf(0);
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIdx / size);
    const emptyCol = emptyIdx % size;

    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      if (!isPlaying) {
        setIsPlaying(true);
        startTimeRef.current = performance.now();
      }

      const nextBoard = [...board];
      nextBoard[emptyIdx] = nextBoard[index];
      nextBoard[index] = 0;
      const nextMoves = moves + 1;

      setBoard(nextBoard);
      setMoves(nextMoves);
      soundFx.playTurnSound(1.4);

      if (checkSolved(nextBoard)) {
        setIsSolved(true);
        setIsPlaying(false);
        const finalMs = performance.now() - startTimeRef.current;
        setElapsedMs(finalMs);

        // Calculate solo points
        const points = calculateSoloPoints('slide_puzzle', finalMs, nextMoves);
        setEarnedPoints(points.totalPoints);
        soundFx.playSolvedFanfare();
        confetti({ origin: { y: 0.7 }, particleCount: 150 });

        if (user) {
          saveGameSolve({
            id: `slide_${Date.now()}`,
            userId: user.uid,
            userName: profile?.displayName || 'Player',
            gameType: 'slide_puzzle',
            timeMs: Math.round(finalMs),
            movesCount: nextMoves,
            pointsEarned: points.totalPoints,
            createdAt: new Date().toISOString(),
          });
          addPoints(points.totalPoints, Math.round(finalMs));
        }

        if (onPointsAwarded) onPointsAwarded(points.totalPoints);
      }
    }
  };

  // Keyboard navigation (Arrow keys / WASD to slide tile into empty spot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || isSolved) return;

      const emptyIdx = board.indexOf(0);
      if (emptyIdx === -1) return;
      const emptyRow = Math.floor(emptyIdx / size);
      const emptyCol = emptyIdx % size;

      let targetIdx = -1;
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        if (emptyRow < size - 1) targetIdx = emptyIdx + size; // push bottom tile UP
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        if (emptyRow > 0) targetIdx = emptyIdx - size; // push top tile DOWN
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (emptyCol < size - 1) targetIdx = emptyIdx + 1; // push right tile LEFT
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (emptyCol > 0) targetIdx = emptyIdx - 1; // push left tile RIGHT
      }

      if (targetIdx >= 0 && targetIdx < totalTiles) {
        e.preventDefault();
        moveTile(targetIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, isSolved, moves, isPlaying]);

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${sec}.${hundredths < 10 ? '0' : ''}${hundredths}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full select-none">
      {/* Top Controls & Metrics */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="tabular-nums font-bold text-sm">{formatTime(elapsedMs)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">MOVES:</span>
            <span className="tabular-nums font-bold text-sm text-slate-200">{moves}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={shuffleBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-600/20"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* 3D Tile Board */}
      <div className="relative p-3.5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="grid grid-cols-4 gap-2.5 w-72 h-72 sm:w-80 sm:h-80">
          {board.map((num, idx) => {
            const isEmpty = num === 0;

            if (isEmpty) {
              return (
                <div
                  key="empty"
                  className="rounded-2xl bg-slate-950/40 border border-slate-900/80 inset-shadow-sm flex items-center justify-center"
                />
              );
            }

            return (
              <button
                key={num}
                onClick={() => moveTile(idx)}
                className="relative rounded-2xl bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border border-slate-700/80 shadow-md hover:border-sky-500/50 hover:from-slate-750 transition-all active:scale-95 flex items-center justify-center text-slate-100 font-mono font-black text-xl sm:text-2xl group cursor-pointer"
              >
                <span className="drop-shadow-sm group-hover:text-sky-300 transition-colors">{num}</span>
                {/* Subtle top edge bevel highlight */}
                <div className="absolute top-1 inset-x-2 h-[1px] bg-white/10 rounded-full" />
              </button>
            );
          })}
        </div>

        {/* Solved Victory Banner Overlay */}
        {isSolved && earnedPoints !== null && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Puzzle Solved!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Solved in {formatTime(elapsedMs)} with {moves} moves
            </p>
            <div className="my-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-sky-500/20 border border-amber-500/30 text-amber-300 font-mono font-black text-lg">
              +{earnedPoints} Solo Points!
            </div>
            <button
              onClick={shuffleBoard}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <div className="text-xs text-slate-500 mt-3 text-center">
        Click adjacent tiles or use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Arrow Keys / WASD</kbd> to slide
      </div>
    </div>
  );
};
