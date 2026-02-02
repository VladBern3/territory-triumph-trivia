import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isLoading: false,
        }));
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error),
      }));
      return { error };
    }

    return { error: null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, username?: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: username,
        },
      },
    });

    if (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error),
      }));
      return { error };
    }

    setAuthState(prev => ({ ...prev, isLoading: false }));
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error),
      }));
      return { error };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error),
      }));
      return { error };
    }

    return { error: null };
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    clearError,
  };
}

function getErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Неверный email или пароль';
    case 'Email not confirmed':
      return 'Email не подтверждён. Проверьте почту';
    case 'User already registered':
      return 'Пользователь с таким email уже зарегистрирован';
    case 'Password should be at least 6 characters':
      return 'Пароль должен содержать минимум 6 символов';
    case 'Unable to validate email address: invalid format':
      return 'Неверный формат email';
    default:
      return error.message || 'Произошла ошибка. Попробуйте снова';
  }
}
