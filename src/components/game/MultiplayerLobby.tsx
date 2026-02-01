import { useState } from 'react';
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Crown, Users, Swords, Castle, Copy, Check, Loader2, ArrowLeft, UserPlus, Plus, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiplayerLobbyProps {
  sessionCode: string | null;
  players: Player[];
  localPlayerId: string | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  onCreateSession: (player: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>) => void;
  onJoinSession: (code: string, player: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>) => void;
  onStartGame: () => void;
  onLeaveSession: () => void;
  onSelectRole: (playerId: string) => void;
  onStartSinglePlayer: (playerName: string) => void;
}

const playerColors: Array<'red' | 'blue' | 'green' | 'yellow'> = ['red', 'blue', 'green', 'yellow'];

const colorNames = {
  red: 'Красный',
  blue: 'Синий',
  green: 'Зелёный',
  yellow: 'Жёлтый',
};

const colorClasses = {
  red: 'bg-player-red text-white',
  blue: 'bg-player-blue text-white',
  green: 'bg-player-green text-white',
  yellow: 'bg-player-yellow text-primary-foreground',
};

export function MultiplayerLobby({
  sessionCode,
  players,
  localPlayerId,
  isHost,
  isConnected,
  error,
  onCreateSession,
  onJoinSession,
  onStartGame,
  onLeaveSession,
  onSelectRole,
  onStartSinglePlayer,
}: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'waiting' | 'singleplayer'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getNextAvailableColor = () => {
    const usedColors = players.map(p => p.color);
    return playerColors.find(c => !usedColors.includes(c)) || 'red';
  };

  const handleCreateSession = async () => {
    if (!playerName.trim()) return;
    setIsLoading(true);
    
    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      color: getNextAvailableColor(),
    };
    
    onCreateSession(player);
    setMode('waiting');
    setIsLoading(false);
  };

  const handleJoinSession = async () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    setIsLoading(true);
    
    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      color: getNextAvailableColor(),
    };
    
    onJoinSession(joinCode.trim().toUpperCase(), player);
    setMode('waiting');
    setIsLoading(false);
  };

  const copyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    if (mode === 'waiting' && sessionCode) {
      onLeaveSession();
    }
    setMode('menu');
    setJoinCode('');
  };

  // Main menu
  if (mode === 'menu') {
    return (
      <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
        <Card className="w-full max-w-lg medieval-border bg-card/95 backdrop-blur animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Crown className="w-16 h-16 text-primary" />
                <Swords className="absolute -bottom-2 -right-2 w-8 h-8 text-accent" />
              </div>
            </div>
            <CardTitle className="font-display text-4xl gold-text">
              Quiz Empire
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Мультиплеерная викторина-стратегия
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Castle className="w-4 h-4" />
                Правила игры
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Расселение:</strong> Ближайший к правильному ответу захватывает территории</li>
                <li><strong>Война:</strong> Атакуйте соседей — кто быстрее и правильнее</li>
                <li><strong>Столица:</strong> Потеря замка = поражение!</li>
              </ul>
            </div>

            <Button
              variant="royal"
              size="xl"
              onClick={() => setMode('create')}
              className="w-full"
            >
              <Plus className="w-5 h-5 mr-2" />
              Создать игру
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setMode('singleplayer')}
              className="w-full"
            >
              <Bot className="w-5 h-5 mr-2" />
              Одиночная игра
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setMode('join')}
              className="w-full"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Присоединиться
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create session screen
  if (mode === 'create') {
    return (
      <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
        <Card className="w-full max-w-lg medieval-border bg-card/95 backdrop-blur animate-scale-in">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="w-fit -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <CardTitle className="font-display text-2xl">Создать игру</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ваше имя</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Введите имя..."
                maxLength={20}
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button
              variant="royal"
              size="lg"
              onClick={handleCreateSession}
              disabled={!playerName.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Создать сессию
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Join session screen
  if (mode === 'join') {
    return (
      <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
        <Card className="w-full max-w-lg medieval-border bg-card/95 backdrop-blur animate-scale-in">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="w-fit -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <CardTitle className="font-display text-2xl">Присоединиться</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ваше имя</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Введите имя..."
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Код игры</label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button
              variant="royal"
              size="lg"
              onClick={handleJoinSession}
              disabled={!playerName.trim() || joinCode.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Присоединиться
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single player setup screen
  if (mode === 'singleplayer') {
    const handleStartSinglePlayer = () => {
      if (!playerName.trim()) return;
      onStartSinglePlayer(playerName.trim());
    };

    return (
      <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
        <Card className="w-full max-w-lg medieval-border bg-card/95 backdrop-blur animate-scale-in">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="w-fit -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <CardTitle className="font-display text-2xl flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Одиночная игра
            </CardTitle>
            <CardDescription>
              Сразитесь против 2 компьютерных противников
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ваше имя</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Введите имя..."
                maxLength={20}
              />
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Ваши противники:</h4>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-player-blue flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm">Бот Алекс</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-player-green flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm">Бот Мария</span>
              </div>
            </div>
            
            <Button
              variant="royal"
              size="xl"
              onClick={handleStartSinglePlayer}
              disabled={!playerName.trim()}
              className="w-full"
            >
              <Swords className="w-5 h-5 mr-2" />
              Начать игру
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting room
  return (
    <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
      <Card className="w-full max-w-lg medieval-border bg-card/95 backdrop-blur animate-scale-in">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="w-fit -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Выйти
          </Button>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            Комната ожидания
            {isConnected ? (
              <span className="w-2 h-2 rounded-full bg-green-500" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Session code */}
          {sessionCode && (
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Код игры:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono font-bold tracking-widest">
                  {sessionCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyCode}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Поделитесь кодом с друзьями
              </p>
            </div>
          )}

          {/* Players list */}
          <div className="space-y-3">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Игроки ({players.length}/4)
            </h3>
            
            {players.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  player.id === localPlayerId && "bg-secondary/50"
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-display font-bold',
                  colorClasses[player.color]
                )}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    {player.name}
                    {player.id === localPlayerId && (
                      <span className="text-xs text-muted-foreground">(вы)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {colorNames[player.color]}
                  </p>
                </div>
              </div>
            ))}

            {/* Role selection for testing */}
            {players.length > 1 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Тестирование: зайти как другой игрок</p>
                <div className="flex gap-2 flex-wrap">
                  {players.map((player) => (
                    <Button
                      key={player.id}
                      variant={player.id === localPlayerId ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSelectRole(player.id)}
                      className="text-xs"
                    >
                      {player.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Start button (host only) */}
          {isHost && players.length >= 2 && (
            <Button
              variant="royal"
              size="xl"
              onClick={onStartGame}
              className="w-full"
            >
              <Swords className="w-5 h-5 mr-2" />
              Начать игру ({players.length} игрока)
            </Button>
          )}

          {!isHost && (
            <p className="text-center text-muted-foreground">
              Ожидание начала игры хостом...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
