import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ALPHABET } from './constants';
import Display from './components/Display';
import Scanner from './components/Scanner';
import Controls from './components/Controls';
import { getUppercase, getLowercase, getScripts, getIndexData } from 'worldalphabets';
import { getTheme } from './themes';
import confetti from 'canvas-confetti';
import { resolveFontFamily } from './utils/fontMapping';
import { useSettings } from './hooks/useSettings';
import { usePrediction } from './hooks/usePrediction';
import { useScanning } from './hooks/useScanning';
import { useKeyboard } from './hooks/useKeyboard';

const App: React.FC = () => {
  // MIGRATION: Use settings hook (gradually migrating settings here)
  const settings = useSettings();

  // Extract selectedLanguage to prevent infinite loops in useEffect dependencies
  const { selectedLanguage } = settings;

  const [message, setMessage] = useState<string>('');

  // Initialize with correct case based on localStorage setting
  const initialUseUppercase = localStorage.getItem('useUppercase') === 'true';
  const initialAlphabet = initialUseUppercase ? ALPHABET : ALPHABET.map((l) => l.toLowerCase());

  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Language and alphabet state (complex dependencies, not fully migrated)
  const [alphabet, setAlphabet] = useState<string[]>(initialAlphabet);

  // STEP 1: We need predictions first, but predictions need scanItems
  // So we'll use a temporary scanItems state that gets updated by useScanning
  const [tempScanItems, setTempScanItems] = useState<string[]>([...initialAlphabet]);

  // Use prediction hook (needs scanItems for keyboard adjacency map)
  const {
    predictor,
    predictedLetters,
    predictedWords,
    trainingStatus,
    learnedWordsCount,
    setLearnedWordsCount,
    handleFileUpload,
    handleExportLearnedData,
    handleClearLearnedData,
  } = usePrediction({
    message,
    alphabet,
    selectedLanguage: settings.selectedLanguage,
    enablePrediction: settings.enablePrediction,
    showWordPrediction: settings.showWordPrediction,
    useUppercase: settings.useUppercase,
    scanItems: tempScanItems,
  });
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  const [languageNames, setLanguageNames] = useState<Record<string, string>>({});
  const [isRTL, setIsRTL] = useState<boolean>(false);

  // Get theme from settings
  const theme = getTheme(settings.themeName);

  // Resolved font family - automatically selects the correct Playpen Sans variant
  // based on the current language and script
  const resolvedFontFamily = useMemo(() => {
    return resolveFontFamily(
      settings.fontFamily,
      settings.selectedLanguage,
      settings.selectedScript
    );
  }, [settings.fontFamily, settings.selectedLanguage, settings.selectedScript]);

  // Hold progress indicator state
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0-100 percentage
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdZone, setHoldZone] = useState<'none' | 'green' | 'red'>('none'); // Which zone we're in (for UI)
  // MIGRATION: holdZoneRef and holdProgressIntervalRef now in useKeyboard hook!

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
  }>({ click: null, select: null });

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
      const [clickBuffer, selectBuffer] = await Promise.all([
        loadAudio('/letter-by-letter-AAC/click.mp3'),
        loadAudio('/letter-by-letter-AAC/click-select.mp3'),
      ]);

      setAudioBuffers({
        click: clickBuffer,
        select: selectBuffer,
      });
    };

    loadAllAudio();
  }, [audioContext]);

  // Helper function to play audio with Web Audio API (ultra-fast, no lag)
  const playSound = useCallback(
    (type: 'click' | 'select') => {
      if (!settings.audioEffectsEnabled || !audioContext || !audioBuffers[type]) return;

      // Create a new buffer source (very lightweight)
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffers[type];

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.3; // Reduce volume to 30%

      // Connect: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play immediately
      source.start(0);
    },
    [settings.audioEffectsEnabled, audioContext, audioBuffers]
  );

  // Use scanning hook (needs predictions to build scan items AND playSound)
  const { scanIndex, scanItems, isScanning, setIsScanning, setScanIndex } = useScanning({
    alphabet,
    message,
    predictedLetters,
    predictedWords,
    enablePrediction: settings.enablePrediction,
    predictor,
    showWordPrediction: settings.showWordPrediction,
    speakAfterPredictions: settings.speakAfterPredictions,
    gameMode: settings.gameMode,
    currentGameTarget: settings.gameWordList[settings.currentGameWordIndex] || '',
    scanMode: settings.scanMode,
    scanSpeed: settings.scanSpeed,
    firstItemDelay: settings.firstItemDelay,
    showSettingsModal,
    playSound,
  });

  // Update temp scan items when scanning hook updates them
  useEffect(() => {
    setTempScanItems(scanItems);
  }, [scanItems]);

  // Effect to load available languages and their names on startup
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        // Get language index data from WorldAlphabets
        const indexData = await getIndexData();

        // Extract language codes and names
        // Note: indexData has 'language' field for code and 'name' field for display name
        const codesSet = new Set<string>();
        const names: Record<string, string> = {};

        for (const entry of indexData) {
          if (entry.language) {
            codesSet.add(entry.language);
            if (entry.name && !names[entry.language]) {
              // Use first name encountered for each language code
              names[entry.language] = entry.name;
            }
          }
        }

        const codes = Array.from(codesSet).sort();
        setAvailableLanguages(codes);
        setLanguageNames(names);
        console.log(`Loaded ${codes.length} languages from WorldAlphabets index`);
      } catch (error) {
        console.error('Failed to load available languages:', error);
        setAvailableLanguages(['en']); // Fallback to English
        setLanguageNames({ en: 'English' });
      }
    };
    loadLanguages();
  }, []);

  // Effect to load available scripts when language changes
  useEffect(() => {
    const loadScripts = async () => {
      try {
        const scripts = await getScripts(selectedLanguage);
        setAvailableScripts(scripts);
        // If current script is not available for new language, reset to first available or null
        if (scripts.length > 0 && !scripts.includes(settings.selectedScript || '')) {
          settings.setSelectedScript(scripts[0]);
        } else if (scripts.length === 0) {
          settings.setSelectedScript(null);
        }

        // Detect RTL scripts
        // Common RTL scripts: Arab (Arabic), Hebr (Hebrew), Thaa (Thaana), Nkoo (N'Ko), Syrc (Syriac)
        const rtlScripts = ['Arab', 'Hebr', 'Thaa', 'Nkoo', 'Syrc', 'Mand', 'Samr', 'Adlm'];
        const currentScript = scripts.length > 0 ? scripts[0] : null;
        const isRightToLeft = currentScript ? rtlScripts.includes(currentScript) : false;
        setIsRTL(isRightToLeft);

        console.log(
          `Language: ${selectedLanguage}, Script: ${currentScript}, RTL: ${isRightToLeft}`
        );
      } catch (error) {
        console.error('Failed to load scripts for language:', selectedLanguage, error);
        setAvailableScripts([]);
        settings.setSelectedScript(null);
        setIsRTL(false);
      }
    };

    loadScripts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  // Effect to update alphabet when language, script, or case changes
  useEffect(() => {
    const loadAlphabet = async () => {
      try {
        let letters: string[];
        if (settings.useUppercase) {
          letters = await getUppercase(
            settings.selectedLanguage,
            settings.selectedScript || undefined
          );
          console.log(
            `Loaded uppercase alphabet for ${settings.selectedLanguage}:`,
            letters.slice(0, 5)
          );
        } else {
          letters = await getLowercase(
            settings.selectedLanguage,
            settings.selectedScript || undefined
          );
          console.log(
            `Loaded lowercase alphabet for ${settings.selectedLanguage}:`,
            letters.slice(0, 5)
          );
        }
        setAlphabet(letters);
        // MIGRATION: Scan items will be rebuilt automatically by useScanning hook
        console.log(
          '✅ Alphabet set to:',
          letters.slice(0, 10),
          '(useUppercase:',
          settings.useUppercase,
          ')'
        );
      } catch (error) {
        console.error('Failed to load alphabet:', error);
        // Fallback to default English alphabet
        const fallbackAlphabet = settings.useUppercase
          ? ALPHABET
          : ALPHABET.map((l) => l.toLowerCase());
        setAlphabet(fallbackAlphabet);
        // MIGRATION: Scan items will be rebuilt automatically by useScanning hook
      }
    };
    loadAlphabet();
  }, [settings.selectedLanguage, settings.selectedScript, settings.useUppercase]);

  // MIGRATION: Language preferences localStorage persistence now handled by useSettings hook!

  // MIGRATION COMPLETE: All settings persistence now handled by useSettings hook!

  // Debug: Log when holdZone changes
  useEffect(() => {
    console.log(`🎨 holdZone changed to: ${holdZone}`);
  }, [holdZone]);

  // Compute current game target word
  const currentGameTarget =
    settings.gameMode && settings.gameWordList.length > 0
      ? settings.gameWordList[settings.currentGameWordIndex % settings.gameWordList.length]
      : '';

  // MIGRATION: Scan items building logic now handled by useScanning hook!

  // Effect to load speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Filter voices by selected language
        // Match voices where lang starts with the selected language code
        const filteredVoices = allVoices.filter((voice) =>
          voice.lang.toLowerCase().startsWith(settings.selectedLanguage.toLowerCase())
        );

        // If no voices match the selected language, show all voices as fallback
        const voicesToShow = filteredVoices.length > 0 ? filteredVoices : allVoices;
        setAvailableVoices(voicesToShow);

        // Auto-select a voice for the current language if needed
        if (
          !settings.selectedVoiceURI ||
          !voicesToShow.find((v) => v.voiceURI === settings.selectedVoiceURI)
        ) {
          // Prefer local voices for the selected language
          const defaultVoice = voicesToShow.find((voice) => voice.localService) || voicesToShow[0];
          if (defaultVoice) {
            settings.setSelectedVoiceURI(defaultVoice.voiceURI);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.selectedLanguage]);

  const handleSelect = useCallback(
    (item: string) => {
      // Play select sound
      playSound('select');

      // Game Mode: handle letter selection and word completion
      if (settings.gameMode && currentGameTarget) {
        if (item === 'SPEAK' && message.length === currentGameTarget.length) {
          // Word completed - speak it and move to next word
          if ('speechSynthesis' in window && message) {
            const utterance = new SpeechSynthesisUtterance(message);
            const selectedVoice = availableVoices.find(
              (v) => v.voiceURI === settings.selectedVoiceURI
            );
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
            window.speechSynthesis.speak(utterance);
          }

          // Move to next word and clear message
          settings.setCurrentGameWordIndex((prev) => (prev + 1) % settings.gameWordList.length);
          setMessage('');
          return;
        } else if (settings.showWordPrediction && predictedWords.includes(item)) {
          // Word prediction selected in game mode
          // Check if the predicted word matches the target (case-insensitive)
          const remainingTarget = currentGameTarget.substring(message.length);

          // Check if the word completes the current target or matches the remaining part
          if (item.toLowerCase() === currentGameTarget.toLowerCase()) {
            // Complete word match - accept it
            setMessage(item);

            // Confetti for correct word
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });

            // Speak the word
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(item);
              const selectedVoice = availableVoices.find(
                (v) => v.voiceURI === settings.selectedVoiceURI
              );
              if (selectedVoice) {
                utterance.voice = selectedVoice;
              }
              window.speechSynthesis.speak(utterance);
            }

            // Move to next word after 1.5 seconds
            setTimeout(() => {
              settings.setCurrentGameWordIndex((prev) => (prev + 1) % settings.gameWordList.length);
              setMessage('');
            }, 1500);
          } else if (remainingTarget.toLowerCase().startsWith(item.toLowerCase())) {
            // Partial word match - accept it as completing part of the target
            const newMessage = message + item; // No space after word prediction
            setMessage(newMessage);

            // Confetti for correct partial word
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
          // Ignore incorrect word predictions
          return;
        } else if (item.length === 1 || item === '_') {
          // Handle both letters and spaces
          const expectedChar = currentGameTarget[message.length];

          if (expectedChar === ' ' && item === '_') {
            // Correct space! Add it to the message
            setMessage((prev) => {
              const newMessage = prev + ' ';
              // Confetti for correct space
              confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.6 },
              });
              return newMessage;
            });
          } else if (
            expectedChar &&
            expectedChar !== ' ' &&
            item.toLowerCase() === expectedChar.toLowerCase()
          ) {
            // Correct letter! Add it to the message
            setMessage((prev) => {
              const newMessage = prev + item;

              // Confetti for correct letter
              confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.6 },
              });

              // Check if word is complete after adding this letter
              if (newMessage.length === currentGameTarget.length) {
                // Word complete! Big confetti and auto-advance after a delay
                setTimeout(() => {
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                  });

                  // Speak the word
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(newMessage);
                    const selectedVoice = availableVoices.find(
                      (v) => v.voiceURI === settings.selectedVoiceURI
                    );
                    if (selectedVoice) {
                      utterance.voice = selectedVoice;
                    }
                    window.speechSynthesis.speak(utterance);
                  }

                  // Move to next word after 1.5 seconds
                  setTimeout(() => {
                    settings.setCurrentGameWordIndex(
                      (prev) => (prev + 1) % settings.gameWordList.length
                    );
                    setMessage('');
                  }, 1500);
                }, 300);
              }

              return newMessage;
            });
          }
          // Ignore incorrect letters/spaces (do nothing)
          return;
        } else if (item === 'UNDO') {
          // Handle UNDO in game mode
          const newMessage = message.slice(0, -1);
          setMessage(newMessage);

          // Update context after undo
          if (predictor) {
            predictor.resetContext();
            if (newMessage) {
              predictor.addToContext(newMessage.toLowerCase());
            }
          }
          return;
        } else if (item === 'CLEAR') {
          // Handle CLEAR in game mode - restart current word
          setMessage('');

          // Reset context when clearing
          if (predictor) {
            predictor.resetContext();
          }
          return;
        }
        // Fall through for other actions like SPEAK (already handled above)
      }

      // Normal mode (non-game)
      if (settings.showWordPrediction && predictedWords.includes(item)) {
        const lastSpaceIndex = message.lastIndexOf(' ');
        const messageBase = lastSpaceIndex === -1 ? '' : message.substring(0, lastSpaceIndex + 1);
        const newMessage = messageBase + item; // No space after word prediction

        console.log('📝 Word prediction selected:', {
          item,
          currentMessage: message,
          lastSpaceIndex,
          messageBase,
          newMessage,
          predictedWords,
        });

        setMessage(newMessage);

        // Train the model on the confirmed word selection
        // In adaptive mode, addToContext() both sets context AND trains the model
        if (predictor) {
          predictor.resetContext();
          predictor.addToContext(newMessage.toLowerCase());

          // Save to session buffer for persistence (no space after word)
          const sessionKey = `ppm-session-${settings.selectedLanguage}`;
          const currentSession = localStorage.getItem(sessionKey) || '';
          localStorage.setItem(sessionKey, currentSession + item);
          setLearnedWordsCount((prev) => prev + 1);
        }
      } else if (item === '_') {
        // Corresponds to SPACE constant
        const newMessage = message + ' ';
        setMessage(newMessage);

        // Train the model on the confirmed space
        if (predictor) {
          predictor.resetContext();
          predictor.addToContext(newMessage.toLowerCase());
        }
      } else if (item === 'UNDO') {
        // Corresponds to UNDO constant
        const newMessage = message.slice(0, -1);
        setMessage(newMessage);

        // Update context after undo
        if (predictor) {
          predictor.resetContext();
          if (newMessage) {
            predictor.addToContext(newMessage.toLowerCase());
          }
        }
      } else if (item === 'CLEAR') {
        // Corresponds to CLEAR constant
        setMessage('');

        // Reset context when clearing
        if (predictor) {
          predictor.resetContext();
        }
      } else if (item === 'SPEAK') {
        // Corresponds to SPEAK constant
        if ('speechSynthesis' in window && message) {
          const utterance = new SpeechSynthesisUtterance(message);
          const selectedVoice = availableVoices.find(
            (v) => v.voiceURI === settings.selectedVoiceURI
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          window.speechSynthesis.speak(utterance);
        } else if (!message) {
          // Do nothing if message is empty
        } else {
          alert('Text-to-speech not supported in this browser.');
        }
      } else {
        // Regular letter selection
        const newMessage = message + item;
        setMessage(newMessage);

        // Train the model on the confirmed letter selection
        if (predictor) {
          predictor.resetContext();
          predictor.addToContext(newMessage.toLowerCase());
        }
      }
      setScanIndex(0);
    },
    [
      message,
      settings,
      predictedWords,
      availableVoices,
      currentGameTarget,
      predictor,
      playSound,
      setLearnedWordsCount,
      setScanIndex,
    ]
  );

  const handleClear = useCallback(() => {
    setMessage('');
    setIsScanning(false);
    setScanIndex(0);
  }, [setIsScanning, setScanIndex]);

  const handleUndo = useCallback(() => {
    setMessage((prev) => prev.slice(0, -1));
    setScanIndex(0);
  }, [setScanIndex]);

  // Execute a hold action (SPEAK, UNDO, CLEAR, or RESTART)
  const executeHoldAction = useCallback(
    (action: string) => {
      console.log(`🎯 Executing hold action: ${action}, message: "${message}"`);
      switch (action) {
        case 'SPEAK':
          if ('speechSynthesis' in window) {
            if (message) {
              console.log('🔊 Speaking message:', message);
              const utterance = new SpeechSynthesisUtterance(message);
              const selectedVoice = availableVoices.find(
                (v) => v.voiceURI === settings.selectedVoiceURI
              );
              if (selectedVoice) {
                utterance.voice = selectedVoice;
              }
              window.speechSynthesis.speak(utterance);
            } else {
              console.log('⚠️ No message to speak');
            }
          } else {
            console.log('⚠️ Speech synthesis not available');
          }
          break;
        case 'UNDO':
          console.log('↩️ Executing UNDO');
          handleUndo();
          break;
        case 'CLEAR':
          console.log('🗑️ Executing CLEAR');
          handleClear();
          break;
        case 'RESTART':
          console.log('🔄 Executing RESTART');
          // Restart scanning from the beginning
          setIsScanning(false);
          setScanIndex(0);
          setTimeout(() => setIsScanning(true), 100);
          break;
      }
    },
    [
      message,
      availableVoices,
      settings.selectedVoiceURI,
      handleUndo,
      handleClear,
      setIsScanning,
      setScanIndex,
    ]
  );

  const handleSwitch1 = useCallback(() => {
    console.log(
      `🔘 handleSwitch1 called - scanMode: ${settings.scanMode}, isScanning: ${isScanning}, scanIndex: ${scanIndex}, currentItem: ${scanItems[scanIndex]}`
    );
    if (settings.scanMode === 'one-switch') {
      if (isScanning) {
        console.log(`✅ Selecting item: ${scanItems[scanIndex]}`);
        handleSelect(scanItems[scanIndex]);
      } else {
        console.log('▶️ Starting scanning');
        setIsScanning(true);
      }
    } else {
      // two-switch
      // Play click sound when advancing in two-switch mode
      playSound('click');
      setScanIndex((prev: number) => (prev + 1) % scanItems.length);
    }
  }, [
    settings.scanMode,
    isScanning,
    scanItems,
    scanIndex,
    handleSelect,
    playSound,
    setIsScanning,
    setScanIndex,
  ]);

  const handleSwitch2 = useCallback(() => {
    if (settings.scanMode === 'two-switch') {
      handleSelect(scanItems[scanIndex]);
    }
  }, [settings.scanMode, scanItems, scanIndex, handleSelect]);

  // MIGRATION: Auto-advance scanning interval now handled by useScanning hook!

  // Use keyboard hook for all keyboard input handling
  useKeyboard({
    switch1Key: 'Space',
    switch2Key: 'Enter',
    onSwitch1: handleSwitch1,
    onSwitch2: handleSwitch2,
    onHoldAction: executeHoldAction,
    scanMode: settings.scanMode,
    holdSpeed: settings.holdSpeed,
    debounceTime: settings.debounceTime,
    disabled: showSettingsModal,
    enableHoldActions: settings.enableHoldActions,
    shortHoldDuration: settings.shortHoldDuration,
    longHoldDuration: settings.longHoldDuration,
    shortHoldAction: settings.shortHoldAction,
    longHoldAction: settings.longHoldAction,
    playSound,
    setIsHolding,
    setHoldProgress,
    setHoldZone,
  });

  // MIGRATION: Keyboard handling now in useKeyboard hook!

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      className="flex flex-col h-screen font-sans"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {/* Settings Cog Icon - Top Right */}
      <button
        onClick={() => setShowSettingsModal(true)}
        className="fixed top-2 right-2 z-50 p-2 rounded-full transition-all hover:scale-110"
        style={{
          backgroundColor: theme.colors.buttonBg,
          color: theme.colors.buttonText,
          opacity: 0.7,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        aria-label="Open Settings"
        title="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      <main className="flex-grow flex flex-col p-2 gap-2 overflow-hidden">
        <Display
          message={message}
          fontSize={settings.messageFontSize}
          isRTL={isRTL}
          theme={theme}
          fontFamily={resolvedFontFamily}
        />
        <div className="relative flex-grow flex flex-col">
          <Scanner
            currentItem={scanItems[scanIndex] ?? ''}
            fontSize={settings.scannerFontSize}
            theme={theme}
            fontFamily={resolvedFontFamily}
            borderWidth={settings.borderWidth}
            predictedLetters={predictedLetters}
            predictedWords={predictedWords}
          />
          {/* Hold Progress Indicator */}
          {isHolding && settings.enableHoldActions && (
            <div
              className="absolute bottom-0 left-0 right-0 h-4 bg-gray-300 border-t-2 border-gray-400"
              style={{ zIndex: 10 }}
            >
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${holdProgress}%`,
                  backgroundColor:
                    holdZone === 'red'
                      ? '#ef4444' // Red for long hold zone
                      : holdZone === 'green'
                        ? '#22c55e' // Green for short hold zone
                        : '#6b7280', // Dark gray before entering any zone
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal - Always rendered so it's accessible even when control bar is hidden */}
      <Controls
        scanMode={settings.scanMode}
        setScanMode={(mode) => {
          settings.setScanMode(mode);
          setIsScanning(false);
          setScanIndex(0);
        }}
        scanSpeed={settings.scanSpeed}
        setScanSpeed={settings.setScanSpeed}
        firstItemDelay={settings.firstItemDelay}
        setFirstItemDelay={settings.setFirstItemDelay}
        holdSpeed={settings.holdSpeed}
        setHoldSpeed={settings.setHoldSpeed}
        debounceTime={settings.debounceTime}
        setDebounceTime={settings.setDebounceTime}
        isScanning={isScanning}
        setIsScanning={setIsScanning}
        onSwitch1={handleSwitch1}
        onSwitch2={handleSwitch2}
        onClear={handleClear}
        onUndo={handleUndo}
        messageFontSize={settings.messageFontSize}
        setMessageFontSize={settings.setMessageFontSize}
        scannerFontSize={settings.scannerFontSize}
        setScannerFontSize={settings.setScannerFontSize}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        enablePrediction={settings.enablePrediction}
        setEnablePrediction={settings.setEnablePrediction}
        showWordPrediction={settings.showWordPrediction}
        setShowWordPrediction={settings.setShowWordPrediction}
        availableVoices={availableVoices}
        selectedVoiceURI={settings.selectedVoiceURI}
        setSelectedVoiceURI={settings.setSelectedVoiceURI}
        onFileUpload={handleFileUpload}
        trainingStatus={trainingStatus}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        hideControlBar={settings.hideControlBar}
        setHideControlBar={settings.setHideControlBar}
        selectedLanguage={settings.selectedLanguage}
        setSelectedLanguage={settings.setSelectedLanguage}
        availableLanguages={availableLanguages}
        languageNames={languageNames}
        selectedScript={settings.selectedScript}
        setSelectedScript={settings.setSelectedScript}
        availableScripts={availableScripts}
        useUppercase={settings.useUppercase}
        setUseUppercase={settings.setUseUppercase}
        themeName={settings.themeName}
        setThemeName={settings.setThemeName}
        theme={theme}
        fontFamily={settings.fontFamily}
        setFontFamily={settings.setFontFamily}
        borderWidth={settings.borderWidth}
        setBorderWidth={settings.setBorderWidth}
        learnedWordsCount={learnedWordsCount}
        onClearLearnedData={handleClearLearnedData}
        onExportLearnedData={handleExportLearnedData}
        gameMode={settings.gameMode}
        setGameMode={settings.setGameMode}
        gameWordList={settings.gameWordList}
        setGameWordList={settings.setGameWordList}
        gameTarget={currentGameTarget}
        audioEffectsEnabled={settings.audioEffectsEnabled}
        setAudioEffectsEnabled={settings.setAudioEffectsEnabled}
        speakAfterPredictions={settings.speakAfterPredictions}
        setSpeakAfterPredictions={settings.setSpeakAfterPredictions}
        enableHoldActions={settings.enableHoldActions}
        setEnableHoldActions={settings.setEnableHoldActions}
        shortHoldDuration={settings.shortHoldDuration}
        setShortHoldDuration={settings.setShortHoldDuration}
        longHoldDuration={settings.longHoldDuration}
        setLongHoldDuration={settings.setLongHoldDuration}
        shortHoldAction={settings.shortHoldAction}
        setShortHoldAction={settings.setShortHoldAction}
        longHoldAction={settings.longHoldAction}
        setLongHoldAction={settings.setLongHoldAction}
      />
    </div>
  );
};

export default App;
