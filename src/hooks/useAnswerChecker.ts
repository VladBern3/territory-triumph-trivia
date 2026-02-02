import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NumericAnswerResult {
  correct_answer: number;
  difference: number;
  is_correct: boolean;
}

export function useAnswerChecker() {
  // Check a numeric answer and get the correct answer from the server
  const checkNumericAnswer = useCallback(async (
    questionId: string,
    userAnswer: number
  ): Promise<NumericAnswerResult | null> => {
    try {
      const { data, error } = await supabase.rpc('check_numeric_answer', {
        question_id: questionId,
        user_answer: userAnswer,
      });

      if (error) {
        console.error('Failed to check numeric answer:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('No result from check_numeric_answer');
        return null;
      }

      return data[0] as NumericAnswerResult;
    } catch (err) {
      console.error('Error checking numeric answer:', err);
      return null;
    }
  }, []);

  // Check a choice answer
  const checkChoiceAnswer = useCallback(async (
    questionId: string,
    userAnswer: string
  ): Promise<boolean | null> => {
    try {
      const { data, error } = await supabase.rpc('check_choice_answer', {
        question_id: questionId,
        user_answer: userAnswer,
      });

      if (error) {
        console.error('Failed to check choice answer:', error);
        return null;
      }

      return data as boolean;
    } catch (err) {
      console.error('Error checking choice answer:', err);
      return null;
    }
  }, []);

  return {
    checkNumericAnswer,
    checkChoiceAnswer,
  };
}
