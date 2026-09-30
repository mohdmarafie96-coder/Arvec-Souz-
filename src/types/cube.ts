export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

export type CubeAxis = 'x' | 'y' | 'z';

export type MoveNotation =
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  | 'M' | "M'" | 'M2'
  | 'E' | "E'" | 'E2'
  | 'S' | "S'" | 'S2'
  | 'x' | "x'" | 'x2'
  | 'y' | "y'" | 'y2'
  | 'z' | "z'" | 'z2';

export interface FaceColors {
  U: string; // Up (default: White)
  D: string; // Down (default: Yellow)
  F: string; // Front (default: Green)
  B: string; // Back (default: Blue)
  L: string; // Left (default: Orange)
  R: string; // Right (default: Red)
  body: string; // Plastic body
}

export type ColorThemeKey = 'classic' | 'pastel' | 'neon' | 'carbon' | 'sunset';

export interface ColorTheme {
  name: string;
  colors: FaceColors;
}

export interface SolveRecord {
  id: string;
  timeMs: number;
  scramble: string;
  movesCount: number;
  tps: number;
  pointsEarned?: number;
  date: string;
  cubeSize: 2 | 3;
}

export type TimerStatus = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running' | 'completed';

export interface MoveQueueItem {
  face: FaceName | 'M' | 'E' | 'S' | 'x' | 'y' | 'z';
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  double?: boolean;
  notation: MoveNotation;
  duration?: number;
}
