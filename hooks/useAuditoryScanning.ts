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
  const requestQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

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
          const baseUrl = import.meta.env.BASE_URL.endsWith('/')
            ? import.meta.env.BASE_URL
            : `${import.meta.env.BASE_URL}/`;
          meSpeak.loadConfig(`${baseUrl}mespeak/mespeak_config.json`);
          meSpeak.loadVoice(`${baseUrl}mespeak/voices/en/en-us.json`);
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

      // Strict check for ArrayBuffer to avoid decoding errors
      if (!wavData || !(wavData instanceof ArrayBuffer)) {
        return null;
      }

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

  // Queue Processing Loop
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || requestQueueRef.current.length === 0 || !isReady) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      // Process one item
      const item = requestQueueRef.current.shift();
      if (item && !audioCacheRef.current.has(item)) {
        await generateAudioBuffer(item);
      }
    } catch (err) {
      console.warn('Queue processing error:', err);
    } finally {
      // Continue processing after a delay to yield to main thread
      isProcessingQueueRef.current = false;
      if (requestQueueRef.current.length > 0) {
        setTimeout(processQueue, 50);
      }
    }
  }, [isReady, generateAudioBuffer]);

  // Pre-generate buffers for a list of items using a queue
  const addToCache = useCallback((items: string[]) => {
    if (!enabled || !isReady) return;

    // Add items to queue if not already cached and not already in queue
    let newItemsAdded = false;
    // Prioritize first 5 items, then queue the rest?
    // For now, just queue them all. The scanner moves slower than 50ms usually.
    for (const item of items) {
      if (!audioCacheRef.current.has(item) && !requestQueueRef.current.includes(item)) {
        requestQueueRef.current.push(item);
        newItemsAdded = true;
      }
    }

    if (newItemsAdded) {
      processQueue();
    }
  }, [enabled, isReady, processQueue]);

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

    // If not ready, skip
    if (!isReady) return;

    let buffer = audioCacheRef.current.get(text);

    // If not in cache, force generation immediately (bypass queue for responsiveness)
    if (!buffer) {
        // Remove from queue if it was there to avoid double work
        const queueIndex = requestQueueRef.current.indexOf(text);
        if (queueIndex > -1) {
            requestQueueRef.current.splice(queueIndex, 1);
        }
        buffer = await generateAudioBuffer(text);
    }

    if (buffer) {
        playAudioBuffer(buffer);
    }
  }, [enabled, isReady, generateAudioBuffer, playAudioBuffer]);

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
