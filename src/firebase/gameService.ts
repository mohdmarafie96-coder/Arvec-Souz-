import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';

export interface GameSolveRecord {
  id: string;
  userId: string;
  userName: string;
  gameType: 'rubiks_3x3' | 'rubiks_2x2' | 'slide_puzzle' | 'lights_out';
  timeMs: number;
  movesCount: number;
  pointsEarned: number;
  scramble?: string;
  tps?: number;
  createdAt: string;
}

export interface PointBreakdown {
  basePoints: number;
  timeBonus: number;
  efficiencyBonus: number;
  totalPoints: number;
  rankTitle: string;
}

/**
 * Calculates solo solve points based on puzzle difficulty, speed, and move efficiency
 */
export function calculateSoloPoints(
  gameType: 'rubiks_3x3' | 'rubiks_2x2' | 'slide_puzzle' | 'lights_out',
  timeMs: number,
  movesCount: number
): PointBreakdown {
  let basePoints = 500;
  let targetTimeMs = 180000; // 3 mins target
  let targetMoves = 80;

  if (gameType === 'rubiks_2x2') {
    basePoints = 250;
    targetTimeMs = 60000;
    targetMoves = 35;
  } else if (gameType === 'slide_puzzle') {
    basePoints = 350;
    targetTimeMs = 120000;
    targetMoves = 100;
  } else if (gameType === 'lights_out') {
    basePoints = 300;
    targetTimeMs = 90000;
    targetMoves = 30;
  }

  // Time bonus (faster than target grants up to bonus)
  const timeSavedSec = Math.max(0, (targetTimeMs - timeMs) / 1000);
  const timeBonus = Math.floor(timeSavedSec * 2.5);

  // Efficiency bonus (fewer moves than target)
  const movesSaved = Math.max(0, targetMoves - movesCount);
  const efficiencyBonus = movesSaved * 4;

  const totalPoints = basePoints + timeBonus + efficiencyBonus;

  return {
    basePoints,
    timeBonus,
    efficiencyBonus,
    totalPoints,
    rankTitle: getRankTitle(totalPoints),
  };
}

export function getRankTitle(points: number): string {
  if (points >= 12000) return 'Grandmaster';
  if (points >= 7000) return 'Puzzle Master';
  if (points >= 3500) return 'Speedcuber';
  if (points >= 1500) return 'Adept Cuber';
  if (points >= 500) return 'Apprentice';
  return 'Novice Cuber';
}

/**
 * Saves a completed solve to Firestore
 */
export async function saveGameSolve(record: GameSolveRecord): Promise<void> {
  const path = 'solves';
  try {
    const solveDocRef = doc(db, path, record.id);
    await setDoc(solveDocRef, record);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetches the global arcade leaderboard from Firestore
 */
export async function getLeaderboard(): Promise<GameSolveRecord[]> {
  const path = 'solves';
  try {
    const q = query(collection(db, path), orderBy('pointsEarned', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as GameSolveRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves interactive tutorial stage completion
 */
export async function recordTutorialCompletion(
  userId: string,
  stageId: string,
  pointsAwarded: number
): Promise<void> {
  const path = `users/${userId}/tutorialProgress/${stageId}`;
  try {
    const docRef = doc(db, 'users', userId, 'tutorialProgress', stageId);
    await setDoc(
      docRef,
      {
        userId,
        stageId,
        completed: true,
        pointsAwarded,
        completedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
