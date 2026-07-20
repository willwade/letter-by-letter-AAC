import { useState, useEffect, useCallback, useRef } from 'react';
import { Communicate, listVoices } from '@twn39/edgetts-js';

export interface EdgeVoice {
  ShortName: string;
  Name: string;
  Gender: string;
  Locale: string;
}

export interface UseEdgeTTSProps {
  enabled: boolean;
  audioDeviceId: string | null;
}

export interface EdgeSpeakOptions {
  voice?: string;
  rate?: number; // signed percent, e.g. -10 = "-10%", +20 = "+20%"
  pitch?: number; // signed Hz, e.g. -5 = "-5Hz", +10 = "+10Hz"
}

export interface UseEdgeTTSReturn {
  isReady: boolean;
  availableVoices: EdgeVoice[];
  playItem: (text: string, options?: EdgeSpeakOptions) => void;
  playMessage: (message: string, options?: EdgeSpeakOptions) => Promise<void>;
}

/**
 * Edge TTS hook - synthesizes via Microsoft's free Edge Read-Aloud service.
 *
 * Mirrors the useAuditoryScanning API so callers can swap engines. Routes audio
 * through an AudioContext so setSinkId works (unlike speechSynthesis, which
 * renders directly to the system output and ignores device pickers).
 *
 * Network-dependent: falls back silently if the endpoint is unreachable.
 */
export function useEdgeTTS({ enabled, audioDeviceId }: UseEdgeTTSProps): UseEdgeTTSReturn {
  const [isReady, setIsReady] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<EdgeVoice[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const useMediaElementRoutingRef = useRef<boolean>(false);
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getOutputNode = useCallback((): AudioNode | null => {
    const ctx = audioContextRef.current;
    if (!ctx) return null;
    if (useMediaElementRoutingRef.current && mediaDestinationRef.current) {
      mediaElementRef.current?.play().catch(() => {
        /* autoplay may be blocked until a user gesture */
      });
      return mediaDestinationRef.current;
    }
    return ctx.destination;
  }, []);

  // Initialize AudioContext and apply output-device routing.
  useEffect(() => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const mediaElement = new Audio();
      mediaElement.autoplay = true;
      const mediaDestination = ctx.createMediaStreamDestination();
      mediaElement.srcObject = mediaDestination.stream;
      mediaElementRef.current = mediaElement;
      mediaDestinationRef.current = mediaDestination;
    }
  }, []);

  // Apply sinkId (output device) whenever the setting changes.
  useEffect(() => {
    const targetSink = audioDeviceId || 'default';
    const ctx = audioContextRef.current as (AudioContext & { setSinkId?: (id: string) => Promise<void> }) | null;
    const mediaElement = mediaElementRef.current as (HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> }) | null;

    const tryAudioContextSink = async (): Promise<boolean> => {
      if (ctx && typeof ctx.setSinkId === 'function') {
        try {
          await ctx.setSinkId(targetSink);
          useMediaElementRoutingRef.current = false;
          return true;
        } catch {
          return false;
        }
      }
      return false;
    };

    const tryMediaElementSink = async (): Promise<boolean> => {
      if (mediaElement && typeof mediaElement.setSinkId === 'function') {
        try {
          await mediaElement.setSinkId(targetSink);
          useMediaElementRoutingRef.current = true;
          mediaElement?.play().catch(() => {
            /* autoplay may be blocked */
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    };

    (async () => {
      if (await tryAudioContextSink()) return;
      if (await tryMediaElementSink()) return;
      useMediaElementRoutingRef.current = false;
    })();
  }, [audioDeviceId]);

  // Load voice list. Best-effort: failure just leaves the list empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const voices = await listVoices();
        if (!cancelled && Array.isArray(voices)) {
          setAvailableVoices(voices as EdgeVoice[]);
        }
      } catch (e) {
        console.warn('Edge TTS: failed to load voice list', e);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatRate = (rate?: number) =>
    rate === undefined || rate === 0 ? '+0%' : `${rate > 0 ? '+' : ''}${rate}%`;
  const formatPitch = (pitch?: number) =>
    pitch === undefined || pitch === 0 ? '+0Hz' : `${pitch > 0 ? '+' : ''}${pitch}Hz`;

  // Synthesize text to an AudioBuffer. Cached by (text, voice, rate, pitch).
  const synthesize = useCallback(
    async (text: string, options?: EdgeSpeakOptions): Promise<AudioBuffer | null> => {
      if (!text || !audioContextRef.current) return null;
      const voice = options?.voice || 'en-US-EmmaMultilingualNeural';
      const rate = formatRate(options?.rate);
      const pitch = formatPitch(options?.pitch);
      const cacheKey = `${text}|${voice}|${rate}|${pitch}`;
      const cached = audioCacheRef.current.get(cacheKey);
      if (cached) return cached;

      try {
        const communicate = new Communicate(text, { voice, rate, pitch });
        const chunks: Uint8Array[] = [];
        for await (const chunk of communicate.stream()) {
          if (chunk.type === 'audio') {
            chunks.push(chunk.data);
          }
        }
        if (chunks.length === 0) return null;

        // Concatenate mp3 chunks and decode
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        const arrayBuffer = merged.buffer.slice(merged.byteOffset, merged.byteOffset + merged.byteLength);
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioCacheRef.current.set(cacheKey, audioBuffer);
        return audioBuffer;
      } catch (e) {
        console.error('Edge TTS: synthesis failed for', text, e);
        return null;
      }
    },
    []
  );

  const playAudioBuffer = useCallback(
    (buffer: AudioBuffer) => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const outputNode = getOutputNode();
      if (!outputNode) return;
      source.connect(outputNode);
      source.start(0);
      currentSourceRef.current = source;
    },
    [getOutputNode]
  );

  // Fire-and-forget playback for cues.
  const playItem = useCallback(
    (text: string, options?: EdgeSpeakOptions) => {
      if (!enabled || !text) return;
      void synthesize(text, options).then((buffer) => {
        if (buffer) playAudioBuffer(buffer);
      });
    },
    [enabled, synthesize, playAudioBuffer]
  );

  // Sequential playback for the message bar. Splits like useAuditoryScanning so
  // a finished word stays intelligible when the user types a partial word.
  const playMessage = useCallback(
    async (message: string, options?: EdgeSpeakOptions): Promise<void> => {
      if (!enabled || !message) return;

      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch {
          /* ignore */
        }
      }

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

      for (const part of parts) {
        const buffer = await synthesize(part, options);
        if (!buffer) continue;
        await new Promise<void>((resolve) => {
          const ctx = audioContextRef.current;
          if (!ctx) {
            resolve();
            return;
          }
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const outputNode = getOutputNode();
          if (!outputNode) {
            resolve();
            return;
          }
          source.connect(outputNode);
          source.onended = () => resolve();
          source.start(0);
          currentSourceRef.current = source;
        });
      }
    },
    [enabled, synthesize, getOutputNode]
  );

  return {
    isReady,
    availableVoices,
    playItem,
    playMessage,
  };
}
