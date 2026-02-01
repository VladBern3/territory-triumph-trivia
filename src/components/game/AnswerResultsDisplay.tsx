import { Answer, Player, Question } from '@/types/game';
import { cn } from '@/lib/utils';
import { Clock, Check, X } from 'lucide-react';

interface AnswerResultsDisplayProps {
  answers: Answer[];
  players: Player[];
  question: Question;
  questionStartTime: number;
}

const playerBgClasses: Record<string, string> = {
  red: 'bg-player-red/20 border-player-red',
  blue: 'bg-player-blue/20 border-player-blue',
  green: 'bg-player-green/20 border-player-green',
  yellow: 'bg-player-yellow/20 border-player-yellow',
};

export function AnswerResultsDisplay({
  answers,
  players,
  question,
  questionStartTime,
}: AnswerResultsDisplayProps) {
  // Sort answers by ranking (closest to correct, then by time)
  const sortedAnswers = [...answers].sort((a, b) => {
    if (question.type === 'numeric') {
      const correctAnswer = Number(question.correctAnswer);
      const distA = Math.abs(Number(a.answer) - correctAnswer);
      const distB = Math.abs(Number(b.answer) - correctAnswer);
      if (distA !== distB) return distA - distB;
    } else {
      // For multiple choice, correct answers first
      const aCorrect = a.answer === question.correctAnswer;
      const bCorrect = b.answer === question.correctAnswer;
      if (aCorrect !== bCorrect) return aCorrect ? -1 : 1;
    }
    return a.timestamp - b.timestamp;
  });

  return (
    <div className="space-y-3">
      <p className="text-center text-muted-foreground text-sm font-medium">
        Ответы игроков
      </p>
      
      <div className="grid grid-cols-1 gap-2">
        {sortedAnswers.map((answer, index) => {
          const player = players.find(p => p.id === answer.playerId);
          if (!player) return null;
          
          const timeTaken = (answer.timestamp - questionStartTime) / 1000;
          const isCorrect = question.type === 'numeric'
            ? Number(answer.answer) === Number(question.correctAnswer)
            : answer.answer === question.correctAnswer;
          
          // For numeric, show distance
          const distance = question.type === 'numeric'
            ? Math.abs(Number(answer.answer) - Number(question.correctAnswer))
            : null;
          
          return (
            <div
              key={answer.playerId}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all",
                "animate-fade-in",
                playerBgClasses[player.color]
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Player info and answer */}
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-sm">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-semibold">{player.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono">{answer.answer}</span>
                    {isCorrect ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <>
                        <X className="w-4 h-4 text-destructive" />
                        {distance !== null && (
                          <span className="text-muted-foreground text-xs">
                            (±{distance})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Time taken */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{timeTaken.toFixed(2)}с</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Correct answer display */}
      <div className="text-center pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Правильный ответ: <span className="font-bold text-primary">{question.correctAnswer}</span>
        </p>
      </div>
    </div>
  );
}
