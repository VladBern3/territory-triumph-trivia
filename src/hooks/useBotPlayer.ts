import { useCallback, useRef } from 'react';
import { Answer, Question, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

// Bot difficulty determines how accurate and fast they respond
export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface BotConfig {
  // For numeric questions: max deviation from correct answer (as percentage or absolute)
  deviationRange: { min: number; max: number }; // percentage deviation (0.05 = 5%)
  // Response time in ms
  responseTime: { min: number; max: number };
  // Chance of getting the exact correct answer (0-1)
  exactCorrectChance: number;
  // Chance of getting multiple choice correct (0-1)
  correctChance: number;
}

const BOT_CONFIGS: Record<BotDifficulty, BotConfig> = {
  easy: {
    deviationRange: { min: 0.1, max: 0.3 }, // 10-30% deviation
    responseTime: { min: 3000, max: 6000 },
    exactCorrectChance: 0.1,
    correctChance: 0.4,
  },
  medium: {
    deviationRange: { min: 0.03, max: 0.15 }, // 3-15% deviation
    responseTime: { min: 2000, max: 4000 },
    exactCorrectChance: 0.25,
    correctChance: 0.6,
  },
  hard: {
    deviationRange: { min: 0, max: 0.05 }, // 0-5% deviation
    responseTime: { min: 1000, max: 2500 },
    exactCorrectChance: 0.5,
    correctChance: 0.85,
  },
};

const BOT_NAMES = ['Бот Алекс', 'Бот Мария', 'Бот Иван', 'Бот Елена'];

export function useBotPlayer() {
  const pendingBotsRef = useRef<Set<string>>(new Set());
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const correctAnswerCacheRef = useRef<{ questionId: string; answer: number | string } | null>(null);

  // Fetch correct answer from server (for bot use only)
  const fetchCorrectAnswerForBots = useCallback(async (question: Question): Promise<number | string | null> => {
    // Check cache first
    if (correctAnswerCacheRef.current?.questionId === question.id) {
      return correctAnswerCacheRef.current.answer;
    }

    try {
      if (question.type === 'numeric') {
        const { data, error } = await supabase.rpc('check_numeric_answer', {
          question_id: question.id,
          user_answer: 0,
        });
        if (!error && data && data.length > 0) {
          const answer = data[0].correct_answer;
          correctAnswerCacheRef.current = { questionId: question.id, answer };
          return answer;
        }
      } else if (question.options) {
        for (const option of question.options) {
          const { data, error } = await supabase.rpc('check_choice_answer', {
            question_id: question.id,
            user_answer: option,
          });
          if (!error && data === true) {
            correctAnswerCacheRef.current = { questionId: question.id, answer: option };
            return option;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching correct answer for bots:', err);
    }
    return null;
  }, []);

  // Generate a bot answer for a numeric question based on correct answer
  const generateNumericAnswer = useCallback((
    correctAnswer: number,
    difficulty: BotDifficulty
  ): number => {
    const config = BOT_CONFIGS[difficulty];
    
    // Chance to get exact correct answer
    if (Math.random() < config.exactCorrectChance) {
      return correctAnswer;
    }
    
    // Calculate deviation based on difficulty
    const deviationPercent = config.deviationRange.min + 
      Math.random() * (config.deviationRange.max - config.deviationRange.min);
    
    // For small numbers (like years), use a minimum absolute deviation
    // For example, year 1913 should have ±10-30 years, not ±0.1%
    const absoluteDeviation = Math.max(
      Math.abs(correctAnswer * deviationPercent),
      correctAnswer > 1000 && correctAnswer < 2100 ? 5 : 1 // Year-like numbers get min ±5
    );
    
    // Random direction (+ or -)
    const direction = Math.random() > 0.5 ? 1 : -1;
    const deviation = Math.round(absoluteDeviation * Math.random() * direction);
    
    const answer = correctAnswer + deviation;
    
    // Ensure non-negative
    return Math.max(0, Math.round(answer));
  }, []);

  // Generate a bot answer for multiple choice based on correct answer
  const generateMultipleChoiceAnswer = useCallback((
    question: Question,
    correctAnswer: string,
    difficulty: BotDifficulty
  ): string => {
    if (!question.options || question.options.length === 0) {
      return '';
    }
    
    const config = BOT_CONFIGS[difficulty];
    
    // Chance to get correct answer
    if (Math.random() < config.correctChance) {
      return correctAnswer;
    }
    
    // Pick a random wrong answer
    const wrongOptions = question.options.filter(opt => opt !== correctAnswer);
    if (wrongOptions.length === 0) {
      return correctAnswer;
    }
    
    return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  }, []);

  // Get response time for a bot
  const getResponseTime = useCallback((difficulty: BotDifficulty): number => {
    const config = BOT_CONFIGS[difficulty];
    return config.responseTime.min + 
      Math.random() * (config.responseTime.max - config.responseTime.min);
  }, []);

  // Schedule bot answers for a question - now fetches correct answer first
  const scheduleBotAnswers = useCallback(async (
    bots: Player[],
    question: Question,
    difficulty: BotDifficulty,
    onSubmitAnswer: (answer: Answer) => void
  ) => {
    // Clear any pending timeouts first
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
    pendingBotsRef.current.clear();

    // Fetch correct answer first (server-side, not exposed to UI)
    const correctAnswer = await fetchCorrectAnswerForBots(question);
    
    if (correctAnswer === null) {
      console.warn('Could not fetch correct answer for bots, using fallback');
    }

    bots.forEach(bot => {
      pendingBotsRef.current.add(bot.id);
      
      const responseTime = getResponseTime(difficulty);
      
      const timeoutId = setTimeout(() => {
        // Check if this bot answer is still pending
        if (!pendingBotsRef.current.has(bot.id)) return;
        
        let answer: number | string;
        
        if (question.type === 'numeric') {
          // Use correct answer for realistic range, or fallback to random
          const numericCorrect = correctAnswer !== null ? Number(correctAnswer) : Math.floor(Math.random() * 2000);
          answer = generateNumericAnswer(numericCorrect, difficulty);
        } else {
          // Use correct answer for weighted choice
          const stringCorrect = correctAnswer !== null ? String(correctAnswer) : (question.options?.[0] || '');
          answer = generateMultipleChoiceAnswer(question, stringCorrect, difficulty);
        }
        
        const botAnswer: Answer = {
          playerId: bot.id,
          answer,
          timestamp: Date.now(),
        };
        
        onSubmitAnswer(botAnswer);
        pendingBotsRef.current.delete(bot.id);
      }, responseTime);
      
      timeoutIdsRef.current.push(timeoutId);
    });
  }, [generateNumericAnswer, generateMultipleChoiceAnswer, getResponseTime, fetchCorrectAnswerForBots]);

  // Cancel all pending bot answers
  const cancelPendingAnswers = useCallback(() => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
    pendingBotsRef.current.clear();
    correctAnswerCacheRef.current = null;
  }, []);

  // Create bot players
  const createBots = useCallback((count: number, existingColors: Player['color'][]): Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>[] => {
    const allColors: Player['color'][] = ['red', 'blue', 'green', 'yellow'];
    const availableColors = allColors.filter(c => !existingColors.includes(c));
    
    return Array.from({ length: count }, (_, i) => ({
      id: `bot_${i + 1}_${Date.now()}`,
      name: BOT_NAMES[i] || `Бот ${i + 1}`,
      color: availableColors[i] || 'red',
      isBot: true,
    }));
  }, []);

  // Check if a player is a bot
  const isBot = useCallback((playerId: string): boolean => {
    return playerId.startsWith('bot_');
  }, []);

  return {
    scheduleBotAnswers,
    cancelPendingAnswers,
    createBots,
    isBot,
    generateNumericAnswer,
    generateMultipleChoiceAnswer,
  };
}
