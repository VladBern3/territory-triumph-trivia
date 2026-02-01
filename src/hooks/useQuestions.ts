import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/game';

export function useQuestions() {
  const [numericQuestions, setNumericQuestions] = useState<Question[]>([]);
  const [choiceQuestions, setChoiceQuestions] = useState<Question[]>([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const loadQuestions = useCallback(async () => {
    if (loadedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const [numericResult, choiceResult] = await Promise.all([
        supabase.from('numeric_questions').select('*'),
        supabase.from('choice_questions').select('*'),
      ]);

      if (numericResult.error) throw numericResult.error;
      if (choiceResult.error) throw choiceResult.error;

      const numericMapped: Question[] = (numericResult.data || []).map(q => ({
        id: q.id,
        type: 'numeric' as const,
        text: q.text,
        correctAnswer: q.correct_answer,
        category: q.category || undefined,
        difficulty: q.difficulty || undefined,
      }));

      const choiceMapped: Question[] = (choiceResult.data || []).map(q => ({
        id: q.id,
        type: 'multiple_choice' as const,
        text: q.text,
        correctAnswer: q.correct_answer,
        options: Array.isArray(q.options) ? q.options as string[] : [],
        category: q.category || undefined,
        difficulty: q.difficulty || undefined,
      }));

      setNumericQuestions(numericMapped);
      setChoiceQuestions(choiceMapped);
      loadedRef.current = true;
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Не удалось загрузить вопросы');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRandomNumericQuestion = useCallback((): Question | null => {
    const available = numericQuestions.filter(q => !usedQuestionIds.includes(q.id));
    if (available.length === 0) return null;
    const question = available[Math.floor(Math.random() * available.length)];
    setUsedQuestionIds(prev => [...prev, question.id]);
    return question;
  }, [numericQuestions, usedQuestionIds]);

  const getRandomChoiceQuestion = useCallback((): Question | null => {
    const available = choiceQuestions.filter(q => !usedQuestionIds.includes(q.id));
    if (available.length === 0) return null;
    const question = available[Math.floor(Math.random() * available.length)];
    setUsedQuestionIds(prev => [...prev, question.id]);
    return question;
  }, [choiceQuestions, usedQuestionIds]);

  const resetUsedQuestions = useCallback(() => {
    setUsedQuestionIds([]);
  }, []);

  return {
    numericQuestions,
    choiceQuestions,
    isLoading,
    error,
    loadQuestions,
    getRandomNumericQuestion,
    getRandomChoiceQuestion,
    resetUsedQuestions,
    usedQuestionIds,
  };
}
