export interface AlgorithmItem {
  id: string;
  name: string;
  category: 'Triggers' | 'OLL' | 'PLL' | 'Beginner' | 'Patterns';
  moves: string;
  description: string;
}

export const CUBE_ALGORITHMS: AlgorithmItem[] = [
  // Essential Triggers
  {
    id: 'sexy-move',
    name: 'Sexy Move',
    category: 'Triggers',
    moves: "R U R' U'",
    description: 'The most fundamental trigger in speedcubing. Repeating it 6 times returns the cube to its original state.',
  },
  {
    id: 'sledgehammer',
    name: 'Sledgehammer',
    category: 'Triggers',
    moves: "R' F R F'",
    description: 'Crucial trigger for orienting edges while inserting F2L pairs.',
  },
  {
    id: 'inverse-sexy',
    name: 'Inverse Sexy Move',
    category: 'Triggers',
    moves: "U R U' R'",
    description: 'Useful for quick top-layer corner manipulation and pair insertion.',
  },

  // Beginner / CFOP Basics
  {
    id: 'yellow-cross',
    name: 'Yellow Cross (F R U R\' U\' F\')',
    category: 'Beginner',
    moves: "F R U R' U' F'",
    description: 'Converts the yellow "line" or "L-shape" into the full yellow cross.',
  },
  {
    id: 'corner-cycle',
    name: 'Niklas (Corner Permutation)',
    category: 'Beginner',
    moves: "U R U' L' U R' U' L",
    description: 'Cycles three top layer corners clockwise while preserving orientation.',
  },

  // OLL
  {
    id: 'sune',
    name: 'Sune (OLL 27)',
    category: 'OLL',
    moves: "R U R' U R U2 R'",
    description: 'The famous Sune algorithm to orient corners of the last layer.',
  },
  {
    id: 'antisune',
    name: 'Anti-Sune (OLL 26)',
    category: 'OLL',
    moves: "R U2 R' U' R U' R'",
    description: 'Mirror of the Sune algorithm for opposite corner orientation.',
  },
  {
    id: 'headlights',
    name: 'Headlights (OLL 23)',
    category: 'OLL',
    moves: "R2 D R' U2 R D' R' U2 R'",
    description: 'Orients two opposite corners pointing in the same direction.',
  },

  // PLL
  {
    id: 't-perm',
    name: 'T-Permutation',
    category: 'PLL',
    moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
    description: 'Swaps two adjacent corners and two opposite edges in a T-shape.',
  },
  {
    id: 'y-perm',
    name: 'Y-Permutation',
    category: 'PLL',
    moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    description: 'Swaps two diagonal corners and two adjacent edges.',
  },
  {
    id: 'j-perm',
    name: 'J-Permutation (Jb)',
    category: 'PLL',
    moves: "R U R' F' R U R' U' R' F R2 U' R'",
    description: 'Very fast PLL algorithm swapping adjacent corners and edges.',
  },
  {
    id: 'u-perm-a',
    name: 'U-Permutation (Ua)',
    category: 'PLL',
    moves: "R U' R U R U R U' R' U' R2",
    description: 'Cycles three last-layer edges counter-clockwise.',
  },
  {
    id: 'h-perm',
    name: 'H-Permutation',
    category: 'PLL',
    moves: "M2 U M2 U2 M2 U M2",
    description: 'Swaps opposite edge pairs across the top layer.',
  },
  {
    id: 'z-perm',
    name: 'Z-Permutation',
    category: 'PLL',
    moves: "M2 U M2 U M' U2 M2 U2 M'",
    description: 'Swaps adjacent pairs of edges.',
  },

  // Pretty Patterns
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    category: 'Patterns',
    moves: 'M2 E2 S2',
    description: 'Iconic alternating checkerboard pattern across all 6 faces.',
  },
  {
    id: 'cube-in-cube',
    name: 'Cube in a Cube',
    category: 'Patterns',
    moves: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
    description: 'Creates a mini 2x2 cube nestled inside the 3x3 cube.',
  },
  {
    id: 'dots',
    name: 'Six Center Dots',
    category: 'Patterns',
    moves: "U D' R L' F B' U D'",
    description: 'Swaps each center piece with its adjacent face color.',
  },
];
