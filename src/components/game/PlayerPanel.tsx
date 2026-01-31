import { Player } from '@/types/game';
import { Castle, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerPanelProps {
  players: Player[];
  currentPlayerId: string | null;
}

const playerBgClasses = {
  red: 'bg-player-red/20 border-player-red',
  blue: 'bg-player-blue/20 border-player-blue',
  green: 'bg-player-green/20 border-player-green',
  yellow: 'bg-player-yellow/20 border-player-yellow',
};

const playerTextClasses = {
  red: 'text-player-red',
  blue: 'text-player-blue',
  green: 'text-player-green',
  yellow: 'text-player-yellow',
};

export function PlayerPanel({ players, currentPlayerId }: PlayerPanelProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {players.map((player) => (
        <div
          key={player.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-300',
            playerBgClasses[player.color],
            player.isEliminated && 'opacity-40 grayscale',
            currentPlayerId === player.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
          )}
        >
          {/* Player icon */}
          <div className={cn('relative', playerTextClasses[player.color])}>
            {player.capitalId ? (
              <Castle className="w-6 h-6" />
            ) : (
              <Shield className="w-6 h-6" />
            )}
            {currentPlayerId === player.id && (
              <Crown className="absolute -top-2 -right-2 w-4 h-4 text-gold-shine animate-pulse" />
            )}
          </div>
          
          {/* Player info */}
          <div className="flex flex-col">
            <span className={cn('font-display font-semibold text-sm', playerTextClasses[player.color])}>
              {player.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {player.territories.length} {getTerritoryWord(player.territories.length)}
            </span>
          </div>
          
          {/* Eliminated badge */}
          {player.isEliminated && (
            <span className="text-xs text-destructive font-semibold ml-2">
              Выбыл
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function getTerritoryWord(count: number): string {
  if (count === 1) return 'земля';
  if (count >= 2 && count <= 4) return 'земли';
  return 'земель';
}
