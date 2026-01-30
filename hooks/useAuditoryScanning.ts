import { useState, useEffect, useCallback, useRef } from 'react';
import meSpeak from 'mespeak';

// Module-level promise to prevent concurrent initialization
let initPromise: Promise<void> | null = null;

export interface UseAuditoryScanningProps {
  enabled: boolean;
  audioDeviceId: string | null;
  scanSpeed: number; // Used to adapt TTS rate
}

export interface UseAuditoryScanningReturn {
  playItem: (text: string) => void;
  playMessage: (message: string) => Promise<void>;
  addToCache: (items: string[]) => void;
  availableDevices: MediaDeviceInfo[];
  requestAudioDeviceAccess: () => Promise<void>;
  applySinkIdWithGesture: (deviceId: string | null) => void;
  sinkStatus: {
    route: 'context' | 'element' | 'unsupported' | 'error';
    targetSinkId: string;
    error?: string;
  } | null;
  setAudioDeviceId: (deviceId: string) => void;
  isReady: boolean;
}

export function useAuditoryScanning({
  enabled,
  audioDeviceId,
  scanSpeed,
}: UseAuditoryScanningProps): UseAuditoryScanningReturn {
  const [isReady, setIsReady] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  // Audio Context and Destination
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const useMediaElementRoutingRef = useRef<boolean>(false);
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const requestQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const [sinkStatus, setSinkStatus] = useState<{
    route: 'context' | 'element' | 'unsupported' | 'error';
    targetSinkId: string;
    error?: string;
  } | null>(null);

  const getOutputNode = useCallback((): AudioNode | null => {
    const ctx = audioContextRef.current;
    if (!ctx) return null;
    if (useMediaElementRoutingRef.current && mediaDestinationRef.current) {
      mediaElementRef.current?.play().catch(() => {
        // Autoplay may be blocked until a user gesture.
      });
      return mediaDestinationRef.current;
    }
    return ctx.destination;
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === 'audiooutput');
      setAvailableDevices(outputs);
    } catch (e) {
      console.warn('Unable to enumerate audio devices:', e);
    }
  }, []);

  const requestAudioDeviceAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await refreshDevices();
    } catch (e) {
      console.warn('Unable to get audio device permission:', e);
    }
  }, [refreshDevices]);

  const applySinkId = useCallback(async (deviceId: string | null) => {
    const targetSink = deviceId || 'default';
    const ctx = audioContextRef.current as AudioContext & {
      setSinkId?: (sinkId: string) => Promise<void>;
    };
    const mediaElement = mediaElementRef.current;
    const elementWithSink = mediaElement as (HTMLMediaElement & {
      setSinkId?: (sinkId: string) => Promise<void>;
    }) | null;

    const tryAudioContextSink = async () => {
      if (ctx && typeof ctx.setSinkId === 'function') {
        await ctx.setSinkId(targetSink);
        useMediaElementRoutingRef.current = false;
        setSinkStatus({ route: 'context', targetSinkId: targetSink });
        return true;
      }
      return false;
    };

    const tryMediaElementSink = async () => {
      if (elementWithSink && typeof elementWithSink.setSinkId === 'function') {
        try {
          await elementWithSink.setSinkId(targetSink);
          useMediaElementRoutingRef.current = true;
          mediaElement?.play().catch(() => {
            // Autoplay may be blocked; audio will resume on user gesture.
          });
          setSinkStatus({ route: 'element', targetSinkId: targetSink });
          return true;
        } catch (err) {
          // Device not found or not available, just log and continue
          const errorMsg = (err as Error).message || String(err);
          if (!errorMsg.includes('not found')) {
            console.info('Audio sink device not available:', errorMsg);
          }
          return false;
        }
      }
      return false;
    };

    try {
      if (await tryAudioContextSink()) return;
      if (await tryMediaElementSink()) return;
      useMediaElementRoutingRef.current = false;
      setSinkStatus({ route: 'unsupported', targetSinkId: targetSink });
    } catch (err) {
      // Only log unexpected errors, not "device not found" which is expected
      const errorMsg = (err as Error).message || String(err);
      if (!errorMsg.includes('not found')) {
        console.error('Unexpected error setting sink ID:', err);
      }
      useMediaElementRoutingRef.current = false;
      setSinkStatus({
        route: 'error',
        targetSinkId: targetSink,
        error: errorMsg,
      });
    }
  }, []);

  const applySinkIdWithGesture = useCallback((deviceId: string | null) => {
    void applySinkId(deviceId);
  }, [applySinkId]);

  // Initialize AudioContext and load meSpeak
  useEffect(() => {
    // Initialize AudioContext
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Route audio through a media element so we can set sinkId when supported.
      const mediaElement = new Audio();
      mediaElement.autoplay = true;
      const mediaDestination = ctx.createMediaStreamDestination();
      mediaElement.srcObject = mediaDestination.stream;
      mediaElementRef.current = mediaElement;
      mediaDestinationRef.current = mediaDestination;
    }

    // Load meSpeak config
    const loadMeSpeak = () => {
      if (meSpeak.isConfigLoaded() && meSpeak.isVoiceLoaded('en-us')) {
        setIsReady(true);
        return;
      }

      if (initPromise) {
        return;
      }

      const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;

      initPromise = (async () => {
        try {
          if (!meSpeak.isConfigLoaded()) {
            const configRes = await fetch(`${baseUrl}mespeak/mespeak_config.json`);
            if (!configRes.ok) {
              throw new Error(`Config request failed: ${configRes.status}`);
            }
            const configJson = await configRes.json();
            meSpeak.loadConfig(configJson);
          }

          if (!meSpeak.isVoiceLoaded('en-us')) {
            const voiceRes = await fetch(`${baseUrl}mespeak/voices/en/en-us.json`);
            if (!voiceRes.ok) {
              throw new Error(`Voice request failed: ${voiceRes.status}`);
            }
            const voiceJson = await voiceRes.json();
            meSpeak.loadVoice(voiceJson);
          }

          setIsReady(true);
        } catch (error) {
          console.error('❌ Failed to initialize meSpeak:', error);
          setIsReady(true); // Set ready anyway to not block app
          throw error;
        }
      })();

      initPromise.finally(() => {
        initPromise = null;
      });
    };

    loadMeSpeak();
    refreshDevices();
    navigator.mediaDevices.ondevicechange = refreshDevices;

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [refreshDevices]);

  // Update Sink ID (Output Device)
  useEffect(() => {
    void applySinkId(audioDeviceId);
  }, [audioDeviceId, applySinkId]);

  // Calculate TTS rate based on scanSpeed and text length
  const calculateRate = useCallback(
    (text: string): number => {
      // Estimate word count (split by spaces/punctuation)
      const words = text.trim().split(/[\s,.-]+/).filter((w) => w.length > 0).length;
      if (words === 0) return 175; // Default

      // Target duration: slightly less than scan speed to finish before next item
      // Safety factor 0.8
      const targetDurationMs = scanSpeed * 0.8;
      const targetDurationMin = targetDurationMs / 60000; // minutes

      // WPM = words / minutes
      let targetWPM = words / targetDurationMin;

      // Clamp limits
      // Minimum 150 (normal-ish), Max 450 (very fast but intelligible)
      targetWPM = Math.max(150, Math.min(targetWPM, 450));

      return Math.round(targetWPM);
    },
    [scanSpeed]
  );

  const generateAudioBuffer = useCallback(
    async (text: string): Promise<AudioBuffer | null> => {
      if (!text || !isReady || !audioContextRef.current) return null;

      const rate = calculateRate(text);

      // Normalize text for cache key, include rate
      const cacheKey = `${text}:${rate}`;
      if (audioCacheRef.current.has(cacheKey)) {
        return audioCacheRef.current.get(cacheKey)!;
      }

      try {
        // meSpeak.speak with rawdata: true returns an ArrayBuffer (WAV)
        // Pass speed option
        const wavData = meSpeak.speak(text, { rawdata: 'array', speed: rate });

        if (!wavData) {
          return null;
        }

        let arrayBuffer: ArrayBuffer | null = null;
        if (wavData instanceof ArrayBuffer) {
          arrayBuffer = wavData;
        } else if (
          typeof SharedArrayBuffer !== 'undefined' &&
          wavData instanceof SharedArrayBuffer
        ) {
          const view = new Uint8Array(wavData);
          const copy = new Uint8Array(view.length);
          copy.set(view);
          arrayBuffer = copy.buffer as ArrayBuffer;
        } else if (wavData instanceof Uint8Array) {
          const copy = new Uint8Array(wavData.length);
          copy.set(wavData);
          arrayBuffer = copy.buffer as ArrayBuffer;
        } else if (Array.isArray(wavData)) {
          arrayBuffer = Uint8Array.from(wavData).buffer as ArrayBuffer;
        }

        if (!arrayBuffer) {
          return null;
        }

        // Decode the WAV data into an AudioBuffer
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

        audioCacheRef.current.set(cacheKey, audioBuffer);
        return audioBuffer;
      } catch (e) {
        console.error('Error generating audio for:', text, e);
        return null;
      }
    },
    [isReady, calculateRate]
  );

  // Queue Processing Loop
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || requestQueueRef.current.length === 0 || !isReady) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      // Process one item
      const item = requestQueueRef.current.shift();
      if (item) {
        // Check cache with calculated rate (must be same rate as generation)
        // Since addToCache adds simple text, we need to use current scanSpeed
        // But what if speed changes between add and process?
        // It's acceptable to use current speed.
        const rate = calculateRate(item);
        const cacheKey = `${item}:${rate}`;
        if (!audioCacheRef.current.has(cacheKey)) {
          await generateAudioBuffer(item);
        }
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
  }, [isReady, generateAudioBuffer, calculateRate]);

  // Pre-generate buffers for a list of items using a queue
  const addToCache = useCallback(
    (items: string[]) => {
      if (!enabled || !isReady) return;

      let newItemsAdded = false;
      for (const item of items) {
        // Check if already queued or cached (with current speed)
        const rate = calculateRate(item);
        const cacheKey = `${item}:${rate}`;

        if (!audioCacheRef.current.has(cacheKey) && !requestQueueRef.current.includes(item)) {
          requestQueueRef.current.push(item);
          newItemsAdded = true;
        }
      }

      if (newItemsAdded) {
        processQueue();
      }
    },
    [enabled, isReady, processQueue, calculateRate]
  );

  const playAudioBuffer = useCallback(
    (buffer: AudioBuffer) => {
      if (!audioContextRef.current) return;

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch {
          // ignore
        }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      const outputNode = getOutputNode();
      if (!outputNode) return;
      source.connect(outputNode);
      source.start(0);
      currentSourceRef.current = source;

      source.onended = () => {
        if (currentSourceRef.current === source) {
          currentSourceRef.current = null;
        }
      };
    },
    [getOutputNode]
  );

  const playMessageEarcon = useCallback(
    async (variant: 'start' | 'end' = 'start'): Promise<void> => {
      if (!audioContextRef.current) return;

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      const outputNode = getOutputNode();
      if (!outputNode) return;
      gain.connect(outputNode);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      if (variant === 'start') {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.linearRampToValueAtTime(990, now + 0.1);
      } else {
        osc.frequency.setValueAtTime(990, now);
        osc.frequency.linearRampToValueAtTime(660, now + 0.1);
      }
      osc.connect(gain);

      return new Promise((resolve) => {
        osc.onended = () => resolve();
        osc.start(now);
        osc.stop(now + 0.15);
      });
    },
    [getOutputNode]
  );

  const playItem = useCallback(
    async (text: string) => {
      if (!enabled || !text) return;
      if (!isReady) return;

      const rate = calculateRate(text);
      const cacheKey = `${text}:${rate}`;
      let buffer = audioCacheRef.current.get(cacheKey);

      // If not in cache, force generation immediately
      if (!buffer) {
        console.log(`🔄 Generating audio for: "${text}" at rate ${rate} (Scan: ${scanSpeed}ms)`);
        const queueIndex = requestQueueRef.current.indexOf(text);
        if (queueIndex > -1) {
          requestQueueRef.current.splice(queueIndex, 1);
        }
        buffer = await generateAudioBuffer(text);
      }

      if (buffer) {
        playAudioBuffer(buffer);
      }
    },
    [enabled, isReady, generateAudioBuffer, playAudioBuffer, calculateRate, scanSpeed]
  );

  const playMessage = useCallback(
    async (message: string): Promise<void> => {
      if (!enabled || !message) return;

      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch {
          /* ignore */
        }
      }

      await playMessageEarcon('start');

      const parts: string[] = [];
      const isSpaceLast = message.endsWith(' ');
      const words = message.trim().split(/\s+/);

      if (message.trim().length === 0) return;

      if (isSpaceLast) {
        parts.push(...words);
      } else {
        const lastWord = words.pop() || '';
        parts.push(...words);
        parts.push(...lastWord.split(''));
      }

      return new Promise<void>((resolve) => {
        const playSequence = async (index: number) => {
          if (index >= parts.length) {
            await playMessageEarcon('end');
            resolve();
            return;
          }

          const text = parts[index];
          // Use default rate for message playback (175) to be consistent
          // We can't rely on generateAudioBuffer's dynamic rate here because
          // calculateRate uses scanSpeed, which might be very fast.
          // Message playback should be intelligible at standard speed.

          // However, to keep it simple and reuse the generator (which is bound to rate),
          // we might just accept the current rate.
          // Or we can manually call mespeak if we want fixed rate, but that bypasses our buffer logic.

          // Let's assume for now that message playback using the adaptive rate is acceptable/better
          // if the user has high scan speed, they probably process audio fast too.
          // If not, we can refactor calculateRate to take an optional 'forceRate' param.

          // For now, reuse standard generation:
          let buffer = await generateAudioBuffer(text);

          if (buffer && audioContextRef.current) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            const outputNode = getOutputNode();
            if (!outputNode) {
              playSequence(index + 1);
              return;
            }
            source.connect(outputNode);
            source.start(0);
            currentSourceRef.current = source;

            source.onended = () => {
              playSequence(index + 1);
            };
          } else {
            playSequence(index + 1);
          }
        };

        playSequence(0);
      });
    },
    [enabled, generateAudioBuffer, getOutputNode, playMessageEarcon]
  );

  return {
    playItem,
    playMessage,
    addToCache,
    availableDevices,
    requestAudioDeviceAccess,
    applySinkIdWithGesture,
    sinkStatus,
    setAudioDeviceId: () => {},
    isReady,
  };
}
