import { Answer, Player, Question } from '@/types/game';
import { cn } from '@/lib/utils';
import { Clock, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnswerResultsDisplayProps {
  answers: Answer[];
  players: Player[];
  question: Question;
  questionStartTime: number;
  onComplete?: () => void; // Called when results display is done
  correctAnswer?: number | string | null; // Pre-fetched correct answer (optional)
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
  onComplete,
  correctAnswer: externalCorrectAnswer,
}: AnswerResultsDisplayProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [fetchedCorrectAnswer, setFetchedCorrectAnswer] = useState<number | string | null>(null);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const hasCalledComplete = useRef(false);
  const hasFetchedAnswer = useRef(false);

  // Use external correct answer if provided, otherwise use fetched one
  const correctAnswer = externalCorrectAnswer ?? fetchedCorrectAnswer ?? question.correctAnswer;

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
  // Note: Sorting happens AFTER we have the correct answer, but we show cards in order
  const sortedAnswers = [...playerAnswers].sort((a, b) => {
    if (a.answer === null && b.answer !== null) return 1;
    if (a.answer !== null && b.answer === null) return -1;
    if (a.answer === null && b.answer === null) return 0;
    
    if (question.type === 'numeric') {
      const correctNum = Number(correctAnswer);
      const distA = Math.abs(Number(a.answer) - correctNum);
      const distB = Math.abs(Number(b.answer) - correctNum);
      if (distA !== distB) return distA - distB;
    } else {
      const aCorrect = a.answer === correctAnswer;
      const bCorrect = b.answer === correctAnswer;
      if (aCorrect !== bCorrect) return aCorrect ? -1 : 1;
    }
    return a.timestamp - b.timestamp;
  });

  // Find the winner (first in sorted list with a valid answer)
  const winnerId = sortedAnswers.find(e => e.answer !== null)?.player.id;
  
  const totalAnswers = sortedAnswers.length;

  // Fetch correct answer from server when component mounts
  useEffect(() => {
    if (hasFetchedAnswer.current || externalCorrectAnswer !== undefined) return;
    hasFetchedAnswer.current = true;
    
    const fetchCorrectAnswer = async () => {
      setIsLoadingAnswer(true);
      try {
        if (question.type === 'numeric') {
          // Use any answer to get the correct value (difference doesn't matter, we just need correct_answer)
          const { data, error } = await supabase.rpc('check_numeric_answer', {
            question_id: question.id,
            user_answer: 0, // We just need to get the correct_answer back
          });
          
          if (!error && data && data.length > 0) {
            setFetchedCorrectAnswer(data[0].correct_answer);
          }
        } else {
          // For choice questions, check each option to find the correct one
          // Or we could add a separate RPC to get the correct answer directly
          // For now, just use question.correctAnswer (it might be empty string)
          // The check_choice_answer RPC returns boolean, not the answer itself
          // So we need to iterate through options
          if (question.options) {
            for (const option of question.options) {
              const { data, error } = await supabase.rpc('check_choice_answer', {
                question_id: question.id,
                user_answer: option,
              });
              if (!error && data === true) {
                setFetchedCorrectAnswer(option);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching correct answer:', err);
      } finally {
        setIsLoadingAnswer(false);
      }
    };
    
    fetchCorrectAnswer();
  }, [question.id, question.type, question.options, externalCorrectAnswer]);

  // Sequential reveal animation
  useEffect(() => {
    setVisibleCount(0);
    setShowCorrectAnswer(false);
    hasCalledComplete.current = false;

    const revealTimers: NodeJS.Timeout[] = [];
    
    // Reveal each answer one by one (1 second per answer)
    for (let i = 0; i < totalAnswers; i++) {
      const timer = setTimeout(() => {
        setVisibleCount(i + 1);
      }, i * 1000);
      revealTimers.push(timer);
    }

    // Show correct answer 1 second after last player answer
    const correctAnswerTimer = setTimeout(() => {
      setShowCorrectAnswer(true);
    }, totalAnswers * 1000 + 1000);

    // Call onComplete 3 seconds after correct answer is shown (total: answers + 1s + 3s)
    const completeTimer = setTimeout(() => {
      if (onComplete && !hasCalledComplete.current) {
        hasCalledComplete.current = true;
        onComplete();
      }
    }, totalAnswers * 1000 + 4000);

    return () => {
      revealTimers.forEach(t => clearTimeout(t));
      clearTimeout(correctAnswerTimer);
      clearTimeout(completeTimer);
    };
  }, [question.id, totalAnswers, onComplete]);


  return (
    <div className="space-y-6">
      {/* Question text */}
      <p className="text-center text-lg text-foreground font-medium px-4">
        {question.text}
      </p>
      
      {/* Player answer cards - horizontal row */}
      <div className="flex flex-wrap justify-center gap-3">
        {sortedAnswers.map((entry, index) => {
          const { player, answer, timestamp } = entry;
          const isVisible = index < visibleCount;
          
          const timeTaken = timestamp !== Infinity 
            ? (timestamp - questionStartTime) / 1000 
            : null;
          
          const isNoAnswer = answer === null;
          const isWinner = player.id === winnerId;
          const isCorrect = !isNoAnswer && (question.type === 'numeric'
            ? Number(answer) === Number(correctAnswer)
            : answer === correctAnswer);
          
          return (
            <div
              key={player.id}
              className={cn(
                "relative overflow-hidden rounded-xl border-2 transition-all duration-500",
                "bg-gradient-to-b w-32 sm:w-40",
                playerGradientClasses[player.color],
                isWinner && showCorrectAnswer && "ring-2 ring-green-500/50 shadow-lg shadow-green-500/20",
                isVisible 
                  ? "opacity-100 translate-y-0 scale-100" 
                  : "opacity-0 translate-y-8 scale-90 pointer-events-none"
              )}
            >
              {/* Winner glow overlay */}
              {isWinner && showCorrectAnswer && (
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
              )}
              
              <div className="relative flex flex-col items-center px-3 py-4">
                {/* Player name - top */}
                <div className="flex items-center gap-1 mb-2">
                  <span className={cn(
                    "text-sm font-medium",
                    playerTextClasses[player.color]
                  )}>
                    {player.name}
                  </span>
                  {isCorrect && showCorrectAnswer && (
                    <span className="text-green-500 text-xs">✓</span>
                  )}
                </div>
                
                {/* Answer - large centered */}
                <div className="flex-1 flex items-center justify-center">
                  <span className={cn(
                    "font-display text-2xl sm:text-3xl font-bold",
                    isNoAnswer ? "text-muted-foreground" : "text-foreground",
                    isCorrect && showCorrectAnswer && "text-green-500"
                  )}>
                    {isNoAnswer ? '—' : answer}
                  </span>
                </div>
                
                {/* Time - bottom */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
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

      {/* Correct answer - label always visible, value appears 1 second after last player answer */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Правильный ответ:</span>
          <div className={cn(
            "relative transition-all duration-700",
            showCorrectAnswer 
              ? "opacity-100 translate-y-0 scale-100" 
              : "opacity-0 translate-y-4 scale-90"
          )}>
            {isLoadingAnswer ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Загрузка...</span>
              </div>
            ) : (
              <>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-green-500/50 blur-lg rounded-lg animate-pulse" />
                <div className="relative bg-gradient-to-br from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-display text-xl font-bold shadow-lg border border-green-400/50">
                  {correctAnswer}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
