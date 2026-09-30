import { FaceName, MoveNotation, MoveQueueItem } from '../types/cube';

const FACES_3X3: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B'];
const FACES_2X2: FaceName[] = ['U', 'R', 'F'];
const MODIFIERS = ['', "'", '2'];

// Map opposite faces: U <-> D, L <-> R, F <-> B
const OPPOSITE_FACE_MAP: Record<FaceName, FaceName> = {
  U: 'D',
  D: 'U',
  L: 'R',
  R: 'L',
  F: 'B',
  B: 'F',
};

/**
 * Generate a random WCA-compliant scramble string
 */
export function generateScramble(cubeSize: 2 | 3 = 3, moveCount: number = cubeSize === 2 ? 10 : 22): string {
  const faces = cubeSize === 2 ? FACES_2X2 : FACES_3X3;
  const moves: string[] = [];

  let lastFace: FaceName | null = null;
  let secondLastFace: FaceName | null = null;

  for (let i = 0; i < moveCount; i++) {
    const candidates = faces.filter((face) => {
      if (face === lastFace) return false;
      // Prevent A B A patterns where A and B are on opposite faces (e.g., R L R)
      if (lastFace && OPPOSITE_FACE_MAP[face] === lastFace && secondLastFace === face) {
        return false;
      }
      return true;
    });

    const chosenFace = candidates[Math.floor(Math.random() * candidates.length)];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    const move = `${chosenFace}${modifier}`;

    moves.push(move);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return moves.join(' ');
}

/**
 * Converts a move notation string like "R'", "U2", "F" into a MoveQueueItem
 */
export function parseMoveString(notation: string): MoveQueueItem | null {
  const clean = notation.trim();
  if (!clean) return null;

  const faceChar = clean[0].toUpperCase() as FaceName | 'M' | 'E' | 'S' | 'X' | 'Y' | 'Z';
  const isWholeCube = clean[0] === 'x' || clean[0] === 'y' || clean[0] === 'z';
  const face = isWholeCube ? (clean[0] as 'x' | 'y' | 'z') : faceChar;

  const isDouble = clean.includes('2');
  const isPrime = clean.includes("'");

  const direction: 1 | -1 = isPrime ? -1 : 1;

  return {
    face: face as FaceName | 'M' | 'E' | 'S' | 'x' | 'y' | 'z',
    direction,
    double: isDouble,
    notation: clean as MoveNotation,
  };
}

/**
 * Parses a sequence of space-separated moves into typed MoveQueueItems
 */
export function parseAlgorithm(alg: string): MoveQueueItem[] {
  return alg
    .trim()
    .split(/\s+/)
    .map(parseMoveString)
    .filter((item): item is MoveQueueItem => item !== null);
}

/**
 * Returns the inverse notation for a move, e.g. R -> R', R' -> R, R2 -> R2
 */
export function getInverseMove(move: MoveQueueItem): MoveQueueItem {
  let newNotation: MoveNotation;
  let newDirection: 1 | -1 = move.direction === 1 ? -1 : 1;

  if (move.double) {
    newNotation = `${move.face}2` as MoveNotation;
    newDirection = 1;
  } else if (move.direction === 1) {
    newNotation = `${move.face}'` as MoveNotation;
  } else {
    newNotation = `${move.face}` as MoveNotation;
  }

  return {
    face: move.face,
    direction: newDirection,
    double: move.double,
    notation: newNotation,
  };
}

/**
 * Inverts an entire sequence of moves in reverse order
 */
export function invertAlgorithm(moves: MoveQueueItem[]): MoveQueueItem[] {
  return moves.slice().reverse().map(getInverseMove);
}
