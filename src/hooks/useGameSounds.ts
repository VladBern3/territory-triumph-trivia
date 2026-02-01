import { useCallback, useRef, useState } from 'react';

const SUPABASE_URL = "https://amkfedsjcjdqgwbfwitt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2ZlZHNqY2pkcWd3YmZ3aXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDUwNjIsImV4cCI6MjA4NTQ4MTA2Mn0.pq8E9KuCFRnEoH4PJrjm7XK-Q45n_J-b_ijAvKTIPkw";

// Sound prompts for ElevenLabs
const SOUND_PROMPTS = {
  gameStart: {
    prompt: 'Epic medieval war horn signal, single long blast, battle horn fanfare, cinematic orchestral',
    duration: 3,
  },
  peacefulCapture: {
    prompt: 'Short triumphant trumpet fanfare, medieval herald announcement, tu-tu-ruu victory jingle',
    duration: 2,
  },
  enemyCapture: {
    prompt: 'Metallic sword clashing sound, medieval battle swords hitting, steel weapons clash',
    duration: 2,
  },
  underAttack: {
    prompt: 'Medieval war drums beating, urgent battle drums, army march drumroll warning',
    duration: 3,
  },
};

type SoundKey = keyof typeof SOUND_PROMPTS;

export function useGameSounds() {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isMuted = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const generateSound = useCallback(async (prompt: string, duration: number): Promise<Blob | null> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ prompt, duration }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Sound generation failed:', response.status, errorData);
        return null;
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating sound:', error);
      return null;
    }
  }, []);

  const playGeneratedSound = useCallback(async (prompt: string, duration: number, cacheKey?: string) => {
    if (isMuted.current) return;

    const key = cacheKey || prompt;
    
    // Check cache first
    let audio = audioCache.current.get(key);
    
    if (!audio) {
      setIsLoading(true);
      setCurrentlyPlaying(key);
      
      try {
        const audioBlob = await generateSound(prompt, duration);
        
        if (!audioBlob) {
          setIsLoading(false);
          setCurrentlyPlaying(null);
          return;
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        audio = new Audio(audioUrl);
        audio.volume = 0.6;
        audioCache.current.set(key, audio);
      } catch (error) {
        console.error('Error playing sound:', error);
        setIsLoading(false);
        setCurrentlyPlaying(null);
        return;
      }
    }

    setIsLoading(false);
    
    // Reset and play
    audio.currentTime = 0;
    audio.play()
      .then(() => {
        audio!.onended = () => setCurrentlyPlaying(null);
      })
      .catch(err => {
        console.log('Sound play blocked:', err.message);
        setCurrentlyPlaying(null);
      });
  }, [generateSound]);

  const playGameStartSound = useCallback(() => {
    const config = SOUND_PROMPTS.gameStart;
    playGeneratedSound(config.prompt, config.duration, 'gameStart');
  }, [playGeneratedSound]);

  const playPeacefulCaptureSound = useCallback(() => {
    const config = SOUND_PROMPTS.peacefulCapture;
    playGeneratedSound(config.prompt, config.duration, 'peacefulCapture');
  }, [playGeneratedSound]);

  const playEnemyCaptureSound = useCallback(() => {
    const config = SOUND_PROMPTS.enemyCapture;
    playGeneratedSound(config.prompt, config.duration, 'enemyCapture');
  }, [playGeneratedSound]);

  const playUnderAttackSound = useCallback(() => {
    const config = SOUND_PROMPTS.underAttack;
    playGeneratedSound(config.prompt, config.duration, 'underAttack');
  }, [playGeneratedSound]);

  const setMuted = useCallback((muted: boolean) => {
    isMuted.current = muted;
  }, []);

  // Preload all sounds (generate and cache them)
  const preloadAll = useCallback(async () => {
    console.log('Preloading game sounds...');
    for (const [key, config] of Object.entries(SOUND_PROMPTS)) {
      if (!audioCache.current.has(key)) {
        const audioBlob = await generateSound(config.prompt, config.duration);
        if (audioBlob) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.volume = 0.6;
          audioCache.current.set(key, audio);
          console.log(`Preloaded sound: ${key}`);
        }
      }
    }
    console.log('All sounds preloaded');
  }, [generateSound]);

  return {
    playGeneratedSound,
    playGameStartSound,
    playPeacefulCaptureSound,
    playEnemyCaptureSound,
    playUnderAttackSound,
    setMuted,
    preloadAll,
    isLoading,
    currentlyPlaying,
  };
}
