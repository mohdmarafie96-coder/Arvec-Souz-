import React, { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TimerStatus, SolveRecord } from '../types/cube';
import { soundFx } from '../utils/audio';
import { calculateSoloPoints } from '../firebase/gameService';

interface SpeedTimerProps {
  status: TimerStatus;
  setStatus: React.Dispatch<React.SetStateAction<TimerStatus>>;
  inspectionEnabled: boolean;
  movesCount: number;
  currentScramble: string;
  cubeSize: 2 | 3;
  onSolveFinished: (record: SolveRecord, points: number) => void;
  isSolved: boolean;
}

export const SpeedTimer: React.FC<SpeedTimerProps> = ({
  status,
  setStatus,
  inspectionEnabled,
  movesCount,
  currentScramble,
  cubeSize,
  onSolveFinished,
  isSolved,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [inspectionSeconds, setInspectionSeconds] = useState<number>(15);
  const [holdProgress, setHoldProgress] = useState<'idle' | 'holding' | 'ready'>('idle');
  const [recentPoints, setRecentPoints] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const inspectionIntervalRef = useRef<number | null>(null);
  const isHoldingKeyRef = useRef<boolean>(false);
  const currentMovesRef = useRef<number>(0);

  currentMovesRef.current = movesCount;

  // Format milliseconds into MM:SS.cc
  const formatTime = (ms: number): string => {
    const totalSecs = ms / 1000;
    const minutes = Math.floor(totalSecs / 60);
    const seconds = Math.floor(totalSecs % 60);
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (minutes > 0) {
      return `${minutes}:${pad(seconds)}.${pad(hundredths)}`;
    }
    return `${seconds}.${pad(hundredths)}`;
  };

  // Launch celebratory confetti fireworks
  const triggerConfetti = useCallback(() => {
    soundFx.playSolvedFanfare();
    try {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch {
      // Confetti fallback
    }
  }, []);

  // Watch for cube solve while timer is running
  useEffect(() => {
    if (status === 'running' && isSolved && elapsedMs > 500) {
      // Stopped by solving!
      const finalMs = performance.now() - startTimeRef.current;
      setElapsedMs(finalMs);
      setStatus('completed');

      const totalSec = finalMs / 1000;
      const tps = totalSec > 0 ? Number((currentMovesRef.current / totalSec).toFixed(2)) : 0;

      // Calculate solo points
      const points = calculateSoloPoints(
        cubeSize === 3 ? 'rubiks_3x3' : 'rubiks_2x2',
        finalMs,
        currentMovesRef.current
      );
      setRecentPoints(points.totalPoints);

      const record: SolveRecord = {
        id: `${Date.now()}`,
        timeMs: Math.round(finalMs),
        scramble: currentScramble,
        movesCount: currentMovesRef.current,
        tps,
        pointsEarned: points.totalPoints,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cubeSize,
      };

      onSolveFinished(record, points.totalPoints);
      triggerConfetti();
    }
  }, [isSolved, status, currentScramble, cubeSize, onSolveFinished, setStatus, triggerConfetti, elapsedMs]);

  // Inspection Countdown
  useEffect(() => {
    if (status === 'inspecting') {
      setInspectionSeconds(15);
      soundFx.playInspectBeep(false);

      inspectionIntervalRef.current = window.setInterval(() => {
        setInspectionSeconds((prev) => {
          if (prev <= 1) {
            // Inspection over -> start timer automatically
            clearInterval(inspectionIntervalRef.current!);
            setStatus('running');
            startTimeRef.current = performance.now();
            return 0;
          }
          if (prev === 8) {
            soundFx.playInspectBeep(false);
          }
          if (prev === 3) {
            soundFx.playInspectBeep(true);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    }

    return () => {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    };
  }, [status, setStatus]);

  // Running Timer Animation Loop
  useEffect(() => {
    if (status === 'running') {
      startTimeRef.current = performance.now();
      setRecentPoints(null);

      const tick = () => {
        const now = performance.now();
        setElapsedMs(now - startTimeRef.current);
        timerRafRef.current = requestAnimationFrame(tick);
      };

      timerRafRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
      }
    }

    return () => {
      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
      }
    };
  }, [status]);

  // Spacebar handling for WCA-style timer start & stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();

        if (status === 'running') {
          const finalMs = performance.now() - startTimeRef.current;
          setElapsedMs(finalMs);
          setStatus('completed');

          const totalSec = finalMs / 1000;
          const tps = totalSec > 0 ? Number((currentMovesRef.current / totalSec).toFixed(2)) : 0;

          const points = calculateSoloPoints(
            cubeSize === 3 ? 'rubiks_3x3' : 'rubiks_2x2',
            finalMs,
            currentMovesRef.current
          );
          setRecentPoints(points.totalPoints);

          const record: SolveRecord = {
            id: `${Date.now()}`,
            timeMs: Math.round(finalMs),
            scramble: currentScramble,
            movesCount: currentMovesRef.current,
            tps,
            pointsEarned: points.totalPoints,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cubeSize,
          };
          onSolveFinished(record, points.totalPoints);
          if (isSolved) {
            triggerConfetti();
          }
        } else if (status === 'idle' || status === 'completed') {
          if (inspectionEnabled) {
            setStatus('inspecting');
          } else {
            isHoldingKeyRef.current = true;
            setHoldProgress('holding');
            holdTimeoutRef.current = window.setTimeout(() => {
              setHoldProgress('ready');
            }, 300);
          }
        } else if (status === 'inspecting') {
          isHoldingKeyRef.current = true;
          setHoldProgress('holding');
          holdTimeoutRef.current = window.setTimeout(() => {
            setHoldProgress('ready');
          }, 300);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
        }

        if (holdProgress === 'ready') {
          setElapsedMs(0);
          setStatus('running');
        }
        setHoldProgress('idle');
        isHoldingKeyRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, [status, holdProgress, inspectionEnabled, currentScramble, cubeSize, onSolveFinished, setStatus, isSolved, triggerConfetti]);

  const handleTouchStart = () => {
    if (status === 'running') {
      const finalMs = performance.now() - startTimeRef.current;
      setElapsedMs(finalMs);
      setStatus('completed');
      return;
    }

    if (status === 'idle' || status === 'completed' || status === 'inspecting') {
      if (inspectionEnabled && status !== 'inspecting') {
        setStatus('inspecting');
        return;
      }

      setHoldProgress('holding');
      holdTimeoutRef.current = window.setTimeout(() => {
        setHoldProgress('ready');
      }, 300);
    }
  };

  const handleTouchEnd = () => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdProgress === 'ready') {
      setElapsedMs(0);
      setStatus('running');
    }
    setHoldProgress('idle');
  };

  const tps = elapsedMs > 0 ? (movesCount / (elapsedMs / 1000)).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col items-center select-none pointer-events-auto">
      {/* Recent Points Awarded Popup */}
      {recentPoints !== null && isSolved && (
        <div className="mb-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-sky-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-black animate-bounce shadow-lg shadow-amber-500/10">
          +{recentPoints} Solo Points Earned!
        </div>
      )}

      {/* Main Timer Display */}
      <div
        onPointerDown={handleTouchStart}
        onPointerUp={handleTouchEnd}
        className={`cursor-pointer transition-transform active:scale-95 px-6 py-2 rounded-2xl flex flex-col items-center justify-center ${
          holdProgress === 'ready'
            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
            : holdProgress === 'holding'
            ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
            : status === 'running'
            ? 'text-white'
            : status === 'inspecting'
            ? 'text-amber-300'
            : 'text-slate-100 hover:text-white'
        }`}
      >
        {status === 'inspecting' ? (
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-0.5">Inspection</span>
            <span className="font-mono text-5xl md:text-6xl font-bold tabular-nums tracking-tight">
              {inspectionSeconds}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-mono text-5xl md:text-6xl font-bold tabular-nums tracking-tight drop-shadow-md">
              {formatTime(elapsedMs)}
            </span>
            {holdProgress === 'ready' && (
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mt-1">Release to Start</span>
            )}
            {holdProgress === 'holding' && (
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 mt-1">Hold...</span>
            )}
          </div>
        )}
      </div>

      {/* Live Solved Stats HUD */}
      <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1.5 px-3 py-1 rounded-lg bg-slate-900/60 backdrop-blur-md border border-slate-800/80">
        <div>
          <span className="text-slate-500">MOVES: </span>
          <span className="font-semibold text-slate-200 tabular-nums">{movesCount}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-700" />
        <div>
          <span className="text-slate-500">TPS: </span>
          <span className="font-semibold text-slate-200 tabular-nums">{tps}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-700" />
        <div>
          <span className="text-slate-500">STATUS: </span>
          <span className={`font-semibold ${isSolved ? 'text-emerald-400' : status === 'running' ? 'text-amber-400' : 'text-slate-300'}`}>
            {isSolved ? 'SOLVED' : status === 'running' ? 'SOLVING' : 'READY'}
          </span>
        </div>
      </div>
    </div>
  );
};

