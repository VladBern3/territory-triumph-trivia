import { useCallback, useRef, useState } from 'react';

// Free royalty-free sound effects URLs
const SOUND_URLS = {
  gameStart: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // War horn
  peacefulCapture: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Trumpet fanfare
  enemyCapture: 'https://assets.mixkit.co/active_storage/sfx/2759/2759-preview.mp3', // Sword clash
  underAttack: 'https://assets.mixkit.co/active_storage/sfx/2462/2462-preview.mp3', // War drums
};

type SoundKey = keyof typeof SOUND_URLS;

export function useGameSounds() {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isMuted = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const preloadSound = useCallback((key: SoundKey) => {
    if (!audioCache.current.has(key)) {
      const audio = new Audio(SOUND_URLS[key]);
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioCache.current.set(key, audio);
    }
  }, []);

  const playSound = useCallback((key: SoundKey) => {
    if (isMuted.current) return;

    let audio = audioCache.current.get(key);
    
    if (!audio) {
      audio = new Audio(SOUND_URLS[key]);
      audio.volume = 0.5;
      audioCache.current.set(key, audio);
    }

    setCurrentlyPlaying(key);

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
  }, []);

  // For debug panel compatibility - plays any sound by key
  const playGeneratedSound = useCallback(async (prompt: string, duration: number, cacheKey?: string) => {
    // Map prompts to sound keys for the debug panel
    const soundMap: Record<string, SoundKey> = {
      'Epic medieval war horn signal, single long blast, battle horn fanfare, cinematic orchestral': 'gameStart',
      'Short triumphant trumpet fanfare, medieval herald announcement, tu-tu-ruu victory jingle': 'peacefulCapture',
      'Metallic sword clashing sound, medieval battle swords hitting, steel weapons clash': 'enemyCapture',
      'Medieval war drums beating, urgent battle drums, army march drumroll warning': 'underAttack',
    };

    const soundKey = soundMap[prompt] || (cacheKey as SoundKey);
    if (soundKey && SOUND_URLS[soundKey]) {
      playSound(soundKey);
    }
  }, [playSound]);

  const playGameStartSound = useCallback(() => {
    playSound('gameStart');
  }, [playSound]);

  const playPeacefulCaptureSound = useCallback(() => {
    playSound('peacefulCapture');
  }, [playSound]);

  const playEnemyCaptureSound = useCallback(() => {
    playSound('enemyCapture');
  }, [playSound]);

  const playUnderAttackSound = useCallback(() => {
    playSound('underAttack');
  }, [playSound]);

  const setMuted = useCallback((muted: boolean) => {
    isMuted.current = muted;
  }, []);

  // Preload all sounds
  const preloadAll = useCallback(() => {
    Object.keys(SOUND_URLS).forEach(key => {
      preloadSound(key as SoundKey);
    });
    console.log('All game sounds preloaded');
  }, [preloadSound]);

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
