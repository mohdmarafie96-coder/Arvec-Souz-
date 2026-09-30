import { ColorTheme, ColorThemeKey } from '../types/cube';

export const COLOR_THEMES: Record<ColorThemeKey, ColorTheme> = {
  classic: {
    name: 'Classic WCA',
    colors: {
      U: '#FFFFFF', // White
      D: '#FFD500', // Yellow
      F: '#009B48', // Green
      B: '#0046AD', // Blue
      L: '#FF5800', // Orange
      R: '#B71234', // Red
      body: '#18181B', // Deep Matte Black Plastic
    },
  },
  neon: {
    name: 'Cyber Neon',
    colors: {
      U: '#F0FDFA', // Electric White
      D: '#FACC15', // Cyber Yellow
      F: '#10B981', // Emerald Laser
      B: '#06B6D4', // Neon Cyan
      L: '#FB923C', // Solar Flare
      R: '#F43F5E', // Hyper Rose
      body: '#090D16', // Obsidian Core
    },
  },
  pastel: {
    name: 'Pastel Dream',
    colors: {
      U: '#F8FAFC', // Cream Soft
      D: '#FEF08A', // Pale Lemon
      F: '#86EFAC', // Soft Mint
      B: '#93C5FD', // Baby Blue
      L: '#FDBA74', // Soft Apricot
      R: '#FDA4AF', // Blush Pink
      body: '#334155', // Slate Grey Frame
    },
  },
  carbon: {
    name: 'Monolith Stealth',
    colors: {
      U: '#E2E8F0', // Platinum
      D: '#EAB308', // Amber Gold
      F: '#059669', // Deep Forest
      B: '#2563EB', // Royal Cobalt
      L: '#EA580C', // Burnt Orange
      R: '#DC2626', // Crimson
      body: '#0F172A', // Dark Carbon Frame
    },
  },
  sunset: {
    name: 'Sunset Glow',
    colors: {
      U: '#FFFBEB', // Warm Sand
      D: '#F59E0B', // Goldenrod
      F: '#14B8A6', // Ocean Teal
      B: '#6366F1', // Twilight Indigo
      L: '#F97316', // Tropic Tangerine
      R: '#E11D48', // Lava Ruby
      body: '#1C1917', // Espresso Frame
    },
  },
};
