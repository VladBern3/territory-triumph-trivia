import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Swords, Shield, Castle, Timer, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BattleInfoProps {
  phase: 'settlement' | 'war' | 'capital_battle';
  roundNumber: number;
  capitalBattleRound: number;
  attackerName?: string;
  defenderName?: string;
  targetTerritoryName?: string;
  attackerColor?: 'red' | 'blue' | 'green' | 'yellow';
  defenderColor?: 'red' | 'blue' | 'green' | 'yellow';
}

const colorClasses = {
  red: 'text-player-red',
  blue: 'text-player-blue',
  green: 'text-player-green',
  yellow: 'text-player-yellow',
};

export function BattleInfo({
  phase,
  roundNumber,
  capitalBattleRound,
  attackerName,
  defenderName,
  targetTerritoryName,
  attackerColor,
  defenderColor,
}: BattleInfoProps) {
  if (phase === 'settlement') {
    return (
      <Card className="medieval-border bg-secondary/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <Target className="w-6 h-6 text-primary" />
            <div className="text-center">
              <h3 className="font-display text-lg font-semibold">Этап Расселения</h3>
              <p className="text-sm text-muted-foreground">
                Раунд {roundNumber} — Ответьте точнее всех, чтобы захватить земли
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'capital_battle') {
    return (
      <Card className="medieval-border bg-accent/20 border-accent">
        <CardContent className="py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Castle className="w-6 h-6 text-accent animate-pulse" />
              <h3 className="font-display text-lg font-semibold text-accent">
                БИТВА ЗА СТОЛИЦУ!
              </h3>
              <Castle className="w-6 h-6 text-accent animate-pulse" />
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Swords className={cn('w-5 h-5', attackerColor && colorClasses[attackerColor])} />
                <span className={cn('font-semibold', attackerColor && colorClasses[attackerColor])}>
                  {attackerName}
                </span>
              </div>
              
              <span className="text-muted-foreground font-display">VS</span>
              
              <div className="flex items-center gap-2">
                <Shield className={cn('w-5 h-5', defenderColor && colorClasses[defenderColor])} />
                <span className={cn('font-semibold', defenderColor && colorClasses[defenderColor])}>
                  {defenderName}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map(round => (
                <div
                  key={round}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-display font-bold border-2',
                    round < capitalBattleRound && 'bg-accent text-accent-foreground border-accent',
                    round === capitalBattleRound && 'border-accent text-accent animate-pulse',
                    round > capitalBattleRound && 'border-border text-muted-foreground'
                  )}
                >
                  {round}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Нужно выиграть 3 раунда, чтобы захватить столицу
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="medieval-border bg-secondary/50">
      <CardContent className="py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-primary" />
            <h3 className="font-display text-lg font-semibold">Сражение</h3>
          </div>
          
          {attackerName && defenderName && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Swords className={cn('w-5 h-5', attackerColor && colorClasses[attackerColor])} />
                <span className={cn('font-semibold', attackerColor && colorClasses[attackerColor])}>
                  {attackerName}
                </span>
              </div>
              
              <span className="text-muted-foreground font-display">атакует</span>
              
              <div className="flex items-center gap-2">
                <Shield className={cn('w-5 h-5', defenderColor && colorClasses[defenderColor])} />
                <span className={cn('font-semibold', defenderColor && colorClasses[defenderColor])}>
                  {defenderName}
                </span>
              </div>
            </div>
          )}
          
          {targetTerritoryName && (
            <p className="text-sm text-muted-foreground">
              Цель: <strong>{targetTerritoryName}</strong>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
