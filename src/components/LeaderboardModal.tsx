import React, { useEffect, useState } from 'react';
import { X, Trophy, Medal, Sparkles, LogIn, LogOut, User, Flame, Clock } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { getLeaderboard, GameSolveRecord, getRankTitle } from '../firebase/gameService';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, loginWithGoogle, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState<GameSolveRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getLeaderboard().then((records) => {
        setLeaderboard(records);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPoints = profile?.totalPoints || 0;
  const currentRank = getRankTitle(currentPoints);

  const formatMs = (ms: number) => {
    const sec = (ms / 1000).toFixed(1);
    return `${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">Arvec Souz Hall of Fame</h2>
              <p className="text-xs text-slate-400">Global solo solve rankings & point tiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Status Card */}
        <div className="p-4 sm:p-6 bg-slate-950/40 border-b border-slate-800/80">
          {user ? (
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Player'}
                    className="w-11 h-11 rounded-2xl border border-slate-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100">{profile?.displayName || user.displayName}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      {currentRank}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span className="text-sky-400 font-bold">{currentPoints} Pts</span>
                    <span>·</span>
                    <span>{profile?.solvesCount || 0} Solves</span>
                    {profile?.bestRubikMs && (
                      <>
                        <span>·</span>
                        <span>Best: {formatMs(profile.bestRubikMs)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-200">Save Your Progress & Climb the Ranks</h4>
                <p className="text-xs text-slate-400 mt-0.5">Sign in with Google to log solo points and compete globally.</p>
              </div>
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-xs uppercase font-mono text-slate-500 px-3">
            <span>Rank & Player</span>
            <span>Game & Points</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading global rankings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
              No recorded solves yet. Be the first to solve a puzzle and take the #1 spot!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((record, index) => {
                const isTop3 = index < 3;
                const medalColors = [
                  'text-amber-400 bg-amber-500/10 border-amber-500/30',
                  'text-slate-300 bg-slate-400/10 border-slate-400/30',
                  'text-amber-600 bg-amber-700/10 border-amber-700/30',
                ];

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs border ${
                          isTop3 ? medalColors[index] : 'text-slate-500 bg-slate-900 border-slate-800'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{record.userName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatMs(record.timeMs)} · {record.movesCount} moves
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-amber-400 text-sm">
                        +{record.pointsEarned} Pts
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                        {record.gameType.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Point System Formula Card */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Solo Point Calculation Formula
            </h4>
            <p className="leading-relaxed">
              Points are awarded automatically upon solo solve completion:
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-500">Base Points</div>
                <div className="font-bold text-slate-200 mt-0.5">250 - 500</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-500">Speed Bonus</div>
                <div className="font-bold text-sky-400 mt-0.5">Up to +600</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-500">Fewer Moves</div>
                <div className="font-bold text-emerald-400 mt-0.5">Up to +450</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
