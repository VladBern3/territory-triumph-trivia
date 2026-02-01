import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, Play, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundConfig {
  key: string;
  name: string;
  prompt: string;
  duration: number;
}

const GAME_SOUNDS: SoundConfig[] = [
  {
    key: 'gameStart',
    name: '🎺 Начало игры',
    prompt: 'Epic medieval war horn signal, single long blast, battle horn fanfare, cinematic orchestral',
    duration: 3,
  },
  {
    key: 'peacefulCapture',
    name: '🎵 Мирный захват',
    prompt: 'Short triumphant trumpet fanfare, medieval herald announcement, tu-tu-ruu victory jingle',
    duration: 2,
  },
  {
    key: 'enemyCapture',
    name: '⚔️ Захват врага',
    prompt: 'Metallic sword clashing sound, medieval battle swords hitting, steel weapons clash',
    duration: 2,
  },
  {
    key: 'underAttack',
    name: '🥁 Атака на вас',
    prompt: 'Medieval war drums beating, urgent battle drums, army march drumroll warning',
    duration: 3,
  },
];

interface SoundDebugPanelProps {
  onPlaySound: (prompt: string, duration: number) => Promise<void>;
  isLoading: boolean;
  currentlyPlaying: string | null;
}

export function SoundDebugPanel({ onPlaySound, isLoading, currentlyPlaying }: SoundDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12"
        variant="outline"
      >
        <Volume2 className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 z-50 w-72 shadow-lg transition-all duration-200",
      isMinimized && "w-48"
    )}>
      <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Звуки (debug)
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-3 pt-0 space-y-2">
          {GAME_SOUNDS.map((sound) => {
            const isPlaying = currentlyPlaying === sound.key;
            const isDisabled = isLoading;
            
            return (
              <Button
                key={sound.key}
                onClick={() => onPlaySound(sound.prompt, sound.duration)}
                disabled={isDisabled}
                variant="outline"
                className="w-full justify-start text-xs h-8"
                size="sm"
              >
                {isPlaying ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-2" />
                )}
                {sound.name}
              </Button>
            );
          })}
          
          <p className="text-[10px] text-muted-foreground pt-2 border-t">
            Звуки генерируются через ElevenLabs AI
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export { GAME_SOUNDS };
export type { SoundConfig };
