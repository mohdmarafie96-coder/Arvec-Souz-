import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Clock,
  Film,
  FastForward,
} from 'lucide-react';
import { Deliverable } from '../types/clientgate';

interface VideoPreviewStageProps {
  deliverable: Deliverable;
  onTagTimestamp?: (formattedTime: string) => void;
}

export const VideoPreviewStage: React.FC<VideoPreviewStageProps> = ({
  deliverable,
  onTagTimestamp,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(14); // Start at key timestamp 00:14
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const duration = deliverable.videoMeta?.duration || 45;
  const markers = deliverable.videoMeta?.markers || [
    { time: 14, label: 'Acoustic Chamber Intro' },
    { time: 26, label: 'Active Noise Cancellation Pulse' },
    { time: 38, label: 'Hero Product Lockup & Callout' },
  ];

  // Playback timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(duration, prev + 1);
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, playbackSpeed]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedCycle = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    setPlaybackSpeed(speeds[(currentIndex + 1) % speeds.length]);
  };

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col shadow-2xl">
      {/* Video Stage Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 gap-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white tracking-wide">
            {deliverable.title}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {deliverable.videoMeta?.resolution || '4K DCI (3840 × 2160) · 24fps'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 text-[11px] font-mono">
            Dolby Atmos 5.1 Binaural
          </span>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="relative aspect-[16/9] min-h-[380px] sm:min-h-[480px] bg-slate-950 flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
        {/* Dynamic Studio Audio Visualizer Waves */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-[#0C1222] to-[#17112E] pointer-events-none" />

        {/* Cinematic frame simulation */}
        <div className="relative z-10 my-auto text-center space-y-6">
          {/* Earbuds floating asset visual simulation */}
          <div className="relative mx-auto w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
            {/* Ambient Aura Ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700 ${
                isPlaying
                  ? 'bg-gradient-to-tr from-indigo-500/30 via-emerald-500/20 to-purple-500/30 blur-2xl scale-110'
                  : 'bg-indigo-500/10 blur-xl'
              }`}
            />

            {/* Futuristic floating earbud graphic */}
            <div className="relative z-10 w-32 h-32 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 p-6 flex flex-col items-center justify-between shadow-2xl">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="text-[10px] font-mono tracking-widest text-slate-300 font-bold">
                AURA PRO
              </div>
              <div className="w-12 h-1 rounded-full bg-indigo-500/50" />
            </div>

            {/* Active Noise Cancellation Wave Rings */}
            {isPlaying && (
              <div className="absolute inset-0 border border-indigo-500/30 rounded-full animate-ping pointer-events-none" />
            )}
          </div>

          {/* Timecode scene indicator */}
          <div className="space-y-1">
            <div className="inline-block px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono text-indigo-300">
              Sequence: {markers.find((m) => currentTime >= m.time)?.label || 'Introductory Acoustic Sweep'}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Dolby Atmos Headphone Master Cut · 45s Commercial Campaign
            </p>
          </div>
        </div>

        {/* Big Overlay Center Play Button if paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
            <button
              onClick={handleTogglePlay}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
              title="Play Commercial Cut"
            >
              <Play className="w-7 h-7 fill-slate-950 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Scrub Bar with Interactive Timeline Markers */}
      <div className="px-4 pt-3 pb-2 bg-slate-900 border-t border-slate-800 space-y-2">
        {/* Progress Bar Container */}
        <div className="relative group cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />

          {/* Timeline Revision Pins */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none h-2">
            {markers.map((marker) => {
              const leftPercent = (marker.time / duration) * 100;
              return (
                <div
                  key={marker.time}
                  style={{ left: `${leftPercent}%` }}
                  className="absolute -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950 pointer-events-auto cursor-pointer"
                  onClick={() => handleSeek(marker.time)}
                  title={`Jump to ${formatSeconds(marker.time)}: ${marker.label}`}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Playback Controls */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => handleSeek(0)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Timecode Readout */}
            <div className="font-mono text-xs text-slate-200 tabular-nums">
              <span className="text-emerald-400 font-bold">{formatSeconds(currentTime)}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span className="text-slate-400">{formatSeconds(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed toggle */}
            <button
              onClick={handleSpeedCycle}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 font-mono text-[11px] text-slate-300 transition-colors cursor-pointer"
              title="Playback Speed"
            >
              {playbackSpeed}x
            </button>

            {/* Tag current timestamp for feedback */}
            {onTagTimestamp && (
              <button
                onClick={() => onTagTimestamp(formatSeconds(currentTime))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                title="Anchor feedback note to this exact second"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Tag @ {formatSeconds(currentTime)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
