import { Player, GamePhase } from '@/types/game';
import { cn } from '@/lib/utils';
import { BattleIndicator } from './BattleIndicator';
import { SettlementIndicator } from './SettlementIndicator';

interface PlayerPanelProps {
  players: Player[];
  currentPlayerId: string | null;
  roundNumber: number;
  phase: GamePhase;
  capitalBattleRound?: number;
}

const playerBgClasses = {
  red: 'bg-player-red/30',
  blue: 'bg-player-blue/30',
  green: 'bg-player-green/30',
  yellow: 'bg-player-yellow/30',
};

const playerColorClasses = {
  red: 'bg-player-red',
  blue: 'bg-player-blue',
  green: 'bg-player-green',
  yellow: 'bg-player-yellow',
};

export function PlayerPanel({ 
  players, 
  currentPlayerId, 
  roundNumber, 
  phase,
  capitalBattleRound = 0
}: PlayerPanelProps) {
  const isSettlementPhase = phase === 'settlement' || phase === 'initializing';
  const isBattlePhase = phase === 'war' || phase === 'capital_battle';

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Players */}
      <div className="flex gap-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300',
              playerBgClasses[player.color],
              player.isEliminated && 'opacity-40 grayscale',
              currentPlayerId === player.id && 'ring-2 ring-white/50 scale-105'
            )}
          >
            {/* Color indicator */}
            <div 
              className={cn(
                'w-4 h-4 rounded-full',
                playerColorClasses[player.color]
              )}
            />
            
            {/* Player info */}
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sm text-foreground">
                {player.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {player.score} очков
              </span>
            </div>
            
            {/* Eliminated badge */}
            {player.isEliminated && (
              <span className="text-xs text-destructive font-semibold">
                Выбыл
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Phase Indicator */}
      {isSettlementPhase && (
        <SettlementIndicator 
          currentRound={roundNumber}
          totalRounds={5}
        />
      )}
      
      {isBattlePhase && (
        <BattleIndicator 
          players={players} 
          currentRound={phase === 'capital_battle' ? capitalBattleRound : 1}
          totalRounds={phase === 'capital_battle' ? 3 : 4}
        />
      )}
    </div>
  );
}
