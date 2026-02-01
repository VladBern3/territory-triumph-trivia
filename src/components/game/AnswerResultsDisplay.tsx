import { Answer, Player, Question } from '@/types/game';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface AnswerResultsDisplayProps {
  answers: Answer[];
  players: Player[];
  question: Question;
  questionStartTime: number;
}

const playerGradientClasses: Record<string, string> = {
  red: 'from-player-red/30 via-player-red/20 to-player-red/10 border-player-red/50',
  blue: 'from-player-blue/30 via-player-blue/20 to-player-blue/10 border-player-blue/50',
  green: 'from-player-green/30 via-player-green/20 to-player-green/10 border-player-green/50',
  yellow: 'from-player-yellow/30 via-player-yellow/20 to-player-yellow/10 border-player-yellow/50',
};

const playerTextClasses: Record<string, string> = {
  red: 'text-player-red',
  blue: 'text-player-blue',
  green: 'text-player-green',
  yellow: 'text-player-yellow',
};

export function AnswerResultsDisplay({
  answers,
  players,
  question,
  questionStartTime,
}: AnswerResultsDisplayProps) {
  // Get all active players and their answers
  const activePlayers = players.filter(p => !p.isEliminated);
  
  // Create answer entries for all players (including those who didn't answer)
  const playerAnswers = activePlayers.map(player => {
    const answer = answers.find(a => a.playerId === player.id);
    return {
      player,
      answer: answer?.answer ?? null,
      timestamp: answer?.timestamp ?? Infinity,
    };
  });
  
  // Sort answers by ranking (closest to correct, then by time)
  const sortedAnswers = [...playerAnswers].sort((a, b) => {
    if (a.answer === null && b.answer !== null) return 1;
    if (a.answer !== null && b.answer === null) return -1;
    if (a.answer === null && b.answer === null) return 0;
    
    if (question.type === 'numeric') {
      const correctAnswer = Number(question.correctAnswer);
      const distA = Math.abs(Number(a.answer) - correctAnswer);
      const distB = Math.abs(Number(b.answer) - correctAnswer);
      if (distA !== distB) return distA - distB;
    } else {
      const aCorrect = a.answer === question.correctAnswer;
      const bCorrect = b.answer === question.correctAnswer;
      if (aCorrect !== bCorrect) return aCorrect ? -1 : 1;
    }
    return a.timestamp - b.timestamp;
  });

  // Find the winner (first in sorted list with a valid answer)
  const winnerId = sortedAnswers.find(e => e.answer !== null)?.player.id;

  return (
    <div className="space-y-4">
      {/* Question text */}
      <p className="text-center text-lg text-foreground font-medium px-4">
        {question.text}
      </p>
      
      {/* Correct answer - top right corner with glow */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Правильный ответ:</span>
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-green-500/50 blur-lg rounded-lg animate-pulse" />
            <div className="relative bg-gradient-to-br from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-display text-xl font-bold shadow-lg border border-green-400/50">
              {question.correctAnswer}
            </div>
          </div>
        </div>
      </div>
      
      {/* Player answer cards */}
      <div className="grid grid-cols-1 gap-3">
        {sortedAnswers.map((entry, index) => {
          const { player, answer, timestamp } = entry;
          
          const timeTaken = timestamp !== Infinity 
            ? (timestamp - questionStartTime) / 1000 
            : null;
          
          const isNoAnswer = answer === null;
          const isWinner = player.id === winnerId;
          const isCorrect = !isNoAnswer && (question.type === 'numeric'
            ? Number(answer) === Number(question.correctAnswer)
            : answer === question.correctAnswer);
          
          return (
            <div
              key={player.id}
              className={cn(
                "relative overflow-hidden rounded-xl border-2 transition-all",
                "bg-gradient-to-r",
                playerGradientClasses[player.color],
                isWinner && "ring-2 ring-green-500/50 shadow-lg shadow-green-500/20",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Winner glow overlay */}
              {isWinner && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent pointer-events-none" />
              )}
              
              <div className="relative flex items-center justify-between px-5 py-4">
                {/* Answer - large centered */}
                <div className="flex-1 text-center">
                  <span className={cn(
                    "font-display text-3xl font-bold",
                    isNoAnswer ? "text-muted-foreground" : "text-foreground",
                    isCorrect && "text-green-500"
                  )}>
                    {isNoAnswer ? '—' : answer}
                  </span>
                </div>
                
                {/* Player name - bottom left */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    playerTextClasses[player.color]
                  )}>
                    {player.name}
                  </span>
                  {isCorrect && (
                    <span className="text-green-500 text-xs">✓</span>
                  )}
                </div>
                
                {/* Time - bottom right */}
                <div className="absolute bottom-2 right-4 flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono text-xs">
                    {timeTaken !== null ? timeTaken.toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
