import { useState, useEffect } from 'react';
import { Timer, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerritorySelectionTimerProps {
  playerId: string; // Added to track player changes
  playerName: string;
  playerColor: 'red' | 'blue' | 'green' | 'yellow';
  isActive: boolean;
  duration?: number; // in seconds
  onTimeout: () => void;
}

const PLAYER_COLORS = {
  red: 'from-red-600 to-red-700',
  blue: 'from-blue-600 to-blue-700',
  green: 'from-green-600 to-green-700',
  yellow: 'from-amber-500 to-amber-600',
};

const PLAYER_BORDER_COLORS = {
  red: 'border-red-400',
  blue: 'border-blue-400',
  green: 'border-green-400',
  yellow: 'border-amber-400',
};

export function TerritorySelectionTimer({
  playerId,
  playerName,
  playerColor,
  isActive,
  duration = 15,
  onTimeout,
}: TerritorySelectionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hasTriggeredTimeout, setHasTriggeredTimeout] = useState(false);

  // Reset timer when player changes or becomes active
  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
      setHasTriggeredTimeout(false);
    }
  }, [isActive, playerId, duration]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Trigger timeout callback when timer reaches 0 (only once)
  useEffect(() => {
    if (timeLeft === 0 && isActive && !hasTriggeredTimeout) {
      setHasTriggeredTimeout(true);
      onTimeout();
    }
  }, [timeLeft, isActive, hasTriggeredTimeout, onTimeout]);

  if (!isActive) return null;

  const isUrgent = timeLeft <= 5;

  return (
    <div className="absolute top-16 right-4 z-20 animate-fade-in">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl shadow-lg border-2",
          "bg-gradient-to-r",
          PLAYER_COLORS[playerColor],
          PLAYER_BORDER_COLORS[playerColor]
        )}
      >
        {/* Timer progress bar background */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Timer progress bar */}
        <div
          className={cn(
            "absolute inset-0 bg-white/20 origin-left transition-transform duration-1000 ease-linear"
          )}
          style={{
            transform: `scaleX(${timeLeft / duration})`,
          }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Timer icon */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center",
            isUrgent && "animate-bounce"
          )}>
            <Timer className={cn(
              "w-5 h-5 text-white",
              isUrgent && "text-yellow-200"
            )} />
          </div>

          {/* Text content */}
          <div className="flex flex-col">
            <span className="text-white font-display font-bold text-sm md:text-base truncate max-w-[150px]">
              {playerName}
            </span>
            <span className="text-white/80 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              выбирает территорию
            </span>
          </div>

          {/* Timer countdown */}
          <div className={cn(
            "flex-shrink-0 ml-2 w-10 h-10 rounded-full flex items-center justify-center",
            "bg-black/30 font-display font-bold text-white text-lg",
            isUrgent && "text-yellow-200 animate-pulse"
          )}>
            {timeLeft}
          </div>
        </div>
      </div>
    </div>
  );
}
