import { useCallback, useRef } from 'react';
import { Answer, Question, Player } from '@/types/game';

// Bot difficulty determines how accurate and fast they respond
export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface BotConfig {
  // For numeric questions: how close to correct answer (as percentage)
  accuracyRange: { min: number; max: number };
  // Response time in ms
  responseTime: { min: number; max: number };
  // Chance of getting multiple choice correct (0-1)
  correctChance: number;
}

const BOT_CONFIGS: Record<BotDifficulty, BotConfig> = {
  easy: {
    accuracyRange: { min: 0.3, max: 0.8 },
    responseTime: { min: 3000, max: 6000 },
    correctChance: 0.4,
  },
  medium: {
    accuracyRange: { min: 0.1, max: 0.5 },
    responseTime: { min: 2000, max: 4000 },
    correctChance: 0.6,
  },
  hard: {
    accuracyRange: { min: 0, max: 0.2 },
    responseTime: { min: 1000, max: 2500 },
    correctChance: 0.85,
  },
};

const BOT_NAMES = ['Бот Алекс', 'Бот Мария', 'Бот Иван', 'Бот Елена'];

export function useBotPlayer() {
  const pendingBotsRef = useRef<Set<string>>(new Set());
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  // Generate a bot answer for a numeric question
  // Since we don't have the correct answer (anti-cheat), bots generate plausible random answers
  const generateNumericAnswer = useCallback((
    difficulty: BotDifficulty
  ): number => {
    const config = BOT_CONFIGS[difficulty];
    
    // Generate a plausible random answer based on difficulty
    // Harder bots generate answers in more "reasonable" ranges for trivia
    const baseRanges = {
      easy: { min: 1, max: 10000 },
      medium: { min: 10, max: 5000 },
      hard: { min: 50, max: 2000 },
    };
    
    const range = baseRanges[difficulty];
    const answer = Math.floor(range.min + Math.random() * (range.max - range.min));
    
    return answer;
  }, []);

  // Generate a bot answer for multiple choice
  // Since we don't have the correct answer, bot randomly picks from available options
  const generateMultipleChoiceAnswer = useCallback((
    question: Question,
    difficulty: BotDifficulty
  ): string => {
    if (!question.options || question.options.length === 0) {
      return '';
    }
    
    // All bots just pick a random option (we don't know which is correct)
    const randomIndex = Math.floor(Math.random() * question.options.length);
    return question.options[randomIndex];
  }, []);

  // Get response time for a bot
  const getResponseTime = useCallback((difficulty: BotDifficulty): number => {
    const config = BOT_CONFIGS[difficulty];
    return config.responseTime.min + 
      Math.random() * (config.responseTime.max - config.responseTime.min);
  }, []);

  // Schedule bot answers for a question
  const scheduleBotAnswers = useCallback((
    bots: Player[],
    question: Question,
    difficulty: BotDifficulty,
    onSubmitAnswer: (answer: Answer) => void
  ) => {
    // Clear any pending timeouts first
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
    pendingBotsRef.current.clear();

    bots.forEach(bot => {
      pendingBotsRef.current.add(bot.id);
      
      const responseTime = getResponseTime(difficulty);
      
      const timeoutId = setTimeout(() => {
        // Check if this bot answer is still pending
        if (!pendingBotsRef.current.has(bot.id)) return;
        
        let answer: number | string;
        
        if (question.type === 'numeric') {
          answer = generateNumericAnswer(difficulty);
        } else {
          answer = generateMultipleChoiceAnswer(question, difficulty);
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
  }, [generateNumericAnswer, generateMultipleChoiceAnswer, getResponseTime]);

  // Cancel all pending bot answers
  const cancelPendingAnswers = useCallback(() => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
    pendingBotsRef.current.clear();
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
