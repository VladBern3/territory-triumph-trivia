import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Crown, Mail, Lock, User, Loader2, ArrowLeft, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Неверный формат email');
const passwordSchema = z.string().min(6, 'Минимум 6 символов');
const usernameSchema = z.string().min(2, 'Минимум 2 символа').max(20, 'Максимум 20 символов');

type AuthMode = 'login' | 'register';

export default function Auth() {
  const navigate = useNavigate();
  const {
    user,
    isLoading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    username?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      errors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      errors.password = passwordResult.error.errors[0].message;
    }

    if (mode === 'register' && username) {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        errors.username = usernameResult.error.errors[0].message;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (!validateForm()) return;

    if (mode === 'login') {
      const { error } = await signInWithEmail(email, password);
      if (!error) {
        navigate('/');
      }
    } else {
      const { error } = await signUpWithEmail(email, password, username || undefined);
      if (!error) {
        setSuccessMessage('Регистрация успешна! Проверьте email для подтверждения.');
        setMode('login');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setValidationErrors({});
    clearError();
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
      <Card className="w-full max-w-md medieval-border bg-card/95 backdrop-blur animate-scale-in">
        <CardHeader className="text-center pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="w-fit -ml-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
          
          <div className="flex justify-center mb-4">
            <Crown className="w-12 h-12 text-primary" />
          </div>
          
          <CardTitle className="font-display text-3xl gold-text">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Войдите в свой аккаунт' 
              : 'Создайте аккаунт для игры'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (only for registration) */}
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Имя игрока
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ваше имя..."
                  maxLength={20}
                  className={cn(validationErrors.username && 'border-destructive')}
                />
                {validationErrors.username && (
                  <p className="text-xs text-destructive">{validationErrors.username}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={cn(validationErrors.email && 'border-destructive')}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Пароль
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(validationErrors.password && 'border-destructive')}
              />
              {validationErrors.password && (
                <p className="text-xs text-destructive">{validationErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="royal"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">или</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Войти через Google
          </Button>

          {/* Switch Mode */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            </span>
            <button
              type="button"
              onClick={switchMode}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Зарегистрируйтесь' : 'Войдите'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
