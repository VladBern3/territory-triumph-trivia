import { useCallback, useRef } from 'react';

// Free sound effects URLs (royalty-free)
const SOUNDS = {
  capture: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Victory fanfare
  capitalCapture: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Achievement unlock
  battle: 'https://assets.mixkit.co/active_storage/sfx/2759/2759-preview.mp3', // Sword clash
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Correct answer
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Wrong answer
};

export function useGameSounds() {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isMuted = useRef(false);

  const preloadSound = useCallback((key: keyof typeof SOUNDS) => {
    if (!audioCache.current.has(key)) {
      const audio = new Audio(SOUNDS[key]);
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioCache.current.set(key, audio);
    }
  }, []);

  const playSound = useCallback((key: keyof typeof SOUNDS) => {
    if (isMuted.current) return;

    let audio = audioCache.current.get(key);
    
    if (!audio) {
      audio = new Audio(SOUNDS[key]);
      audio.volume = 0.5;
      audioCache.current.set(key, audio);
    }

    // Reset and play
    audio.currentTime = 0;
    audio.play().catch(err => {
      // Ignore autoplay errors (user hasn't interacted yet)
      console.log('Sound play blocked:', err.message);
    });
  }, []);

  const playCaptureSound = useCallback(() => {
    playSound('capture');
  }, [playSound]);

  const playCapitalCaptureSound = useCallback(() => {
    playSound('capitalCapture');
  }, [playSound]);

  const playBattleSound = useCallback(() => {
    playSound('battle');
  }, [playSound]);

  const playCorrectSound = useCallback(() => {
    playSound('correct');
  }, [playSound]);

  const playWrongSound = useCallback(() => {
    playSound('wrong');
  }, [playSound]);

  const setMuted = useCallback((muted: boolean) => {
    isMuted.current = muted;
  }, []);

  // Preload common sounds
  const preloadAll = useCallback(() => {
    Object.keys(SOUNDS).forEach(key => {
      preloadSound(key as keyof typeof SOUNDS);
    });
  }, [preloadSound]);

  return {
    playSound,
    playCaptureSound,
    playCapitalCaptureSound,
    playBattleSound,
    playCorrectSound,
    playWrongSound,
    setMuted,
    preloadAll,
  };
}
