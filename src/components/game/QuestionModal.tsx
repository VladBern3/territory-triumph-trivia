import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QuestionCard } from './QuestionCard';
import { Question, Answer, Player } from '@/types/game';
import { Swords, Target, Crown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionModalProps {
  isOpen: boolean;
  question: Question | null;
  phase: 'settlement' | 'war' | 'capital_battle';
  attacker?: Player | null;
  defender?: Player | null;
  onSubmitAnswer: (answer: Answer) => void;
  waitingForAnswers: boolean;
  capitalBattleRound?: number;
  currentPlayerId?: string | null;
  players: Player[];
}

const playerBorderClasses: Record<string, string> = {
  red: 'border-player-red',
  blue: 'border-player-blue',
  green: 'border-player-green',
  yellow: 'border-player-yellow',
};

export function QuestionModal({
  isOpen,
  question,
  phase,
  attacker,
  defender,
  onSubmitAnswer,
  waitingForAnswers,
  capitalBattleRound = 0,
  currentPlayerId,
  players,
}: QuestionModalProps) {
  if (!question) return null;

  const isCapitalBattle = phase === 'capital_battle';
  const isSettlement = phase === 'settlement';

  return (
    <Dialog open={isOpen} modal>
      <DialogContent 
        className={cn(
          "max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto medieval-border",
          isCapitalBattle && "border-gold-accent border-2"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center flex items-center justify-center gap-3">
            {isSettlement && (
              <>
                <Crown className="w-6 h-6 text-gold-accent" />
                Фаза расселения
                <Crown className="w-6 h-6 text-gold-accent" />
              </>
            )}
            {phase === 'war' && (
              <>
                <Swords className="w-6 h-6 text-primary" />
                Битва за территорию
                <Target className="w-6 h-6 text-primary" />
              </>
            )}
            {isCapitalBattle && (
              <>
                <Crown className="w-6 h-6 text-gold-shine animate-pulse" />
                Битва за столицу — Раунд {capitalBattleRound}/3
                <Crown className="w-6 h-6 text-gold-shine animate-pulse" />
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isSettlement ? (
            // Settlement phase - single question card
            <div className="max-w-xl mx-auto space-y-4">
              <QuestionCard
                question={question}
                onAnswer={onSubmitAnswer}
                playerId={currentPlayerId || players[0]?.id || ''}
                timeLimit={20}
                showHint={true}
              />
              {waitingForAnswers && (
                <div className="text-center py-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Info className="w-4 h-4" />
                    В полной версии все игроки отвечают одновременно
                  </p>
                </div>
              )}
            </div>
          ) : (
            // War phase - two cards side by side
            <div className="grid md:grid-cols-2 gap-6">
              {attacker && (
                <div className={cn(
                  "space-y-3 p-4 rounded-lg border-2",
                  playerBorderClasses[attacker.color],
                  "bg-gradient-to-br from-background to-muted/50"
                )}>
                  <div className="flex items-center justify-center gap-2">
                    <Swords className="w-5 h-5 text-destructive" />
                    <span className="font-display font-semibold">{attacker.name}</span>
                    <span className="text-sm text-muted-foreground">(Атакующий)</span>
                  </div>
                  <QuestionCard
                    question={question}
                    onAnswer={onSubmitAnswer}
                    playerId={attacker.id}
                    timeLimit={15}
                  />
                </div>
              )}
              {defender && (
                <div className={cn(
                  "space-y-3 p-4 rounded-lg border-2",
                  playerBorderClasses[defender.color],
                  "bg-gradient-to-br from-background to-muted/50"
                )}>
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-display font-semibold">{defender.name}</span>
                    <span className="text-sm text-muted-foreground">(Защитник)</span>
                  </div>
                  <QuestionCard
                    question={question}
                    onAnswer={onSubmitAnswer}
                    playerId={defender.id}
                    timeLimit={15}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
