import { useState, useEffect, useRef } from 'react';
import { Question, Answer, Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnswerResultsDisplay } from './AnswerResultsDisplay';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: Answer) => void;
  playerId: string;
  timeLimit?: number; // in seconds
  showHint?: boolean;
  collectedAnswers?: Answer[];
  players?: Player[];
  expectedAnswerCount?: number;
  questionStartTime?: number;
}

export function QuestionCard({
  question,
  onAnswer,
  playerId,
  timeLimit = 10,
  showHint = false,
  collectedAnswers = [],
  players = [],
  expectedAnswerCount = 1,
  questionStartTime: externalStartTime,
}: QuestionCardProps) {
  const [numericAnswer, setNumericAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const internalStartTime = useRef(Date.now());
  const questionStartTime = externalStartTime ?? internalStartTime.current;
  const numericAnswerRef = useRef('');
  const selectedOptionRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    numericAnswerRef.current = numericAnswer;
  }, [numericAnswer]);

  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  // Reset state when question changes
  useEffect(() => {
    setNumericAnswer('');
    setSelectedOption(null);
    setTimeLeft(timeLimit);
    setIsSubmitted(false);
    setShowResults(false);
    internalStartTime.current = Date.now();
    numericAnswerRef.current = '';
    selectedOptionRef.current = null;
  }, [question.id, timeLimit]);

  // Check if all answers are collected
  useEffect(() => {
    if (collectedAnswers.length >= expectedAnswerCount && expectedAnswerCount > 0) {
      setShowResults(true);
    }
  }, [collectedAnswers.length, expectedAnswerCount]);

  // Timer runs independently - only stops when showing results
  useEffect(() => {
    if (showResults) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit with current input value
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResults, question.id]);

  // Auto-submit when timer expires (uses refs to get current values)
  const handleAutoSubmit = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    
    const answer: Answer = {
      playerId,
      answer: question.type === 'numeric' 
        ? Number(numericAnswerRef.current) || 0 
        : (selectedOptionRef.current || ''),
      timestamp: Date.now(),
    };
    
    onAnswer(answer);
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    
    const answer: Answer = {
      playerId,
      answer: question.type === 'numeric' ? Number(numericAnswer) || 0 : (selectedOption || ''),
      timestamp: Date.now(),
    };
    
    onAnswer(answer);
  };

  const handleOptionClick = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const timerPercentage = (timeLeft / timeLimit) * 100;
  const timerColor = timeLeft <= 3 ? 'bg-destructive' : timeLeft <= 6 ? 'bg-primary' : 'bg-green-500';

  // Show results view when all answers are collected
  if (showResults && collectedAnswers.length > 0) {
    return (
      <Card className="medieval-border bg-card max-w-2xl mx-auto animate-scale-in">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-xl text-center">
            Результаты раунда
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnswerResultsDisplay
            answers={collectedAnswers}
            players={players}
            question={question}
            questionStartTime={questionStartTime}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="medieval-border bg-card max-w-2xl mx-auto animate-scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Вопрос
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Clock className={cn('w-4 h-4', timeLeft <= 5 && 'text-destructive animate-pulse')} />
            <span className={cn('font-mono font-bold', timeLeft <= 5 && 'text-destructive')}>
              {timeLeft}с
            </span>
          </div>
        </div>
        {/* Timer bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className={cn('h-full transition-all duration-1000 ease-linear', timerColor)}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-lg text-foreground leading-relaxed">
          {question.text}
        </p>
        
        {showHint && question.hint && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
            Подсказка: {question.hint}
          </p>
        )}
        
        {/* Show waiting indicator if already submitted but waiting for others */}
        {isSubmitted && !showResults && (
          <div className="text-center py-4">
            <p className="text-muted-foreground animate-pulse">
              Ожидаем ответы других игроков...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ответили: {collectedAnswers.length} / {expectedAnswerCount}
            </p>
          </div>
        )}
        
        {/* Input section - hide if submitted */}
        {!isSubmitted && (
          <>
            {question.type === 'numeric' ? (
              <div className="space-y-3">
                <Input
                  type="number"
                  placeholder="Введите число..."
                  value={numericAnswer}
                  onChange={(e) => setNumericAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && numericAnswer && !isSubmitted) {
                      handleSubmit();
                    }
                  }}
                  disabled={isSubmitted}
                  className="text-lg text-center font-mono"
                  autoFocus
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitted || !numericAnswer}
                  variant="royal"
                  size="lg"
                  className="w-full"
                >
                  Ответить
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options?.map((option, index) => (
                  <Button
                    key={option}
                    onClick={() => {
                      handleOptionClick(option);
                      setTimeout(handleSubmit, 200);
                    }}
                    disabled={isSubmitted}
                    variant={selectedOption === option ? 'royal' : 'parchment'}
                    size="lg"
                    className={cn(
                      'text-left justify-start h-auto py-4 px-4',
                      selectedOption === option && 'ring-2 ring-primary'
                    )}
                  >
                    <span className="font-display font-bold text-primary mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
