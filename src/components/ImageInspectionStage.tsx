import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Palette,
  Eye,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Deliverable } from '../types/clientgate';

interface ImageInspectionStageProps {
  deliverable: Deliverable;
  projectCategory: string;
  onDropPin?: (pin: { x: number; y: number }) => void;
  activePins?: { x: number; y: number; label: string }[];
}

export const ImageInspectionStage: React.FC<ImageInspectionStageProps> = ({
  deliverable,
  projectCategory,
  onDropPin,
  activePins = [],
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [studioBackground, setStudioBackground] = useState<'slate' | 'onyx' | 'travertine'>('slate');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showColorPalette, setShowColorPalette] = useState<boolean>(false);
  const [lastPlacedPin, setLastPlacedPin] = useState<{ x: number; y: number } | null>(null);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(0.75, Number((prev + delta).toFixed(2))), 2.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setLastPlacedPin(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onDropPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const newPin = { x, y };
    setLastPlacedPin(newPin);
    onDropPin(newPin);
  };

  const isSolstice = deliverable.projectId === 'proj_solstice';
  const isKomorebi = deliverable.projectId === 'proj_komorebi';

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col shadow-2xl">
      {/* Stage Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">
            {deliverable.version} Inspection Stage
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {deliverable.imageDimensions || '3840 × 2880 px (Ultra HD)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Studio Backdrop Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-850 p-1 rounded-lg border border-slate-700/60 text-[11px]">
            <button
              onClick={() => setStudioBackground('slate')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                studioBackground === 'slate' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Slate
            </button>
            <button
              onClick={() => setStudioBackground('onyx')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                studioBackground === 'onyx' ? 'bg-slate-950 text-white border border-slate-800' : 'text-slate-400'
              }`}
            >
              Onyx
            </button>
            <button
              onClick={() => setStudioBackground('travertine')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                studioBackground === 'travertine' ? 'bg-stone-200 text-stone-900' : 'text-slate-400'
              }`}
            >
              Travertine
            </button>
          </div>

          {/* Palette info */}
          <button
            onClick={() => setShowColorPalette(!showColorPalette)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showColorPalette
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/50'
            }`}
            title="Inspect Brand Color Swatches"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-850 rounded-lg border border-slate-700/60 p-0.5 font-mono text-[11px]">
            <button
              onClick={() => handleZoom(-0.25)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-slate-400 font-semibold tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.25)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors ml-0.5 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Inspection Canvas */}
      <div
        className={`relative min-h-[460px] sm:min-h-[540px] flex items-center justify-center p-6 sm:p-12 overflow-hidden transition-colors ${
          studioBackground === 'slate'
            ? 'bg-slate-950/95'
            : studioBackground === 'onyx'
            ? 'bg-black'
            : 'bg-[#F2ECE4]'
        }`}
      >
        {/* Subtle grid backdrop for alignment inspection */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Deliverable Mockup Artboard */}
        <div
          onClick={handleCanvasClick}
          style={{ transform: `scale(${zoomLevel})` }}
          className="relative transition-transform duration-200 cursor-crosshair select-none shadow-2xl rounded-xl max-w-2xl w-full"
        >
          {isSolstice ? (
            /* Solstice Luxury Coffee Packaging Showcase */
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-b from-[#2A2624] via-[#1E1B19] to-[#121110] border border-stone-800 p-8 sm:p-12 flex flex-col justify-between overflow-hidden shadow-2xl text-stone-100">
              {/* Gold foil reflection accent */}
              <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/20 via-yellow-600/10 to-transparent blur-3xl pointer-events-none" />

              {/* Top Origin Tag */}
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
                <div className="text-[11px] font-mono tracking-widest uppercase text-amber-300/90 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Single Origin · Guji Highlands</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  Elevation 2,150 MASL
                </span>
              </div>

              {/* Central Solstice Sun Emblem & Typography */}
              <div className="text-center my-auto space-y-4">
                {/* Metallic Gold Foil Emblem */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-500 p-[1.5px] shadow-[0_0_35px_rgba(217,119,6,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#1A1816] flex items-center justify-center">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-12 h-12 text-amber-300 fill-current drop-shadow-md"
                    >
                      <circle cx="50" cy="50" r="16" />
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                        <rect
                          key={i}
                          x="48.5"
                          y="18"
                          width="3"
                          height="10"
                          rx="1.5"
                          transform={`rotate(${angle} 50 50)`}
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-4xl font-serif tracking-tight text-stone-100 font-medium">
                    S O L S T I C E
                  </h2>
                  <p className="text-xs sm:text-sm font-sans tracking-widest uppercase text-stone-400">
                    Artisanal Reserve Roast · Whole Bean Coffee
                  </p>
                </div>
              </div>

              {/* Bottom Specs & Roast Profile */}
              <div className="pt-4 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-[11px] font-mono text-stone-300">
                <div>
                  <span className="text-stone-500 block uppercase">Roast</span>
                  <span className="font-semibold text-amber-200">Light Nordic</span>
                </div>
                <div>
                  <span className="text-stone-500 block uppercase">Notes</span>
                  <span className="font-semibold text-amber-200">Bergamot & Jasmine</span>
                </div>
                <div>
                  <span className="text-stone-500 block uppercase">Net Weight</span>
                  <span className="font-semibold text-amber-200">250g / 8.8oz</span>
                </div>
              </div>
            </div>
          ) : isKomorebi ? (
            /* Komorebi Architectural 3D Dusk Render */
            <div className="relative aspect-[16/9] rounded-xl bg-gradient-to-tr from-slate-950 via-[#131B2E] to-[#241F38] border border-slate-700/80 p-8 flex flex-col justify-between overflow-hidden shadow-2xl text-slate-100">
              {/* Architectural Sunset Sky */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-indigo-950/40 pointer-events-none" />

              {/* Concrete Villa Geometry Silhouette */}
              <div className="relative z-10 space-y-2 mt-auto">
                <div className="inline-block bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-indigo-300">
                  Komorebi Villa · Pavilion Residence (Dusk Twilight 8K)
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Board-Form Architectural Concrete · Floor-to-Ceiling Thermal Glass · Infinity Reflection Basin
                </div>
              </div>

              {/* Water Reflection Basin Graphic */}
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-indigo-950/60 to-transparent border-t border-indigo-500/20 backdrop-blur-[1px]" />
            </div>
          ) : (
            /* Default Generic Asset View */
            <div className="aspect-[16/9] rounded-xl bg-slate-900 border border-slate-800 p-8 flex items-center justify-center text-center">
              <span className="text-sm text-slate-400 font-medium">
                {deliverable.title}
              </span>
            </div>
          )}

          {/* Interactive User Revision Pins */}
          {lastPlacedPin && (
            <div
              style={{ left: `${lastPlacedPin.x}%`, top: `${lastPlacedPin.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center animate-bounce z-30"
            >
              <div className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] shadow-lg whitespace-nowrap">
                New Feedback Pin ({lastPlacedPin.x}%, {lastPlacedPin.y}%)
              </div>
              <MapPin className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow" />
            </div>
          )}
        </div>
      </div>

      {/* Brand Color Swatch Drawer */}
      {showColorPalette && (
        <div className="px-5 py-3.5 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Color System Palette:</span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                <span className="w-3 h-3 rounded-full bg-[#1A1816] border border-stone-600 inline-block" />
                <span>Oat Kraft (#1A1816)</span>
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                <span className="w-3 h-3 rounded-full bg-[#D4AF37] border border-amber-300 inline-block" />
                <span>Pantone 871 C Gold Foil</span>
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                <span className="w-3 h-3 rounded-full bg-[#F5F2EB] border border-stone-300 inline-block" />
                <span>Unbleached Cream (#F5F2EB)</span>
              </span>
            </div>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">
            CMYK Pre-Press Verified
          </span>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Click anywhere on the asset to drop an annotated feedback pin.</span>
        </span>
        <span className="text-slate-500 hidden sm:inline">
          Scroll or use zoom controls to inspect typography and foil lines.
        </span>
      </div>
    </div>
  );
};
