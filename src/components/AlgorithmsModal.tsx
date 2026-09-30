import React, { useState } from 'react';
import { X, Play, BookOpen, Sparkles, Layers } from 'lucide-react';
import { CUBE_ALGORITHMS, AlgorithmItem } from '../utils/algorithms';

interface AlgorithmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAlgorithm: (moves: string) => void;
}

export const AlgorithmsModal: React.FC<AlgorithmsModalProps> = ({
  isOpen,
  onClose,
  onExecuteAlgorithm,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'algorithms' | 'guide'>('algorithms');

  if (!isOpen) return null;

  const categories = ['All', 'Triggers', 'OLL', 'PLL', 'Patterns', 'Beginner'];

  const filteredAlgs =
    selectedCategory === 'All'
      ? CUBE_ALGORITHMS
      : CUBE_ALGORITHMS.filter((alg) => alg.category === selectedCategory);

  const beginnerSteps = [
    {
      step: '1. The White Cross',
      description: 'Form a white plus on the top face such that each white edge also matches its adjacent center color (green, red, blue, orange).',
      tip: 'Move white edges to the yellow face first (Daisy), then rotate 180° into the white face.',
      suggestedMoves: "F2 R2 B2 L2",
    },
    {
      step: '2. First Layer Corners',
      description: 'Place the 4 white corner pieces into their correct spots between the corresponding colored centers.',
      tip: 'Use the Sexy Move (R U R\' U\') repeatedly until the white corner drops into place facing down.',
      suggestedMoves: "R U R' U'",
    },
    {
      step: '3. Second Layer (F2L Edges)',
      description: 'Insert the 4 middle-layer edge pieces without disturbing the completed white bottom layer.',
      tip: 'To insert right: U R U\' R\' U\' F\' U F. To insert left: U\' L\' U L U F U\' F\'.',
      suggestedMoves: "U R U' R' U' F' U F",
    },
    {
      step: '4. Yellow Cross (OLL Cross)',
      description: 'Form a yellow cross on top without affecting the first two layers.',
      tip: 'Apply F R U R\' U\' F\' from dot, to L-shape, to horizontal line, to cross.',
      suggestedMoves: "F R U R' U' F'",
    },
    {
      step: '5. Yellow Face (Sune)',
      description: 'Orient all 4 yellow corners so the entire top face is solid yellow.',
      tip: 'Apply Sune (R U R\' U R U2 R\') with one yellow corner in the bottom-left.',
      suggestedMoves: "R U R' U R U2 R'",
    },
    {
      step: '6. Position Last Layer Corners (T-Perm / Niklas)',
      description: 'Permute the corners so that headlights match on adjacent sides.',
      tip: 'Look for two corners with matching colors on the same side and put them at the back.',
      suggestedMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
    },
    {
      step: '7. Permute Last Layer Edges (U-Perm)',
      description: 'Rotate the remaining 3 edge pieces into their solved slots to finish the cube!',
      tip: 'Put the solved bar at the back and apply Ua or Ub permutation.',
      suggestedMoves: "R U' R U R U R U' R' U' R2",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Cube Codex & Algorithms</h2>
              <p className="text-xs text-slate-400">Step-by-step CFOP solver patterns & instant replay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/60 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('algorithms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'algorithms'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Algorithms Library
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Beginner CFOP Guide
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'algorithms' ? (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-100 text-slate-950 font-semibold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Algorithm Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAlgs.map((alg) => (
                  <div
                    key={alg.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-sm text-slate-200">{alg.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {alg.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{alg.description}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-auto">
                      <div className="font-mono text-xs font-semibold text-blue-400 tracking-wider overflow-x-auto whitespace-nowrap max-w-[180px] py-1">
                        {alg.moves}
                      </div>
                      <button
                        onClick={() => {
                          onExecuteAlgorithm(alg.moves);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm shadow-blue-500/20 shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Execute
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {beginnerSteps.map((step) => (
                <div
                  key={step.step}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">{step.step}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
                    <p className="text-xs text-blue-400/90 font-medium">Tip: {step.tip}</p>
                  </div>
                  <button
                    onClick={() => {
                      onExecuteAlgorithm(step.suggestedMoves);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors shrink-0 self-start md:self-center"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Try Alg
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
