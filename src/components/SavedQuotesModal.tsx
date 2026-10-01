import React, { useState, useEffect } from 'react';
import {
  X,
  BookmarkCheck,
  ExternalLink,
  Trash2,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  Inbox,
  Globe,
} from 'lucide-react';
import { SourcingReport } from '../types/sourcing';
import { formatCurrency } from '../utils/destinationsAndCurrencies';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '../firebase/authContext';

interface SavedQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: SourcingReport) => void;
}

export const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({
  isOpen,
  onClose,
  onSelectReport,
}) => {
  const { user } = useAuth();
  const [savedReports, setSavedReports] = useState<SourcingReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      setSavedReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'sourcingReports';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reports: SourcingReport[] = [];
        snapshot.forEach((d) => {
          reports.push(d.data() as SourcingReport);
        });
        setSavedReports(reports);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Firestore onSnapshot error, falling back:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user]);

  const handleDelete = async (reportId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!reportId || !user) return;

    setDeletingId(reportId);
    const path = 'sourcingReports';
    try {
      await deleteDoc(doc(db, path, reportId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${reportId}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Saved Sourcing Quotes & Portfolio
              </h3>
              <p className="text-xs text-slate-400">
                Persistent Firestore database records synchronized with your Google account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
              <span className="text-xs font-mono">Loading saved quotes from Firestore...</span>
            </div>
          ) : savedReports.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-slate-200">No Saved Quotes Yet</h4>
                <p className="text-xs text-slate-400">
                  Search any item and click the "Save Quote" button on top to persist it in your cloud Firestore portfolio.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReports.map((item) => {
                const bestSource = item.sources?.[0];
                const lowestPrice = bestSource?.pricing?.total_landed_cost || 0;
                const currency = item.query?.currency || 'USD';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectReport(item);
                      onClose();
                    }}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-850/80 transition-all cursor-pointer group space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                            {item.query?.item}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {item.query?.condition}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-emerald-400" />
                            {item.query?.destination}
                          </span>
                          <span>·</span>
                          <span>{item.sources?.length || 0} Verified Sources</span>
                          {item.generated_at && (
                            <>
                              <span>·</span>
                              <span>{new Date(item.generated_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">
                            Best Landed Cost
                          </span>
                          <span className="text-sm sm:text-base font-mono font-bold text-sky-300">
                            {formatCurrency(lowestPrice, currency)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          disabled={deletingId === item.id}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                          title="Delete saved quote from database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {bestSource && (
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400 font-mono">
                        <div>
                          Top Source: <strong className="text-slate-200">{bestSource.store_name}</strong> ({bestSource.clearance_type})
                        </div>
                        <div className="flex items-center gap-1 text-sky-400 group-hover:translate-x-1 transition-transform">
                          <span>Load Sourcing Breakdown</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Connected to Firestore DB: {user ? 'Online (Authenticated)' : 'Signed Out'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
