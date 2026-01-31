import { useState } from 'react';
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Crown, Users, Swords, Castle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameLobbyProps {
  onStartGame: (players: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>[]) => void;
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

export function GameLobby({ onStartGame }: GameLobbyProps) {
  const [players, setPlayers] = useState<{ id: string; name: string; color: typeof playerColors[number] }[]>([
    { id: '1', name: 'Игрок 1', color: 'red' },
    { id: '2', name: 'Игрок 2', color: 'blue' },
  ]);

  const addPlayer = () => {
    if (players.length >= 4) return;
    const availableColors = playerColors.filter(c => !players.some(p => p.color === c));
    const newPlayer = {
      id: String(Date.now()),
      name: `Игрок ${players.length + 1}`,
      color: availableColors[0],
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const handleStartGame = () => {
    if (players.length < 2) return;
    onStartGame(players);
  };

  return (
    <div className="min-h-screen parchment-texture flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl medieval-border bg-card/95 backdrop-blur animate-scale-in">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="w-16 h-16 text-primary" />
              <Swords className="absolute -bottom-2 -right-2 w-8 h-8 text-accent" />
            </div>
          </div>
          <CardTitle className="font-display text-4xl gold-text">
            Conquiztador
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Викторина-стратегия на завоевание земель
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Rules summary */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Castle className="w-4 h-4" />
              Правила игры
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Расселение:</strong> Отвечайте на вопросы с числовым ответом. Ближайший к правильному захватывает территории.</li>
              <li><strong>Война:</strong> Атакуйте соседей! Вопрос с 4 вариантами — кто быстрее и правильнее.</li>
              <li><strong>Столица:</strong> Защитите свой замок — его потеря означает поражение!</li>
            </ul>
          </div>

          {/* Players list */}
          <div className="space-y-3">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Игроки ({players.length}/4)
            </h3>
            
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 animate-fade-in"
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-display font-bold',
                  colorClasses[player.color]
                )}>
                  {index + 1}
                </div>
                <Input
                  value={player.name}
                  onChange={(e) => updatePlayerName(player.id, e.target.value)}
                  className="flex-1"
                  maxLength={20}
                />
                <span className="text-sm text-muted-foreground w-20">
                  {colorNames[player.color]}
                </span>
                {players.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(player.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {players.length < 4 && (
              <Button
                variant="outline"
                onClick={addPlayer}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить игрока
              </Button>
            )}
          </div>

          {/* Start button */}
          <Button
            variant="royal"
            size="xl"
            onClick={handleStartGame}
            className="w-full"
          >
            <Swords className="w-5 h-5 mr-2" />
            Начать завоевание
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
