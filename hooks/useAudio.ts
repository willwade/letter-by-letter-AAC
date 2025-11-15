import { useState, useEffect, useCallback, useMemo } from 'react';

export interface UseAudioProps {
  enabled: boolean;
  volume?: number; // 0.0 to 1.0, default 0.3
}

export interface UseAudioReturn {
  playSound: (type: 'click' | 'select' | 'beep') => void;
  isLoaded: boolean;
}

/**
 * Custom hook for managing audio playback using Web Audio API
 * Provides ultra-fast, low-latency audio playback for UI sounds
 */
export function useAudio({ enabled, volume = 0.3 }: UseAudioProps): UseAudioReturn {
  // Web Audio API setup for high-performance audio playback
  const audioContext = useMemo(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      return new AudioContext();
    }
    return null;
  }, []);

  const [audioBuffers, setAudioBuffers] = useState<{
    click: AudioBuffer | null;
    select: AudioBuffer | null;
    beep: AudioBuffer | null;
  }>({ click: null, select: null, beep: null });

  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load audio files into buffers
  useEffect(() => {
    if (!audioContext) return;

    const loadAudio = async (url: string): Promise<AudioBuffer | null> => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
      } catch (error) {
        console.error('Failed to load audio:', url, error);
        return null;
      }
    };

    const loadAllAudio = async () => {
      const [clickBuffer, selectBuffer, beepBuffer] = await Promise.all([
        loadAudio('/letter-by-letter-AAC/click.mp3'),
        loadAudio('/letter-by-letter-AAC/click-select.mp3'),
        loadAudio('/letter-by-letter-AAC/beep.mp3'),
      ]);

      setAudioBuffers({
        click: clickBuffer,
        select: selectBuffer,
        beep: beepBuffer,
      });

      // Mark as loaded if at least one buffer loaded successfully
      setIsLoaded(!!(clickBuffer || selectBuffer || beepBuffer));
    };

    loadAllAudio();
  }, [audioContext]);

  // Helper function to play audio with Web Audio API (ultra-fast, no lag)
  const playSound = useCallback(
    (type: 'click' | 'select' | 'beep') => {
      if (!enabled || !audioContext || !audioBuffers[type]) return;

      // Create a new buffer source (very lightweight)
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffers[type];

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;

      // Connect: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play immediately
      source.start(0);
    },
    [enabled, audioContext, audioBuffers, volume]
  );

  return {
    playSound,
    isLoaded,
  };
}

