import { useState, useEffect, useCallback, useRef } from 'react';
import meSpeak from 'mespeak';

export interface UseAuditoryScanningProps {
  enabled: boolean;
  audioDeviceId: string | null;
}

export interface UseAuditoryScanningReturn {
  playItem: (text: string) => void;
  playMessage: (message: string) => void;
  addToCache: (items: string[]) => void;
  availableDevices: MediaDeviceInfo[];
  setAudioDeviceId: (deviceId: string) => void;
  isReady: boolean;
}

export function useAuditoryScanning({
  enabled,
  audioDeviceId,
}: UseAuditoryScanningProps): UseAuditoryScanningReturn {
  const [isReady, setIsReady] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  // Audio Context and Destination
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext and load meSpeak
  useEffect(() => {
    // Initialize AudioContext
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }

    // Load meSpeak config
    const loadMeSpeak = async () => {
      try {
        if (!meSpeak.isConfigLoaded()) {
          meSpeak.loadConfig('/mespeak/mespeak_config.json');
          meSpeak.loadVoice('/mespeak/voices/en/en-us.json');
          setIsReady(true);
        } else {
            setIsReady(true);
        }
      } catch (e) {
        console.error('Failed to load meSpeak:', e);
      }
    };

    loadMeSpeak();

    // Enumerate devices
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === 'audiooutput');
        setAvailableDevices(outputs);
      } catch (e) {
        console.warn('Unable to enumerate audio devices:', e);
      }
    };

    // Only request permission/enumerate if we can (requires interaction usually, but we check what's available)
    getDevices();

    // Listen for device changes
    navigator.mediaDevices.ondevicechange = getDevices;

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, []);

  // Update Sink ID (Output Device)
  useEffect(() => {
    if (audioContextRef.current && audioDeviceId) {
        // TypeScript might complain about setSinkId if not typed, as it's experimental/new
        // We cast to any to avoid type errors for now or check existence
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = audioContextRef.current as any;
        if (typeof ctx.setSinkId === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ctx.setSinkId(audioDeviceId).catch((err: any) =>
                console.error('Failed to set sink ID:', err)
            );
        }
    }
  }, [audioDeviceId]);

  const generateAudioBuffer = useCallback(async (text: string): Promise<AudioBuffer | null> => {
    if (!text || !isReady || !audioContextRef.current) return null;

    // Normalize text for cache key
    const cacheKey = text;
    if (audioCacheRef.current.has(cacheKey)) {
      return audioCacheRef.current.get(cacheKey)!;
    }

    try {
      // meSpeak.speak with rawdata: true returns an ArrayBuffer (WAV)
      // We need to ensure we pass a string.
      const wavData = meSpeak.speak(text, { rawdata: 'array' });

      if (!wavData) return null;

      // Decode the WAV data into an AudioBuffer
      // decodeAudioData requires a copy of the buffer in some browsers if it detaches it?
      // safe to just pass it.
      const audioBuffer = await audioContextRef.current.decodeAudioData(wavData as ArrayBuffer);

      audioCacheRef.current.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.error('Error generating audio for:', text, e);
      return null;
    }
  }, [isReady]);

  // Pre-generate buffers for a list of items
  const addToCache = useCallback((items: string[]) => {
    if (!enabled || !isReady) return;

    // Process strictly sequentially or in small chunks to avoid blocking main thread too much?
    // meSpeak is sync, so it WILL block.
    // We should use a timeout loop to yield back to main thread.

    let index = 0;
    const processNext = async () => {
        if (index >= items.length) return;

        const item = items[index];
        // Only generate if not already cached
        if (!audioCacheRef.current.has(item)) {
             // We call generateAudioBuffer but we know the sync part (meSpeak) happens inside.
             // Wait, if generateAudioBuffer calls meSpeak.speak() synchronously,
             // we need to wrap that call in a setTimeout to let UI render.
             await new Promise<void>(resolve => setTimeout(async () => {
                 await generateAudioBuffer(item);
                 resolve();
             }, 10)); // Small delay between items
        }

        index++;
        processNext();
    };

    processNext();

  }, [enabled, isReady, generateAudioBuffer]);

  const playAudioBuffer = useCallback((buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;

    // Stop previous source if playing
    if (currentSourceRef.current) {
        try {
            currentSourceRef.current.stop();
        } catch {
            // ignore if already stopped
        }
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);
    currentSourceRef.current = source;

    source.onended = () => {
        if (currentSourceRef.current === source) {
            currentSourceRef.current = null;
        }
    };
  }, []);

  const playItem = useCallback(async (text: string) => {
    if (!enabled || !text) return;

    let buffer = audioCacheRef.current.get(text);
    if (!buffer) {
        buffer = await generateAudioBuffer(text);
    }

    if (buffer) {
        playAudioBuffer(buffer);
    }
  }, [enabled, generateAudioBuffer, playAudioBuffer]);

  const playMessage = useCallback(async (message: string) => {
      // This will handle the sequence playing logic
      // We need to implement the parsing logic here or helper
      // and play them in sequence.

      // For now, let's just implement a simple queue player?
      // Or we can rely on onended chaining.

      // Let's defer the message parsing logic to the integration step
      // or implement it right now as requested in the plan.
      // But the hook return signature asks for 'playMessage'.

      if (!enabled || !message) return;

      // Stop current scanning audio
      if (currentSourceRef.current) {
          try { currentSourceRef.current.stop(); } catch { /* ignore */ }
      }

      // Parse message
      const parts: string[] = [];
      const isSpaceLast = message.endsWith(' ');
      const words = message.trim().split(/\s+/);

      if (message.trim().length === 0) return;

      if (isSpaceLast) {
          // "Hello World " -> "Hello", "World"
          parts.push(...words);
      } else {
          // "Hello Worl" -> "Hello", "W", "o", "r", "l"
          const lastWord = words.pop() || '';
          parts.push(...words);
          parts.push(...lastWord.split(''));
      }

      // Generate all needed buffers first (or play as we go?)
      // Better to play sequence.

      const playSequence = async (index: number) => {
          if (index >= parts.length) return;

          const text = parts[index];
          let buffer = audioCacheRef.current?.get(text);
          if (!buffer) {
              buffer = await generateAudioBuffer(text);
          }

          if (buffer && audioContextRef.current) {
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.start(0);
              // Store it so we can stop it if needed?
              // Actually for message reading, we might want to let it finish or be interruptible?
              // The user said "equally read out in the auditory scanning voice".
              // Usually feedback is interruptible.
              currentSourceRef.current = source;

              source.onended = () => {
                  playSequence(index + 1);
              };
          } else {
              // Skip if failed
              playSequence(index + 1);
          }
      };

      playSequence(0);

  }, [enabled, generateAudioBuffer]);

  return {
    playItem,
    playMessage,
    addToCache,
    availableDevices,
    setAudioDeviceId: () => {}, // Handled by prop, but we can expose a setter if we move state inside
    isReady
  };
}
