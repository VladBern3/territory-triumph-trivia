import { useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  isSinglePlayer: boolean;
  showQuestionModal: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export function GameControls({
  isSinglePlayer,
  showQuestionModal,
  isMuted,
  onToggleMute,
  isPaused = false,
  onTogglePause,
}: GameControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
      {/* Sound toggle - available for all players */}
      <button
        onClick={onToggleMute}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          'bg-card/90 backdrop-blur-sm medieval-border shadow-lg',
          'transition-all duration-200 hover:scale-110 hover:bg-card',
          isMuted && 'text-muted-foreground'
        )}
        title={isMuted ? 'Включить звук' : 'Выключить звук'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5 text-gold-accent" />
        )}
      </button>

      {/* Pause button - only in single player, always visible */}
      {isSinglePlayer && onTogglePause && (
        <button
          onClick={onTogglePause}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full',
            'bg-card/90 backdrop-blur-sm medieval-border shadow-lg',
            'transition-all duration-200 hover:scale-110 hover:bg-card',
            isPaused && 'ring-2 ring-gold-accent'
          )}
          title={isPaused ? 'Продолжить' : 'Пауза'}
        >
          {isPaused ? (
            <Play className="w-5 h-5 text-gold-accent" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Pause overlay when paused - only when no question modal blocking */}
      {isPaused && isSinglePlayer && !showQuestionModal && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={onTogglePause}
        >
          <div className="bg-card/95 backdrop-blur-sm px-10 py-8 rounded-2xl medieval-border shadow-2xl text-center">
            <Pause className="w-12 h-12 mx-auto mb-4 text-gold-accent" />
            <h2 className="font-display text-3xl gold-text mb-2">Пауза</h2>
            <p className="text-muted-foreground text-sm">Нажмите для продолжения</p>
          </div>
        </div>
      )}
    </div>
  );
}
