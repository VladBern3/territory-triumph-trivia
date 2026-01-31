import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Trophy, Sparkles, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface GameOverScreenProps {
  winner: Player;
  onPlayAgain: () => void;
}

const colorClasses = {
  red: 'text-player-red',
  blue: 'text-player-blue',
  green: 'text-player-green',
  yellow: 'text-player-yellow',
};

const bgColorClasses = {
  red: 'bg-player-red/20',
  blue: 'bg-player-blue/20',
  green: 'bg-player-green/20',
  yellow: 'bg-player-yellow/20',
};

export function GameOverScreen({ winner, onPlayAgain }: GameOverScreenProps) {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#B8860B', '#FFD700'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#B8860B', '#FFD700'],
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);

  return (
    <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
      <Card className={cn(
        'w-full max-w-lg medieval-border bg-card/95 backdrop-blur animate-scale-in',
        bgColorClasses[winner.color]
      )}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-20 h-20 text-gold-shine animate-pulse" />
              <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 text-primary" />
              <Sparkles className="absolute -right-2 top-0 w-6 h-6 text-gold-shine animate-ping" />
              <Sparkles className="absolute -left-2 bottom-0 w-6 h-6 text-gold-shine animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
          
          <CardTitle className="font-display text-3xl gold-text">
            ПОБЕДА!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">Весь мир покорился</p>
            <h2 className={cn('font-display text-4xl font-bold', colorClasses[winner.color])}>
              {winner.name}
            </h2>
          </div>
          
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-lg">
              <span className="font-display font-semibold">{winner.territories.length}</span>
              <span className="text-muted-foreground ml-2">
                {winner.territories.length === 1 ? 'территория' : 
                 winner.territories.length <= 4 ? 'территории' : 'территорий'} завоёвано
              </span>
            </p>
          </div>
          
          <Button
            variant="royal"
            size="xl"
            onClick={onPlayAgain}
            className="w-full"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Сыграть ещё раз
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
