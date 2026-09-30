import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { recordTutorialCompletion } from '../firebase/gameService';

export interface TutorialStep {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  explanation: string;
  algorithm: string;
  movesExplanation: string;
  keyRule: string;
  points: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'step-1-basics',
    stageNumber: 1,
    title: 'Anatomy & Cube Notation',
    subtitle: 'Learn the core structure and notation',
    explanation:
      'The Rubik’s Cube has 3 types of pieces: 6 Centers (fixed, determine face colors), 12 Edges (2 colors each), and 8 Corners (3 colors each). Notation letters indicate a 90° clockwise turn of that face: U (Up), D (Down), L (Left), R (Right), F (Front), B (Back). An apostrophe (like R\') means counter-clockwise (prime). A "2" means turn 180°.',
    algorithm: "R U R' U'",
    movesExplanation: 'R: Turn Right face clockwise. U: Turn Top face clockwise. R\': Turn Right face counter-clockwise. U\': Turn Top face counter-clockwise.',
    keyRule: 'Center pieces NEVER move relative to each other: White is always opposite Yellow, Green opposite Blue, Red opposite Orange.',
    points: 100,
  },
  {
    id: 'step-2-white-cross',
    stageNumber: 2,
    title: 'Stage 1: The White Cross',
    subtitle: 'Building the foundational cross on the bottom',
    explanation:
      'Your first goal is to form a white plus on the white face. Critical rule: each white edge piece must also match the side center color (e.g., White-Green edge must connect to both the White center and the Green center). A beginner-friendly trick is to make a "Daisy" (4 white edges around the yellow center), align each with its side center, then spin that face 180° into the white face.',
    algorithm: 'F2 R2 B2 L2',
    movesExplanation: 'Spin each paired edge 180 degrees from yellow down to white.',
    keyRule: 'Always make sure the side color matches the center before rotating the face down!',
    points: 150,
  },
  {
    id: 'step-3-first-layer',
    stageNumber: 3,
    title: 'Stage 2: First Layer Corners',
    subtitle: 'Completing the white layer with aligned sides',
    explanation:
      'Now place the 4 white corner pieces into their correct spots between the matching colored centers. Find a white corner on the top layer, position it directly above where it belongs, and repeat the "Sexy Move" (R U R\' U\') 1 to 5 times until the white sticker faces down and the corner is solved.',
    algorithm: "R U R' U'",
    movesExplanation: 'The four-move "Sexy Move" trigger inserts and twists top corners into place cleanly.',
    keyRule: 'Do not just put white facing down anywhere—verify all three corner colors match their neighboring centers!',
    points: 200,
  },
  {
    id: 'step-4-second-layer',
    stageNumber: 4,
    title: 'Stage 3: Second Layer (F2L)',
    subtitle: 'Inserting middle layer edge pieces',
    explanation:
      'With the white layer complete facing down, you now solve the 4 middle-layer edges. Look on the top layer for an edge with NO yellow. Align the front sticker with its matching center. If it needs to go to the Right, use the Right Insertion alg. If it needs to go to the Left, use the Left Insertion alg.',
    algorithm: "U R U' R' U' F' U F",
    movesExplanation: 'Right insertion: moves the edge into the right middle slot while keeping the bottom layer intact.',
    keyRule: 'Keep the completed white face on the bottom at all times during this stage.',
    points: 250,
  },
  {
    id: 'step-5-yellow-cross',
    stageNumber: 5,
    title: 'Stage 4: The Yellow Cross',
    subtitle: 'Forming the top cross without breaking F2L',
    explanation:
      'Look at the top (yellow) face. You will see either a single yellow dot, an "L-shape" (angle), a horizontal line, or already a cross. Repeat the "FRURUF" algorithm: F (R U R\' U\') F\'. Each repetition progresses your state: Dot -> L-shape -> Line -> Cross!',
    algorithm: "F R U R' U' F'",
    movesExplanation: 'F opens the front, R U R\' U\' cycles the pieces, F\' restores the bottom two layers.',
    keyRule: 'When you have the L-shape, hold it so the arms point to 9 o\'clock and 12 o\'clock before executing.',
    points: 300,
  },
  {
    id: 'step-6-orient-corners',
    stageNumber: 6,
    title: 'Stage 5: Orient Yellow Corners (Sune)',
    subtitle: 'Making the entire top face solid yellow',
    explanation:
      'Now turn all remaining yellow corners so yellow faces upward. The master algorithm for this is Sune: R U R\' U R U2 R\'. If you have exactly one yellow corner facing up ("the fish"), place that corner in the bottom-left of the top face and perform Sune once or twice.',
    algorithm: "R U R' U R U2 R'",
    movesExplanation: 'Sune cycles and twists the three corners counter-clockwise while preserving the cross.',
    keyRule: 'Always position the single yellow fish-head facing the bottom-left before executing Sune.',
    points: 350,
  },
  {
    id: 'step-7-solve-cube',
    stageNumber: 7,
    title: 'Stage 6: Permute the Last Layer',
    subtitle: 'Placing all corners & edges in their solved positions',
    explanation:
      'The final step! First, look for "headlights" (two corners on the same side with matching colors). Put headlights at the back and perform the T-Permutation. Finally, cycle the remaining three edges using the U-Permutation (R U\' R U R U R U\' R\' U\' R2) to completely solve the cube!',
    algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'",
    movesExplanation: 'T-Permutation swaps the two right-side corners and edges to complete the final layer frame.',
    keyRule: 'Congratulations! You have mastered the complete layer-by-layer method for solving the Rubik\'s Cube!',
    points: 500,
  },
];

interface RubiksTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteMoves: (moves: string) => void;
}

export const RubiksTutorial: React.FC<RubiksTutorialProps> = ({
  isOpen,
  onClose,
  onExecuteMoves,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const { user, addPoints } = useAuth();

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentIdx];
  const isCompleted = !!completedSteps[currentStep.id];

  const handleMarkComplete = async () => {
    if (!isCompleted) {
      setCompletedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
      if (user) {
        await recordTutorialCompletion(user.uid, currentStep.id, currentStep.points);
        await addPoints(currentStep.points);
      }
    }
    if (currentIdx < TUTORIAL_STEPS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Rubik's Master Academy
              </h2>
              <p className="text-xs text-slate-400">Interactive step-by-step layer-by-layer method</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
          {TUTORIAL_STEPS.map((step, idx) => {
            const isCurrent = idx === currentIdx;
            const isDone = !!completedSteps[step.id];

            return (
              <button
                key={step.id}
                onClick={() => setCurrentIdx(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : isDone
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-700/60 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                )}
                <span>Stage {idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Lesson Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title & Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
                Lesson {currentStep.stageNumber} of {TUTORIAL_STEPS.length}
              </span>
              <h3 className="text-xl font-black text-slate-100 mt-0.5">{currentStep.title}</h3>
              <p className="text-xs text-slate-400">{currentStep.subtitle}</p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{currentStep.points} Arcade Pts</span>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentStep.explanation}
          </div>

          {/* Golden Rule Tip */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/20 text-xs text-sky-200">
            <Lightbulb className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-300">Golden Rule: </span>
              {currentStep.keyRule}
            </div>
          </div>

          {/* Interactive Algorithm Showcase */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Key Trigger / Algorithm
              </span>
              <button
                onClick={() => onExecuteMoves(currentStep.algorithm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md shadow-blue-500/20"
              >
                <Play className="w-3 h-3 fill-current" />
                Watch in 3D
              </button>
            </div>

            <div className="font-mono text-base sm:text-lg font-bold text-sky-400 tracking-wider bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
              {currentStep.algorithm}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-medium text-slate-300">Move Breakdown: </span>
              {currentStep.movesExplanation}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleMarkComplete}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Next Lesson' : 'Complete & Earn Pts'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
