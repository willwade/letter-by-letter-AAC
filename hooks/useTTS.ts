import { useState, useEffect, useCallback } from 'react';

export interface UseTTSProps {
  selectedLanguage: string;
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string) => void;
}

export interface UseTTSReturn {
  availableVoices: SpeechSynthesisVoice[];
  speak: (text: string) => void;
  isSupported: boolean;
}

/**
 * Custom hook for managing Text-to-Speech (TTS) functionality
 * Handles voice loading, language filtering, and speech synthesis
 */
export function useTTS({
  selectedLanguage,
  selectedVoiceURI,
  setSelectedVoiceURI,
}: UseTTSProps): UseTTSReturn {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = 'speechSynthesis' in window;

  // Effect to load speech synthesis voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Filter voices by selected language
        // Match voices where lang starts with the selected language code
        const filteredVoices = allVoices.filter((voice) =>
          voice.lang.toLowerCase().startsWith(selectedLanguage.toLowerCase())
        );

        // If no voices match the selected language, show all voices as fallback
        const voicesToShow = filteredVoices.length > 0 ? filteredVoices : allVoices;
        setAvailableVoices(voicesToShow);

        // Auto-select a voice for the current language if needed
        if (!selectedVoiceURI || !voicesToShow.find((v) => v.voiceURI === selectedVoiceURI)) {
          // Prefer local voices for the selected language
          const defaultVoice = voicesToShow.find((voice) => voice.localService) || voicesToShow[0];
          if (defaultVoice) {
            setSelectedVoiceURI(defaultVoice.voiceURI);
          }
        }
      }
    };

    // Voices load asynchronously, so we need to listen for the voiceschanged event.
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial call in case they are already loaded

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedLanguage, selectedVoiceURI, setSelectedVoiceURI, isSupported]);

  // Speak function with voice selection
  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, availableVoices, selectedVoiceURI]
  );

  return {
    availableVoices,
    speak,
    isSupported,
  };
}

