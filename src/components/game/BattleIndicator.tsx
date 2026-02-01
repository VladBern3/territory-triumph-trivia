import { Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface BattleIndicatorProps {
  players: Player[];
  currentRound: number;
  totalRounds?: number;
}

const playerColorClasses = {
  red: 'bg-player-red',
  blue: 'bg-player-blue',
  green: 'bg-player-green',
  yellow: 'bg-player-yellow',
};

export function BattleIndicator({ 
  players, 
  currentRound, 
  totalRounds = 4 
}: BattleIndicatorProps) {
  const activePlayers = players.filter(p => !p.isEliminated);
  
  return (
    <div className="bg-[#3d2b1f] rounded-lg p-3 shadow-lg border border-[#5a4030]">
      {/* Header */}
      <h3 className="font-serif text-white text-sm mb-3 tracking-wide">Битка</h3>
      
      {/* Rounds */}
      <div className="flex gap-2">
        {Array.from({ length: totalRounds }).map((_, roundIndex) => {
          const isActive = roundIndex + 1 === currentRound;
          const isPast = roundIndex + 1 < currentRound;
          
          return (
            <div key={roundIndex} className="flex flex-col items-center gap-1">
              {/* Top light indicator */}
              <div 
                className={cn(
                  "w-8 h-1.5 rounded-full transition-all duration-500",
                  isActive 
                    ? "bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]" 
                    : "bg-[#5a4030]"
                )}
              />
              
              {/* Player turn sticks */}
              <div className="flex gap-0.5 py-2 px-1 bg-[#2a1f15] rounded">
                {activePlayers.map((player, playerIndex) => (
                  <div
                    key={player.id}
                    className={cn(
                      "w-1.5 h-6 rounded-sm transition-all duration-300",
                      // Rotate sticks slightly for visual interest
                      playerIndex === 0 && "-rotate-12",
                      playerIndex === 1 && "rotate-0",
                      playerIndex === 2 && "rotate-12",
                      // Color based on round status
                      isActive || isPast 
                        ? playerColorClasses[player.color]
                        : "bg-[#4a3a2a]"
                    )}
                    style={{
                      // Add delay for animation
                      transitionDelay: isActive ? `${playerIndex * 100}ms` : '0ms'
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
