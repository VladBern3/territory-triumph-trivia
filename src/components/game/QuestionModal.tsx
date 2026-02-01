import { Dialog, DialogContent } from '@/components/ui/dialog';
import { QuestionCard } from './QuestionCard';
import { Question, Answer, Player } from '@/types/game';
import { Swords, Target, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionModalProps {
  isOpen: boolean;
  question: Question | null;
  phase: 'settlement' | 'war' | 'capital_battle';
  attacker?: Player | null;
  defender?: Player | null;
  onSubmitAnswer: (answer: Answer) => void;
  capitalBattleRound?: number;
  currentPlayerId?: string | null;
  players: Player[];
  collectedAnswers?: Answer[];
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
  capitalBattleRound = 0,
  currentPlayerId,
  players,
  collectedAnswers = [],
}: QuestionModalProps) {
  if (!question) return null;

  const isCapitalBattle = phase === 'capital_battle';
  const isSettlement = phase === 'settlement';
  
  // Calculate expected answer count based on phase
  const expectedAnswerCount = isSettlement 
    ? players.filter(p => !p.isEliminated).length 
    : 2; // War phase: attacker and defender

  return (
    <Dialog open={isOpen} modal>
      <DialogContent 
        className={cn(
          "max-w-2xl w-[90vw] medieval-border p-6",
          isCapitalBattle && "border-gold-accent border-2"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {isSettlement ? (
          // Settlement phase - single question card
          <QuestionCard
            question={question}
            onAnswer={onSubmitAnswer}
            playerId={currentPlayerId || players[0]?.id || ''}
            timeLimit={10}
            showHint={true}
            collectedAnswers={collectedAnswers}
            players={players}
            expectedAnswerCount={expectedAnswerCount}
          />
        ) : (
          // War phase - show battle info and question
          <div className="space-y-4">
            {/* Battle header */}
            <div className="flex items-center justify-center gap-4 pb-2 border-b border-border">
              {attacker && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg border-2",
                  playerBorderClasses[attacker.color]
                )}>
                  <Swords className="w-4 h-4 text-destructive" />
                  <span className="font-display font-semibold">{attacker.name}</span>
                </div>
              )}
              <span className="text-muted-foreground font-display">VS</span>
              {defender && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg border-2",
                  playerBorderClasses[defender.color]
                )}>
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-display font-semibold">{defender.name}</span>
                </div>
              )}
            </div>

            {/* Capital battle indicator */}
            {isCapitalBattle && (
              <div className="flex items-center justify-center gap-2 text-gold-accent">
                <Crown className="w-5 h-5 animate-pulse" />
                <span className="font-display font-semibold">
                  Битва за столицу — Раунд {capitalBattleRound}/3
                </span>
                <Crown className="w-5 h-5 animate-pulse" />
              </div>
            )}

            {/* Question */}
            <QuestionCard
              question={question}
              onAnswer={onSubmitAnswer}
              playerId={attacker?.id || currentPlayerId || ''}
              timeLimit={10}
              collectedAnswers={collectedAnswers}
              players={players}
              expectedAnswerCount={expectedAnswerCount}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
