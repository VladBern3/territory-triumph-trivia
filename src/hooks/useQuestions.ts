import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/game';

export function useQuestions() {
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Load is now a no-op since we fetch questions on demand via RPC
  const loadQuestions = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setIsLoading(false);
  }, []);

  // Fetch a random numeric question via RPC (doesn't expose correct answer)
  const getRandomNumericQuestion = useCallback(async (): Promise<Question | null> => {
    try {
      console.log('[useQuestions] Fetching numeric question, excluded:', usedQuestionIds.length);
      const { data, error } = await supabase.rpc('get_random_numeric_question', {
        excluded_ids: usedQuestionIds,
      });

      if (error) {
        console.error('[useQuestions] Failed to get numeric question:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('No numeric questions available');
        return null;
      }

      const q = data[0];
      setUsedQuestionIds(prev => [...prev, q.id]);
      
      return {
        id: q.id,
        type: 'numeric' as const,
        text: q.text,
        correctAnswer: 0, // Not exposed by RPC for anti-cheat
        category: q.category || undefined,
        difficulty: q.difficulty || undefined,
      };
    } catch (err) {
      console.error('Error fetching numeric question:', err);
      return null;
    }
  }, [usedQuestionIds]);

  // Fetch a random choice question via RPC (doesn't expose correct answer)
  const getRandomChoiceQuestion = useCallback(async (): Promise<Question | null> => {
    try {
      console.log('[useQuestions] Fetching choice question, excluded:', usedQuestionIds.length);
      const { data, error } = await supabase.rpc('get_random_choice_question', {
        excluded_ids: usedQuestionIds,
      });

      if (error) {
        console.error('[useQuestions] Failed to get choice question:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('No choice questions available');
        return null;
      }

      const q = data[0];
      setUsedQuestionIds(prev => [...prev, q.id]);
      
      return {
        id: q.id,
        type: 'multiple_choice' as const,
        text: q.text,
        correctAnswer: '', // Not exposed by RPC for anti-cheat
        options: Array.isArray(q.options) ? q.options as string[] : [],
        category: q.category || undefined,
        difficulty: q.difficulty || undefined,
      };
    } catch (err) {
      console.error('Error fetching choice question:', err);
      return null;
    }
  }, [usedQuestionIds]);

  const resetUsedQuestions = useCallback(() => {
    setUsedQuestionIds([]);
  }, []);

  return {
    isLoading,
    error,
    loadQuestions,
    getRandomNumericQuestion,
    getRandomChoiceQuestion,
    resetUsedQuestions,
    usedQuestionIds,
  };
}
