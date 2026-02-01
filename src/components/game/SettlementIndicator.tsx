import { cn } from '@/lib/utils';

interface SettlementIndicatorProps {
  currentRound: number;
  totalRounds?: number;
}

export function SettlementIndicator({ 
  currentRound, 
  totalRounds = 5 
}: SettlementIndicatorProps) {
  return (
    <div className="bg-[#3d2b1f] rounded-lg p-3 shadow-lg border border-[#5a4030]">
      {/* Header */}
      <h3 className="font-serif text-white text-sm mb-3 tracking-wide">Распределение</h3>
      
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
                    : isPast
                      ? "bg-[#7a6050]"
                      : "bg-[#5a4030]"
                )}
              />
              
              {/* Round slot - simple without player sticks */}
              <div className="py-2 px-3 bg-[#2a1f15] rounded min-w-[24px] h-10 flex items-center justify-center">
                <span 
                  className={cn(
                    "text-xs font-bold transition-all duration-300",
                    isActive 
                      ? "text-white" 
                      : isPast 
                        ? "text-[#8a7a6a]"
                        : "text-[#5a4a3a]"
                  )}
                >
                  {roundIndex + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
