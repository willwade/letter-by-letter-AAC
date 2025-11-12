import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ALPHABET, SPECIAL_ACTIONS, SPEAK, SPACE, UNDO, CLEAR } from './constants';
import type { ScanMode, ThemeName } from './types';
import Display from './components/Display';
import Scanner from './components/Scanner';
import Controls from './components/Controls';
import { createErrorTolerantPredictor, type Predictor } from '@willwade/ppmpredictor';
import {
  getUppercase,
  getLowercase,
  getScripts,
  getIndexData,
  loadFrequencyList,
} from 'worldalphabets';
import { getTheme } from './themes';
import confetti from 'canvas-confetti';
import { getTrainingFileName } from './trainingDataMap';
import { resolveFontFamily } from './utils/fontMapping';

/**
 * Build a keyboard adjacency map from an alphabetical list.
 * Each letter is adjacent to the letters immediately before and after it in the list.
 * This helps the error-tolerant predictor understand that adjacent letters in our
 * linear scanning interface are "closer" to each other.
 */
function buildKeyboardAdjacencyMap(letters: string[]): Record<string, string[]> {
  const adjacencyMap: Record<string, string[]> = {};

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i].toLowerCase();
    const adjacent: string[] = [];

    // Add previous letter if exists
    if (i > 0) {
      adjacent.push(letters[i - 1].toLowerCase());
    }

    // Add next letter if exists
    if (i < letters.length - 1) {
      adjacent.push(letters[i + 1].toLowerCase());
    }

    if (adjacent.length > 0) {
      adjacencyMap[letter] = adjacent;
    }
  }

  console.log('🗺️ Built keyboard adjacency map:', adjacencyMap);
  return adjacencyMap;
}

/**
 * Load frequency word list from worldalphabets for a given language.
 * Returns top 1000 most frequent words for the language.
 */
async function loadWordFrequencyList(languageCode: string): Promise<string[]> {
  try {
    // Use worldalphabets loadFrequencyList API
    const freqData = await loadFrequencyList(languageCode);

    if (freqData && freqData.tokens && freqData.tokens.length > 0) {
      console.log(
        `✅ Loaded ${freqData.tokens.length} words from worldalphabets frequency list (mode: ${freqData.mode})`
      );

      // Strip frequency counts from tokens (format: "word\tcount" or just "word")
      const cleanedTokens = freqData.tokens
        .map((token: string) => {
          // Split on tab character and take only the word part
          const parts = token.split('\t');
          return parts[0].trim();
        })
        .filter((word: string) => word.length > 0);

      console.log(`✅ Cleaned ${cleanedTokens.length} words (removed frequency counts)`);
      return cleanedTokens;
    } else {
      console.warn(`⚠️ No frequency list found for ${languageCode}`);
      return [];
    }
  } catch (error) {
    console.warn(`⚠️ Could not load frequency list for ${languageCode}:`, error);
    return [];
  }
}

const App: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [scanIndex, setScanIndex] = useState<number>(0);

  // Initialize with correct case based on localStorage setting
  const initialUseUppercase = localStorage.getItem('useUppercase') === 'true';
  const initialAlphabet = initialUseUppercase ? ALPHABET : ALPHABET.map((l) => l.toLowerCase());

  // Start with alphabet in correct case - special actions will be added by useEffect when message has content
  const [scanItems, setScanItems] = useState<string[]>([...initialAlphabet]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<ScanMode>(() => {
    return (localStorage.getItem('scanMode') as ScanMode) || 'one-switch';
  });
  const [scanSpeed, setScanSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('scanSpeed');
    return saved ? Number(saved) : 1000;
  });
  const [firstItemDelay, setFirstItemDelay] = useState<number>(() => {
    const saved = localStorage.getItem('firstItemDelay');
    return saved ? Number(saved) : 1500; // Default 1.5 seconds
  });
  const [holdSpeed, setHoldSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('holdSpeed');
    return saved ? Number(saved) : 100; // Default 100ms (fast)
  });
  const [debounceTime, setDebounceTime] = useState<number>(() => {
    const saved = localStorage.getItem('debounceTime');
    return saved ? Number(saved) : 0; // Default 0ms (disabled)
  });
  const [predictedLetters, setPredictedLetters] = useState<string[]>([]);
  const [predictedWords, setPredictedWords] = useState<string[]>([]);
  const [enablePrediction, setEnablePrediction] = useState<boolean>(() => {
    const saved = localStorage.getItem('enablePrediction');
    return saved !== null ? saved === 'true' : true;
  });
  const [showWordPrediction, setShowWordPrediction] = useState<boolean>(() => {
    return localStorage.getItem('showWordPrediction') === 'true';
  });
  const [messageFontSize, setMessageFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('messageFontSize');
    return saved ? Number(saved) : 48;
  });
  const [scannerFontSize, setScannerFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('scannerFontSize');
    return saved ? Number(saved) : 300;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
    return localStorage.getItem('selectedVoiceURI') || null;
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [hideControlBar, setHideControlBar] = useState<boolean>(() => {
    return localStorage.getItem('hideControlBar') === 'true';
  });

  // Game Mode state
  const [gameMode, setGameMode] = useState<boolean>(() => {
    return localStorage.getItem('gameMode') === 'true';
  });
  const [gameWordList, setGameWordList] = useState<string[]>(() => {
    const saved = localStorage.getItem('gameWordList');
    return saved ? JSON.parse(saved) : ['hi', 'hello', 'cold', 'hot', 'tea please'];
  });
  const [currentGameWordIndex, setCurrentGameWordIndex] = useState<number>(() => {
    const saved = localStorage.getItem('currentGameWordIndex');
    return saved ? Number(saved) : 0;
  });

  const [predictor, setPredictor] = useState<Predictor | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<string>('No model loaded.');
  const [learnedWordsCount, setLearnedWordsCount] = useState<number>(0); // Track learned words
  const [loadedTrainingData, setLoadedTrainingData] = useState<string>(''); // Store the loaded training corpus

  // Language and alphabet state
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('selectedLanguage') || 'en';
  });
  const [selectedScript, setSelectedScript] = useState<string | null>(() => {
    return localStorage.getItem('selectedScript') || null;
  });
  const [useUppercase, setUseUppercase] = useState<boolean>(() => {
    return localStorage.getItem('useUppercase') === 'true';
  });
  const [alphabet, setAlphabet] = useState<string[]>(initialAlphabet);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  const [languageNames, setLanguageNames] = useState<Record<string, string>>({});
  const [isRTL, setIsRTL] = useState<boolean>(false);

  // Theme state
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    return (localStorage.getItem('theme') as ThemeName) || 'default';
  });
  const theme = getTheme(themeName);

  // Font family state
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('fontFamily') || 'system-ui';
  });

  // Resolved font family - automatically selects the correct Playpen Sans variant
  // based on the current language and script
  const resolvedFontFamily = useMemo(() => {
    return resolveFontFamily(fontFamily, selectedLanguage, selectedScript);
  }, [fontFamily, selectedLanguage, selectedScript]);

  // Border width state for scanner items
  const [borderWidth, setBorderWidth] = useState<number>(() => {
    const saved = localStorage.getItem('borderWidth');
    return saved ? Number(saved) : 0;
  });

  // Audio effects state
  const [audioEffectsEnabled, setAudioEffectsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('audioEffectsEnabled') === 'true';
  });

  // SPEAK button placement: after predictions or in action block
  const [speakAfterPredictions, setSpeakAfterPredictions] = useState<boolean>(() => {
    return localStorage.getItem('speakAfterPredictions') === 'true';
  });

  // Hold action settings for one-switch mode
  const [enableHoldActions, setEnableHoldActions] = useState<boolean>(() => {
    return localStorage.getItem('enableHoldActions') === 'true';
  });
  const [shortHoldDuration, setShortHoldDuration] = useState<number>(() => {
    const saved = localStorage.getItem('shortHoldDuration');
    return saved ? Number(saved) : 1000; // Default 1 second
  });
  const [longHoldDuration, setLongHoldDuration] = useState<number>(() => {
    const saved = localStorage.getItem('longHoldDuration');
    return saved ? Number(saved) : 2000; // Default 2 seconds (1s + 1s additional)
  });
  const [shortHoldAction, setShortHoldAction] = useState<string>(() => {
    return localStorage.getItem('shortHoldAction') || 'SPEAK';
  });
  const [longHoldAction, setLongHoldAction] = useState<string>(() => {
    return localStorage.getItem('longHoldAction') || 'CLEAR';
  });

  // Hold progress indicator state
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0-100 percentage
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdZone, setHoldZone] = useState<'none' | 'green' | 'red'>('none'); // Which zone we're in (for UI)
  const holdZoneRef = useRef<'none' | 'green' | 'red'>('none'); // Which zone we're in (for keyup handler)
  const holdProgressIntervalRef = useRef<number | undefined>(undefined);

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
      if (!audioEffectsEnabled || !audioContext || !audioBuffers[type]) return;

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
    [audioEffectsEnabled, audioContext, audioBuffers]
  );

  // Effect to load language-specific model and training data
  useEffect(() => {
    const loadLanguageModel = async () => {
      setTrainingStatus(`Loading model for ${selectedLanguage}...`);
      try {
        const trainingFileName = getTrainingFileName(selectedLanguage);
        let corpusText = '';
        let lexicon: string[] = [];

        // Try to load training data from local files
        if (trainingFileName) {
          try {
            const basePath = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${basePath}data/training/${trainingFileName}`);
            if (response.ok) {
              corpusText = await response.text();
              console.log(`✅ Loaded training data from ${trainingFileName}`);
            } else {
              console.warn(`⚠️ Could not load training file: ${trainingFileName}`);
            }
          } catch (error) {
            console.warn(`⚠️ Error loading training file:`, error);
          }
        }

        // Try to load lexicon from worldalphabets frequency lists
        try {
          // First try worldalphabets frequency list (top 1000 words)
          lexicon = await loadWordFrequencyList(selectedLanguage);
          console.log(`✅ Using ${lexicon.length} words from worldalphabets frequency list`);
        } catch (error) {
          console.warn(`⚠️ Could not load lexicon:`, error);
        }

        // Build keyboard adjacency map from current alphabet
        const adjacencyMap = buildKeyboardAdjacencyMap(alphabet);

        // Create predictor with error tolerance, keyboard awareness, and lexicon
        const newPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10,
          keyboardAware: true,
          keyboardAdjacencyMap: adjacencyMap,
          lexicon: lexicon.length > 0 ? lexicon : undefined,
        });

        console.log(
          '✅ Created predictor with keyboard awareness for alphabet:',
          alphabet.slice(0, 10)
        );
        if (lexicon.length > 0) {
          console.log(
            `✅ Predictor has lexicon with ${lexicon.length} words for error-tolerant matching`
          );
        }

        // Train on corpus text if available
        if (corpusText) {
          console.log(`📚 Training on corpus text (${corpusText.length} characters)...`);
          newPredictor.train(corpusText);

          // Store the training data for export
          setLoadedTrainingData(corpusText);

          // Count words in training corpus
          const corpusWords = corpusText.trim().split(/\s+/).filter((w) => w.length > 0).length;
          setTrainingStatus(
            `✅ Trained on ${trainingFileName} (${corpusWords.toLocaleString()} words) + lexicon (${lexicon.length} words)`
          );
        } else {
          // No training data loaded
          setLoadedTrainingData('');
          setTrainingStatus(
            `✅ Model ready with lexicon (${lexicon.length} words). Will learn from your input.`
          );
        }

        // Load and replay session data from localStorage for adaptive learning
        const sessionKey = `ppm-session-${selectedLanguage}`;
        const sessionData = localStorage.getItem(sessionKey);
        if (sessionData) {
          const learnedWords = sessionData
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
          console.log(`📚 Also loading ${learnedWords.length} learned words from previous sessions`);
          newPredictor.train(sessionData);
          setLearnedWordsCount(learnedWords.length);
        } else {
          setLearnedWordsCount(0);
        }

        setPredictor(newPredictor);
      } catch (error) {
        console.error('❌ Failed to load language model:', error);
        setTrainingStatus(`❌ Error: Could not load model for ${selectedLanguage}.`);

        // Create a basic predictor as fallback with keyboard awareness
        const adjacencyMap = buildKeyboardAdjacencyMap(alphabet);
        const fallbackPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10,
          keyboardAware: true,
          keyboardAdjacencyMap: adjacencyMap,
        });
        setPredictor(fallbackPredictor);
      }
    };

    loadLanguageModel();
  }, [selectedLanguage, alphabet]); // Reload when language changes

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
        if (scripts.length > 0 && !scripts.includes(selectedScript || '')) {
          setSelectedScript(scripts[0]);
        } else if (scripts.length === 0) {
          setSelectedScript(null);
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
        setSelectedScript(null);
        setIsRTL(false);
      }
    };
    loadScripts();
  }, [selectedLanguage, selectedScript]);

  // Effect to update alphabet when language, script, or case changes
  useEffect(() => {
    const loadAlphabet = async () => {
      try {
        let letters: string[];
        if (useUppercase) {
          letters = await getUppercase(selectedLanguage, selectedScript || undefined);
          console.log(`Loaded uppercase alphabet for ${selectedLanguage}:`, letters.slice(0, 5));
        } else {
          letters = await getLowercase(selectedLanguage, selectedScript || undefined);
          console.log(`Loaded lowercase alphabet for ${selectedLanguage}:`, letters.slice(0, 5));
        }
        setAlphabet(letters);
        // Update scan items with new alphabet
        setScanItems([...letters, ...SPECIAL_ACTIONS]);
        console.log(
          '✅ Alphabet set to:',
          letters.slice(0, 10),
          '(useUppercase:',
          useUppercase,
          ')'
        );
      } catch (error) {
        console.error('Failed to load alphabet:', error);
        // Fallback to default English alphabet
        const fallbackAlphabet = useUppercase ? ALPHABET : ALPHABET.map((l) => l.toLowerCase());
        setAlphabet(fallbackAlphabet);
        setScanItems([...fallbackAlphabet, ...SPECIAL_ACTIONS]);
      }
    };
    loadAlphabet();
  }, [selectedLanguage, selectedScript, useUppercase]);

  // Effect to save language preferences to localStorage
  useEffect(() => {
    localStorage.setItem('selectedLanguage', selectedLanguage);
    if (selectedScript) {
      localStorage.setItem('selectedScript', selectedScript);
    } else {
      localStorage.removeItem('selectedScript');
    }
    localStorage.setItem('useUppercase', useUppercase.toString());
  }, [selectedLanguage, selectedScript, useUppercase]);

  // Effect to save scan mode to localStorage
  useEffect(() => {
    localStorage.setItem('scanMode', scanMode);
  }, [scanMode]);

  // Effect to save scan speed to localStorage
  useEffect(() => {
    localStorage.setItem('scanSpeed', scanSpeed.toString());
  }, [scanSpeed]);

  // Effect to save first item delay to localStorage
  useEffect(() => {
    localStorage.setItem('firstItemDelay', firstItemDelay.toString());
  }, [firstItemDelay]);

  // Effect to save hold speed to localStorage
  useEffect(() => {
    localStorage.setItem('holdSpeed', holdSpeed.toString());
  }, [holdSpeed]);

  // Effect to save debounce time to localStorage
  useEffect(() => {
    localStorage.setItem('debounceTime', debounceTime.toString());
  }, [debounceTime]);

  // Effect to save prediction settings to localStorage
  useEffect(() => {
    localStorage.setItem('enablePrediction', enablePrediction.toString());
  }, [enablePrediction]);

  useEffect(() => {
    localStorage.setItem('showWordPrediction', showWordPrediction.toString());
  }, [showWordPrediction]);

  // Effect to save font sizes to localStorage
  useEffect(() => {
    localStorage.setItem('messageFontSize', messageFontSize.toString());
  }, [messageFontSize]);

  useEffect(() => {
    localStorage.setItem('scannerFontSize', scannerFontSize.toString());
  }, [scannerFontSize]);

  // Effect to save selected voice to localStorage
  useEffect(() => {
    if (selectedVoiceURI) {
      localStorage.setItem('selectedVoiceURI', selectedVoiceURI);
    } else {
      localStorage.removeItem('selectedVoiceURI');
    }
  }, [selectedVoiceURI]);

  // Effect to save hide control bar setting to localStorage
  useEffect(() => {
    localStorage.setItem('hideControlBar', hideControlBar.toString());
  }, [hideControlBar]);

  // Effect to save game mode settings to localStorage
  useEffect(() => {
    localStorage.setItem('gameMode', gameMode.toString());
  }, [gameMode]);

  useEffect(() => {
    localStorage.setItem('gameWordList', JSON.stringify(gameWordList));
  }, [gameWordList]);

  useEffect(() => {
    localStorage.setItem('currentGameWordIndex', currentGameWordIndex.toString());
  }, [currentGameWordIndex]);

  // Effect to save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', themeName);
  }, [themeName]);

  // Effect to save font family to localStorage
  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontFamily]);

  // Effect to save border width to localStorage
  useEffect(() => {
    localStorage.setItem('borderWidth', borderWidth.toString());
  }, [borderWidth]);

  // Effect to save audio effects enabled to localStorage
  useEffect(() => {
    localStorage.setItem('audioEffectsEnabled', audioEffectsEnabled.toString());
  }, [audioEffectsEnabled]);

  // Effect to save speakAfterPredictions to localStorage
  useEffect(() => {
    localStorage.setItem('speakAfterPredictions', speakAfterPredictions.toString());
  }, [speakAfterPredictions]);

  // Effect to save hold action settings to localStorage
  useEffect(() => {
    localStorage.setItem('enableHoldActions', enableHoldActions.toString());
  }, [enableHoldActions]);

  useEffect(() => {
    localStorage.setItem('shortHoldDuration', shortHoldDuration.toString());
  }, [shortHoldDuration]);

  useEffect(() => {
    localStorage.setItem('longHoldDuration', longHoldDuration.toString());
  }, [longHoldDuration]);

  useEffect(() => {
    localStorage.setItem('shortHoldAction', shortHoldAction);
  }, [shortHoldAction]);

  useEffect(() => {
    localStorage.setItem('longHoldAction', longHoldAction);
  }, [longHoldAction]);

  // Debug: Log when holdZone changes
  useEffect(() => {
    console.log(`🎨 holdZone changed to: ${holdZone}`);
  }, [holdZone]);

  // Debounced effect for running predictions as the user types
  useEffect(() => {
    if (!enablePrediction || !predictor) {
      setPredictedLetters([]);
      setPredictedWords([]);
      return;
    }

    const handler = setTimeout(() => {
      // The library's prediction works better on lower-case text for consistency.
      const lowerCaseMessage = message.toLowerCase();

      // CHARACTER PREDICTIONS (direct from PPM model)
      predictor.resetContext();
      predictor.addToContext(lowerCaseMessage);
      const charPredictions = predictor.predictNextCharacter();

      // Filter for single alphabet characters and apply case based on useUppercase setting
      const caseTransform = useUppercase
        ? (s: string) => s.toUpperCase()
        : (s: string) => s.toLowerCase();
      const letterFilter = useUppercase
        ? (c: string) => c.length === 1 && c >= 'A' && c <= 'Z'
        : (c: string) => c.length === 1 && c >= 'a' && c <= 'z';

      const uniqueLetters = [
        ...new Set(charPredictions.map((p) => caseTransform(p.text)).filter(letterFilter)),
      ];
      setPredictedLetters(uniqueLetters.slice(0, 8));

      // WORD PREDICTIONS (for current partial word)
      const words = message.split(' ');
      const currentPartialWord = words[words.length - 1];

      if (currentPartialWord.trim().length > 0) {
        const precedingText = message
          .substring(0, message.length - currentPartialWord.length)
          .toLowerCase();
        const wordPredictions = predictor.predictWordCompletion(
          currentPartialWord.toLowerCase(),
          precedingText
        );

        // Apply case transformation based on useUppercase setting
        // Extract text property from prediction objects
        const wordTexts = wordPredictions.slice(0, 5).map((p) => {
          const text = typeof p === 'string' ? p : p.text;
          return caseTransform(text);
        });

        setPredictedWords(wordTexts);
      } else {
        setPredictedWords([]);
      }
    }, 250); // 250ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [message, enablePrediction, predictor, useUppercase]);

  // Compute current game target word
  const currentGameTarget =
    gameMode && gameWordList.length > 0
      ? gameWordList[currentGameWordIndex % gameWordList.length]
      : '';

  // Compute next correct letter for game mode
  const nextCorrectLetter =
    gameMode && currentGameTarget ? currentGameTarget[message.length]?.toLowerCase() : null;

  useEffect(() => {
    const newScanItems: string[] = [];

    const predictionEnabledAndReady = enablePrediction && predictor;

    // Game Mode: show full alphabet but only next correct letter is selectable
    if (gameMode && currentGameTarget) {
      // Include full alphabet
      newScanItems.push(...alphabet);

      // If next character is a space, include SPACE action
      const nextChar = currentGameTarget[message.length];
      if (nextChar === ' ') {
        newScanItems.push(SPACE);
      }

      // Always include actions at the end (SPECIAL_ACTIONS includes SPEAK, UNDO, CLEAR)
      if (message.length > 0) {
        newScanItems.push(...SPECIAL_ACTIONS);
      }
    } else if (!predictionEnabledAndReady) {
      // Include alphabet first
      newScanItems.push(...alphabet);

      // Only include SPECIAL_ACTIONS if message has at least one character
      // SPECIAL_ACTIONS now includes SPEAK by default
      if (message.length > 0) {
        newScanItems.push(...SPECIAL_ACTIONS);
      }
    } else {
      // Prediction mode enabled
      // Include predicted words at the start
      if (showWordPrediction && predictedWords.length > 0) {
        newScanItems.push(...predictedWords);
      }

      // Include predicted letters
      newScanItems.push(...predictedLetters);

      // Conditionally add SPEAK after predictions if setting is enabled
      if (speakAfterPredictions && message.length > 1) {
        newScanItems.push(SPEAK);
      }

      // Include full alphabet (predicted letters will appear again in their regular positions)
      newScanItems.push(...alphabet);

      // Include SPECIAL_ACTIONS if message has at least one character
      if (message.length > 0) {
        // If SPEAK is after predictions, exclude it from SPECIAL_ACTIONS here
        if (speakAfterPredictions) {
          // Add actions without SPEAK (since it's already after predictions)
          newScanItems.push(SPACE, UNDO, CLEAR);
        } else {
          // Add all SPECIAL_ACTIONS including SPEAK
          newScanItems.push(...SPECIAL_ACTIONS);
        }
      }
    }

    setScanItems(newScanItems);
    setScanIndex(0);
  }, [
    predictedLetters,
    predictedWords,
    message,
    showWordPrediction,
    enablePrediction,
    predictor,
    alphabet,
    gameMode,
    nextCorrectLetter,
    currentGameTarget,
    useUppercase,
    speakAfterPredictions,
  ]);

  // Effect to update keyboard adjacency map when scan items change
  useEffect(() => {
    if (!predictor || !enablePrediction) return;

    // Filter scanItems to only include single-character letters (not words, actions, etc.)
    const letterItems = scanItems.filter(
      (item) => item.length === 1 && !SPECIAL_ACTIONS.includes(item) && item !== SPEAK
    );

    // Build adjacency map based on the CURRENT scan order
    const adjacencyMap = buildKeyboardAdjacencyMap(letterItems);

    // Update the predictor's keyboard adjacency map using updateConfig
    if (predictor.updateConfig) {
      predictor.updateConfig({ keyboardAdjacencyMap: adjacencyMap });
      console.log(
        '🔄 Updated keyboard adjacency map based on current scan order:',
        letterItems.slice(0, 10)
      );
    }
  }, [scanItems, predictor, enablePrediction]);

  // Effect to load speech synthesis voices
  useEffect(() => {
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
  }, [selectedLanguage, selectedVoiceURI]);

  const handleSelect = useCallback(
    (item: string) => {
      // Play select sound
      playSound('select');

      // Game Mode: handle letter selection and word completion
      if (gameMode && currentGameTarget) {
        if (item === 'SPEAK' && message.length === currentGameTarget.length) {
          // Word completed - speak it and move to next word
          if ('speechSynthesis' in window && message) {
            const utterance = new SpeechSynthesisUtterance(message);
            const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
            window.speechSynthesis.speak(utterance);
          }

          // Move to next word and clear message
          setCurrentGameWordIndex((prev) => (prev + 1) % gameWordList.length);
          setMessage('');
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
                      (v) => v.voiceURI === selectedVoiceURI
                    );
                    if (selectedVoice) {
                      utterance.voice = selectedVoice;
                    }
                    window.speechSynthesis.speak(utterance);
                  }

                  // Move to next word after 1.5 seconds
                  setTimeout(() => {
                    setCurrentGameWordIndex((prev) => (prev + 1) % gameWordList.length);
                    setMessage('');
                  }, 1500);
                }, 300);
              }

              return newMessage;
            });
          }
          // Ignore incorrect letters/spaces (do nothing)
          return;
        }
      }

      // Normal mode (non-game)
      if (showWordPrediction && predictedWords.includes(item)) {
        const lastSpaceIndex = message.lastIndexOf(' ');
        const messageBase = lastSpaceIndex === -1 ? '' : message.substring(0, lastSpaceIndex + 1);
        const newMessage = messageBase + item + ' ';
        setMessage(newMessage);

        // Train predictor on confirmed word selection
        if (predictor) {
          predictor.addToContext(item + ' ');
          // Save to session buffer for persistence
          const sessionKey = `ppm-session-${selectedLanguage}`;
          const currentSession = localStorage.getItem(sessionKey) || '';
          localStorage.setItem(sessionKey, currentSession + item + ' ');
          setLearnedWordsCount((prev) => prev + 1);
        }
      } else if (item === '_') {
        // Corresponds to SPACE constant
        setMessage((prev) => prev + ' ');
        // Train on space (context boundary)
        if (predictor) {
          predictor.addToContext(' ');
        }
      } else if (item === 'UNDO') {
        // Corresponds to UNDO constant
        setMessage((prev) => prev.slice(0, -1));
      } else if (item === 'CLEAR') {
        // Corresponds to CLEAR constant
        setMessage('');
      } else if (item === 'SPEAK') {
        // Corresponds to SPEAK constant
        if ('speechSynthesis' in window && message) {
          const utterance = new SpeechSynthesisUtterance(message);
          const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
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
        setMessage((prev) => prev + item);
      }
      setScanIndex(0);
    },
    [
      message,
      showWordPrediction,
      predictedWords,
      availableVoices,
      selectedVoiceURI,
      gameMode,
      currentGameTarget,
      gameWordList,
      predictor,
      selectedLanguage,
      playSound,
    ]
  );

  const handleClear = useCallback(() => {
    setMessage('');
    setIsScanning(false);
    setScanIndex(0);
  }, []);

  const handleUndo = useCallback(() => {
    setMessage((prev) => prev.slice(0, -1));
    setScanIndex(0);
  }, []);

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
              const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
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
    [message, availableVoices, selectedVoiceURI, handleUndo, handleClear]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      setTrainingStatus(`Training on ${file.name}...`);
      try {
        const text = await file.text();

        // Extract lexicon from uploaded file
        const words = text
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 0);
        const wordFreq = new Map<string, number>();
        words.forEach((word) => {
          const count = wordFreq.get(word) || 0;
          wordFreq.set(word, count + 1);
        });
        // Sort by frequency and take top 5000 words
        const lexicon = Array.from(wordFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5000)
          .map(([word]) => word);

        console.log(`✅ Extracted ${lexicon.length} words from uploaded file as lexicon`);

        // Build keyboard adjacency map from current alphabet
        const adjacencyMap = buildKeyboardAdjacencyMap(alphabet);

        // Use error-tolerant predictor with keyboard awareness and lexicon
        const newPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          lexicon: lexicon,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10,
          keyboardAware: true,
          keyboardAdjacencyMap: adjacencyMap,
        });

        // Train on uploaded file
        newPredictor.train(text);

        // Store the uploaded training data for export
        setLoadedTrainingData(text);

        // Also load and train on any existing learned data for this language
        const sessionKey = `ppm-session-${selectedLanguage}`;
        const sessionData = localStorage.getItem(sessionKey);
        if (sessionData) {
          const learnedWords = sessionData
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
          console.log(
            `📚 Also loading ${learnedWords.length} learned words from previous sessions`
          );
          newPredictor.train(sessionData);
          setLearnedWordsCount(learnedWords.length);
        } else {
          setLearnedWordsCount(0);
        }

        setPredictor(newPredictor);

        // Count words in uploaded file
        const uploadedWords = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
        setTrainingStatus(
          `✅ Trained on ${file.name} (${uploadedWords.toLocaleString()} words) + lexicon (${lexicon.length} words)`
        );
      } catch (error) {
        console.error('Failed to train model:', error);
        setTrainingStatus('Error training model. Please try again.');
      }
    },
    [selectedLanguage, alphabet]
  );

  const handleExportLearnedData = useCallback(async () => {
    const sessionKey = `ppm-session-${selectedLanguage}`;
    const sessionData = localStorage.getItem(sessionKey) || '';

    // Combine training data (if any) with learned data
    let exportData = '';
    let trainingWords = 0;
    let learnedWords = 0;

    // Add loaded training data first (from repo or uploaded file)
    if (loadedTrainingData.trim()) {
      exportData += loadedTrainingData;
      trainingWords = loadedTrainingData.trim().split(/\s+/).filter((w) => w.length > 0).length;

      // Add separator if we have both training data and learned data
      if (sessionData.trim()) {
        exportData += '\n\n';
      }
    }

    // Add learned data from user sessions
    if (sessionData.trim()) {
      exportData += sessionData;
      learnedWords = sessionData.split(/\s+/).filter((w) => w.length > 0).length;
    }

    // Check if we have any data to export
    if (!exportData.trim()) {
      alert('No training data to export. Upload a training file or start typing to build your personalized training data!');
      return;
    }

    // Create a blob with the combined data
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-data-${selectedLanguage}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const totalWords = trainingWords + learnedWords;
    console.log(`📥 Exported training data for ${selectedLanguage}: ${trainingWords.toLocaleString()} training words + ${learnedWords.toLocaleString()} learned words = ${totalWords.toLocaleString()} total words`);
  }, [selectedLanguage, loadedTrainingData]);

  const handleClearLearnedData = useCallback(() => {
    const sessionKey = `ppm-session-${selectedLanguage}`;
    localStorage.removeItem(sessionKey);
    setLearnedWordsCount(0);
    console.log('🗑️ Cleared learned data for', selectedLanguage);

    // Reload the predictor to reset it
    const loadLanguageModel = async () => {
      try {
        let lexicon: string[] = [];

        // Try to load lexicon from worldalphabets frequency lists
        try {
          lexicon = await loadWordFrequencyList(selectedLanguage);
          console.log(`✅ Using ${lexicon.length} words from worldalphabets frequency list`);
        } catch (error) {
          console.warn(`⚠️ Could not load lexicon:`, error);
        }

        // Build keyboard adjacency map from current alphabet
        const adjacencyMap = buildKeyboardAdjacencyMap(alphabet);

        const newPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10,
          keyboardAware: true,
          keyboardAdjacencyMap: adjacencyMap,
          lexicon: lexicon.length > 0 ? lexicon : undefined,
        });

        setPredictor(newPredictor);
        setTrainingStatus(
          `✅ Learned data cleared. Model reset with ${lexicon.length} words.`
        );
      } catch (error) {
        console.error('❌ Failed to reload model:', error);
      }
    };

    loadLanguageModel();
  }, [selectedLanguage, alphabet]);

  const handleSwitch1 = useCallback(() => {
    console.log(`🔘 handleSwitch1 called - scanMode: ${scanMode}, isScanning: ${isScanning}, scanIndex: ${scanIndex}, currentItem: ${scanItems[scanIndex]}`);
    if (scanMode === 'one-switch') {
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
      setScanIndex((prev) => (prev + 1) % scanItems.length);
    }
  }, [scanMode, isScanning, scanItems, scanIndex, handleSelect, playSound]);

  const handleSwitch2 = useCallback(() => {
    if (scanMode === 'two-switch') {
      handleSelect(scanItems[scanIndex]);
    }
  }, [scanMode, scanItems, scanIndex, handleSelect]);

  useEffect(() => {
    let scanInterval: number | undefined;
    let initialTimeout: number | undefined;

    // Pause scanning when settings modal is open
    if (isScanning && scanMode === 'one-switch' && !showSettingsModal) {
      // Use longer delay for first item (index 0), normal speed for others
      const isFirstItem = scanIndex === 0;
      const delay = isFirstItem ? firstItemDelay : scanSpeed;

      scanInterval = window.setInterval(() => {
        setScanIndex((prev) => {
          // Play click sound when advancing
          playSound('click');
          return (prev + 1) % scanItems.length;
        });
      }, delay);
    }

    return () => {
      clearInterval(scanInterval);
      clearTimeout(initialTimeout);
    };
  }, [isScanning, scanMode, scanSpeed, scanItems.length, scanIndex, firstItemDelay, playSound, showSettingsModal]);

  // Handle keyboard input with custom hold-down behavior for two-switch mode
  useEffect(() => {
    // Don't attach keyboard listeners when settings modal is open
    if (showSettingsModal) {
      return;
    }

    let holdInterval: number | undefined;
    let lastKeyUpTime: { [key: string]: number } = {};
    let keyPressStartTime: number | null = null;
    let shortHoldTimeout: number | undefined;
    let longHoldTimeout: number | undefined;
    let shortHoldTriggered = false;
    let longHoldTriggered = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();

        // Check for debounce - ignore if this is a bounce/double-press
        // Only apply debounce to the FIRST press (not repeats from holding)
        if (!event.repeat && debounceTime > 0) {
          const now = Date.now();
          const lastUp = lastKeyUpTime['Space'] || 0;
          const timeSinceLastUp = now - lastUp;

          if (timeSinceLastUp < debounceTime) {
            // This is a bounce/double-press - ignore it
            console.log(`🚫 Ignored bounce: ${timeSinceLastUp}ms since last release`);
            return;
          }
        }

        // One-switch mode with hold actions enabled
        if (scanMode === 'one-switch' && enableHoldActions) {
          if (!event.repeat) {
            // First press - start tracking hold time
            keyPressStartTime = Date.now();
            setIsHolding(true);
            setHoldProgress(0);
            setHoldZone('none');
            holdZoneRef.current = 'none';

            // Animate progress bar and update zones
            console.log(`⏱️ Starting hold timer - shortHold: ${shortHoldDuration}ms, longHold: ${longHoldDuration}ms`);
            const startTime = Date.now();

            // Clear any existing interval first
            if (holdProgressIntervalRef.current !== undefined) {
              clearInterval(holdProgressIntervalRef.current);
            }

            holdProgressIntervalRef.current = window.setInterval(() => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min((elapsed / longHoldDuration) * 100, 100);
              console.log(`📊 Progress: ${progress.toFixed(1)}%, elapsed: ${elapsed}ms, zone: ${elapsed >= longHoldDuration ? 'red' : elapsed >= shortHoldDuration ? 'green' : 'none'}`);
              setHoldProgress(progress);

              // Update zone based on elapsed time (zones are updated in setInterval, beeps in setTimeout)
              if (elapsed >= longHoldDuration) {
                console.log('🔴 Setting zone to RED');
                setHoldZone('red');
                holdZoneRef.current = 'red'; // Update ref immediately
                if (holdProgressIntervalRef.current !== undefined) {
                  clearInterval(holdProgressIntervalRef.current);
                  holdProgressIntervalRef.current = undefined;
                }
              } else if (elapsed >= shortHoldDuration) {
                console.log('🟢 Setting zone to GREEN');
                setHoldZone('green');
                holdZoneRef.current = 'green'; // Update ref immediately
              }
            }, 16); // ~60fps

            // Set timeout to beep when entering green zone
            shortHoldTimeout = window.setTimeout(() => {
              playSound('beep');
              console.log(`🟢 Entered green zone (${shortHoldDuration}ms)`);
            }, shortHoldDuration);

            // Set timeout to beep when entering red zone
            longHoldTimeout = window.setTimeout(() => {
              playSound('beep');
              console.log(`🔴 Entered red zone (${longHoldDuration}ms)`);
            }, longHoldDuration);
          }
          // Always return when hold actions are enabled to prevent normal switch behavior
          // (both for first press and repeat events)
          return;
        }

        // In two-switch mode, implement custom hold-down behavior with configurable speed
        if (scanMode === 'two-switch') {
          // Detect if this is a repeat event (key is being held)
          if (event.repeat) {
            // Key is being held - check if we should advance based on holdSpeed
            if (!holdInterval) {
              holdInterval = window.setInterval(() => {
                handleSwitch1();
              }, holdSpeed);
            }
          } else {
            // First press
            handleSwitch1();
          }
        } else {
          // One-switch mode: normal behavior (hold actions disabled or repeat event)
          handleSwitch1();
        }
      } else if (event.code === 'Enter' && scanMode === 'two-switch') {
        event.preventDefault();

        // Check for debounce on Enter key too
        if (!event.repeat && debounceTime > 0) {
          const now = Date.now();
          const lastUp = lastKeyUpTime['Enter'] || 0;
          const timeSinceLastUp = now - lastUp;

          if (timeSinceLastUp < debounceTime) {
            // This is a bounce/double-press - ignore it
            console.log(`🚫 Ignored bounce: ${timeSinceLastUp}ms since last release`);
            return;
          }
        }

        // Prevent key repeat for Enter to avoid repeated selection/speech
        if (event.repeat) {
          return;
        }
        handleSwitch2();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        // Record the time of this keyup for debounce checking
        lastKeyUpTime['Space'] = Date.now();

        // Handle hold actions on release
        if (scanMode === 'one-switch' && enableHoldActions) {
          // Clear timeouts
          if (shortHoldTimeout !== undefined) {
            clearTimeout(shortHoldTimeout);
            shortHoldTimeout = undefined;
          }
          if (longHoldTimeout !== undefined) {
            clearTimeout(longHoldTimeout);
            longHoldTimeout = undefined;
          }

          // Clear progress animation
          if (holdProgressIntervalRef.current !== undefined) {
            clearInterval(holdProgressIntervalRef.current);
            holdProgressIntervalRef.current = undefined;
          }

          // Determine which action to execute based on hold zone
          // Use ref instead of state to get the most up-to-date zone value
          const currentZone = holdZoneRef.current;
          console.log(`🔓 Key released in zone: ${currentZone}`);

          if (currentZone === 'red') {
            // Released in red zone - execute long hold action
            console.log(`🔴 Executing long hold action: ${longHoldAction}`);
            executeHoldAction(longHoldAction);
          } else if (currentZone === 'green') {
            // Released in green zone - execute short hold action
            console.log(`🟢 Executing short hold action: ${shortHoldAction}`);
            executeHoldAction(shortHoldAction);
          } else {
            // Released before entering any zone - normal switch behavior
            console.log('🖱️ Quick tap - executing normal switch action');
            handleSwitch1();
          }

          // Reset states
          setIsHolding(false);
          setHoldProgress(0);
          setHoldZone('none');
          holdZoneRef.current = 'none';
          keyPressStartTime = null;
        }

        if (scanMode === 'two-switch') {
          // Clear the hold interval when key is released
          if (holdInterval !== undefined) {
            clearInterval(holdInterval);
            holdInterval = undefined;
          }
        }
      } else if (event.code === 'Enter') {
        // Record the time of this keyup for debounce checking
        lastKeyUpTime['Enter'] = Date.now();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdInterval !== undefined) {
        clearInterval(holdInterval);
      }
      if (shortHoldTimeout !== undefined) {
        clearTimeout(shortHoldTimeout);
      }
      if (longHoldTimeout !== undefined) {
        clearTimeout(longHoldTimeout);
      }
      // Note: Don't clear holdProgressIntervalRef here - it should only be cleared on keyup
      // Clearing it here would stop the progress bar mid-hold when the effect re-runs
    };
  }, [
    handleSwitch1,
    handleSwitch2,
    scanMode,
    holdSpeed,
    debounceTime,
    showSettingsModal,
    enableHoldActions,
    shortHoldDuration,
    longHoldDuration,
    shortHoldAction,
    longHoldAction,
    executeHoldAction,
    playSound,
  ]);

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
          fontSize={messageFontSize}
          isRTL={isRTL}
          theme={theme}
          fontFamily={resolvedFontFamily}
        />
        <div className="relative flex-grow flex flex-col">
          <Scanner
            currentItem={scanItems[scanIndex] ?? ''}
            fontSize={scannerFontSize}
            theme={theme}
            fontFamily={resolvedFontFamily}
            borderWidth={borderWidth}
            predictedLetters={predictedLetters}
            predictedWords={predictedWords}
          />
          {/* Hold Progress Indicator */}
          {isHolding && enableHoldActions && (
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
        scanMode={scanMode}
        setScanMode={(mode) => {
          setScanMode(mode);
          setIsScanning(false);
          setScanIndex(0);
        }}
        scanSpeed={scanSpeed}
        setScanSpeed={setScanSpeed}
        firstItemDelay={firstItemDelay}
        setFirstItemDelay={setFirstItemDelay}
        holdSpeed={holdSpeed}
        setHoldSpeed={setHoldSpeed}
        debounceTime={debounceTime}
        setDebounceTime={setDebounceTime}
        isScanning={isScanning}
        setIsScanning={setIsScanning}
        onSwitch1={handleSwitch1}
        onSwitch2={handleSwitch2}
        onClear={handleClear}
        onUndo={handleUndo}
        messageFontSize={messageFontSize}
        setMessageFontSize={setMessageFontSize}
        scannerFontSize={scannerFontSize}
        setScannerFontSize={setScannerFontSize}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        enablePrediction={enablePrediction}
        setEnablePrediction={setEnablePrediction}
        showWordPrediction={showWordPrediction}
        setShowWordPrediction={setShowWordPrediction}
        availableVoices={availableVoices}
        selectedVoiceURI={selectedVoiceURI}
        setSelectedVoiceURI={setSelectedVoiceURI}
        onFileUpload={handleFileUpload}
        trainingStatus={trainingStatus}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        hideControlBar={hideControlBar}
        setHideControlBar={setHideControlBar}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        availableLanguages={availableLanguages}
        languageNames={languageNames}
        selectedScript={selectedScript}
        setSelectedScript={setSelectedScript}
        availableScripts={availableScripts}
        useUppercase={useUppercase}
        setUseUppercase={setUseUppercase}
        themeName={themeName}
        setThemeName={setThemeName}
        theme={theme}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        borderWidth={borderWidth}
        setBorderWidth={setBorderWidth}
        learnedWordsCount={learnedWordsCount}
        onClearLearnedData={handleClearLearnedData}
        onExportLearnedData={handleExportLearnedData}
        gameMode={gameMode}
        setGameMode={setGameMode}
        gameWordList={gameWordList}
        setGameWordList={setGameWordList}
        gameTarget={currentGameTarget}
        audioEffectsEnabled={audioEffectsEnabled}
        setAudioEffectsEnabled={setAudioEffectsEnabled}
        speakAfterPredictions={speakAfterPredictions}
        setSpeakAfterPredictions={setSpeakAfterPredictions}
        enableHoldActions={enableHoldActions}
        setEnableHoldActions={setEnableHoldActions}
        shortHoldDuration={shortHoldDuration}
        setShortHoldDuration={setShortHoldDuration}
        longHoldDuration={longHoldDuration}
        setLongHoldDuration={setLongHoldDuration}
        shortHoldAction={shortHoldAction}
        setShortHoldAction={setShortHoldAction}
        longHoldAction={longHoldAction}
        setLongHoldAction={setLongHoldAction}
      />
    </div>
  );
};

export default App;
