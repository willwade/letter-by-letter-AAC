import React, { useState, useEffect, useCallback } from 'react';
import { ALPHABET, SPECIAL_ACTIONS, SPEAK } from './constants';
import type { ScanMode, ThemeName } from './types';
import Display from './components/Display';
import Scanner from './components/Scanner';
import Controls from './components/Controls';
import { createErrorTolerantPredictor, type Predictor } from '@willwade/ppmpredictor';
import {
  getUppercase,
  getLowercase,
  getAvailableCodes,
  getScripts,
  getIndexData,
} from 'worldalphabets';
import { getTheme } from './themes';
import { getTrainingFileName, hasTrainingData as hasTrainingFile } from './trainingDataMap';

const App: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [scanItems, setScanItems] = useState<string[]>([...ALPHABET, ...SPECIAL_ACTIONS]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<ScanMode>('one-switch');
  const [scanSpeed, setScanSpeed] = useState<number>(1000);
  const [firstItemDelay, setFirstItemDelay] = useState<number>(() => {
    const saved = localStorage.getItem('firstItemDelay');
    return saved ? Number(saved) : 1500; // Default 1.5 seconds
  });
  const [predictedLetters, setPredictedLetters] = useState<string[]>([]);
  const [predictedWords, setPredictedWords] = useState<string[]>([]);
  const [enablePrediction, setEnablePrediction] = useState<boolean>(true);
  const [showWordPrediction, setShowWordPrediction] = useState<boolean>(false);
  const [messageFontSize, setMessageFontSize] = useState<number>(48);
  const [scannerFontSize, setScannerFontSize] = useState<number>(300);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [hideControlBar, setHideControlBar] = useState<boolean>(false);

  const [predictor, setPredictor] = useState<Predictor | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<string>('No model loaded.');
  const [hasTrainingData, setHasTrainingData] = useState<boolean>(true); // Track if training data was loaded
  const [learnedWordsCount, setLearnedWordsCount] = useState<number>(0); // Track learned words

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
  const [alphabet, setAlphabet] = useState<string[]>(ALPHABET);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  const [languageNames, setLanguageNames] = useState<Record<string, string>>({});
  const [isRTL, setIsRTL] = useState<boolean>(false);

  // Theme state
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    return (localStorage.getItem('theme') as ThemeName) || 'default';
  });
  const theme = getTheme(themeName);

  // Effect to load language-specific model and training data
  useEffect(() => {
    const loadLanguageModel = async () => {
        setTrainingStatus(`Loading model for ${selectedLanguage}...`);
        try {
            const trainingFileName = getTrainingFileName(selectedLanguage);
            let corpusText = '';

            // Try to load training data from ppmpredictor package via unpkg CDN
            if (trainingFileName) {
              try {
                // Fetch from unpkg CDN
                const cdnUrl = `https://unpkg.com/@willwade/ppmpredictor@0.0.4/data/training/${trainingFileName}`;
                console.log(`📥 Fetching training data from: ${cdnUrl}`);

                const response = await fetch(cdnUrl);
                if (response.ok) {
                  corpusText = await response.text();
                  console.log(`✅ Loaded training data for ${selectedLanguage} from ${trainingFileName}`);
                } else {
                  console.warn(`⚠️ Failed to fetch training data: ${response.status} ${response.statusText}`);
                }
              } catch (error) {
                console.warn(`⚠️ Could not load training data for ${selectedLanguage}:`, error);
              }
            }

            // Create predictor with error tolerance
            const newPredictor = createErrorTolerantPredictor({
                maxOrder: 5,
                adaptive: true,
                maxEditDistance: 2,
                minSimilarity: 0.6,
                maxPredictions: 10
            });

            if (corpusText) {
              newPredictor.train(corpusText);
              const wordCount = corpusText.split(/\s+/).length;
              setTrainingStatus(`✅ Model loaded for ${selectedLanguage} (${wordCount.toLocaleString()} words).`);
              setHasTrainingData(true);
            } else {
              setTrainingStatus(`⚠️ Basic model for ${selectedLanguage} (no training data available).`);
              setHasTrainingData(false);
              // Keep prediction enabled but warn user
              console.warn(`No training data available for ${selectedLanguage}`);
            }

            // Load and replay session data from localStorage for adaptive learning
            const sessionKey = `ppm-session-${selectedLanguage}`;
            const sessionData = localStorage.getItem(sessionKey);
            if (sessionData) {
              const learnedWords = sessionData.trim().split(/\s+/).filter(w => w.length > 0);
              console.log(`📚 Loading ${learnedWords.length} words from previous sessions`);
              newPredictor.train(sessionData);
              setLearnedWordsCount(learnedWords.length);
            } else {
              setLearnedWordsCount(0);
            }

            setPredictor(newPredictor);
        } catch (error) {
            console.error("❌ Failed to load language model:", error);
            setTrainingStatus(`❌ Error: Could not load model for ${selectedLanguage}.`);
            setHasTrainingData(false);

            // Create a basic predictor as fallback
            const fallbackPredictor = createErrorTolerantPredictor({
                maxOrder: 5,
                adaptive: true,
                maxEditDistance: 2,
                minSimilarity: 0.6,
                maxPredictions: 10
            });
            setPredictor(fallbackPredictor);
        }
    };

    loadLanguageModel();
  }, [selectedLanguage]); // Reload when language changes

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
        setLanguageNames({ 'en': 'English' });
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

        console.log(`Language: ${selectedLanguage}, Script: ${currentScript}, RTL: ${isRightToLeft}`);
      } catch (error) {
        console.error('Failed to load scripts for language:', selectedLanguage, error);
        setAvailableScripts([]);
        setSelectedScript(null);
        setIsRTL(false);
      }
    };
    loadScripts();
  }, [selectedLanguage]);

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
        console.log('✅ Alphabet set to:', letters.slice(0, 10), '(useUppercase:', useUppercase, ')');
      } catch (error) {
        console.error('Failed to load alphabet:', error);
        // Fallback to default English alphabet
        const fallbackAlphabet = useUppercase ? ALPHABET : ALPHABET.map(l => l.toLowerCase());
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

  // Effect to save first item delay to localStorage
  useEffect(() => {
    localStorage.setItem('firstItemDelay', firstItemDelay.toString());
  }, [firstItemDelay]);

  // Effect to save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', themeName);
  }, [themeName]);

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
      const caseTransform = useUppercase ? (s: string) => s.toUpperCase() : (s: string) => s.toLowerCase();
      const letterFilter = useUppercase
        ? (c: string) => c.length === 1 && c >= 'A' && c <= 'Z'
        : (c: string) => c.length === 1 && c >= 'a' && c <= 'z';

      const uniqueLetters = [...new Set(
          charPredictions
              .map(p => caseTransform(p.text))
              .filter(letterFilter)
      )];
      setPredictedLetters(uniqueLetters.slice(0, 8));

      // WORD PREDICTIONS (for current partial word)
      const words = message.split(' ');
      const currentPartialWord = words[words.length - 1];

      if (currentPartialWord.trim().length > 0) {
        const precedingText = message.substring(0, message.length - currentPartialWord.length).toLowerCase();
        const wordPredictions = predictor.predictWordCompletion(
          currentPartialWord.toLowerCase(),
          precedingText
        );
        // Apply case transformation based on useUppercase setting
        setPredictedWords(wordPredictions.slice(0, 5).map(p => caseTransform(p.text)));
      } else {
        setPredictedWords([]);
      }
    }, 250); // 250ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [message, enablePrediction, predictor, useUppercase]);


  useEffect(() => {
    let newScanItems: string[] = [];

    const predictionEnabledAndReady = enablePrediction && predictor;

    if (!predictionEnabledAndReady) {
      if (message.length > 1) {
        newScanItems.push(SPEAK);
      }
      newScanItems.push(...alphabet, ...SPECIAL_ACTIONS);
    } else {
      const uniqueAlphabet = alphabet.filter(letter => !predictedLetters.includes(letter));

      if (showWordPrediction && predictedWords.length > 0) {
        newScanItems.push(...predictedWords);
      }

      newScanItems.push(...predictedLetters);

      if (message.length > 1) {
          newScanItems.push(SPEAK);
      }

      newScanItems.push(...uniqueAlphabet, ...SPECIAL_ACTIONS);
    }

    console.log('📊 Scan items updated. First 5 alphabet letters:', alphabet.slice(0, 5));
    console.log('📊 First 5 scan items:', newScanItems.slice(0, 5));
    setScanItems(newScanItems);
    setScanIndex(0);
  }, [predictedLetters, predictedWords, message, showWordPrediction, enablePrediction, predictor, alphabet]);

  // Effect to load speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Filter voices by selected language
        // Match voices where lang starts with the selected language code
        const filteredVoices = allVoices.filter(voice =>
          voice.lang.toLowerCase().startsWith(selectedLanguage.toLowerCase())
        );

        // If no voices match the selected language, show all voices as fallback
        const voicesToShow = filteredVoices.length > 0 ? filteredVoices : allVoices;
        setAvailableVoices(voicesToShow);

        // Auto-select a voice for the current language if needed
        if (!selectedVoiceURI || !voicesToShow.find(v => v.voiceURI === selectedVoiceURI)) {
          // Prefer local voices for the selected language
          const defaultVoice = voicesToShow.find(voice => voice.localService) || voicesToShow[0];
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

  const handleSelect = useCallback((item: string) => {
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
        setLearnedWordsCount(prev => prev + 1);
      }
    } else if (item === '_') { // Corresponds to SPACE constant
      setMessage(prev => prev + ' ');
      // Train on space (context boundary)
      if (predictor) {
        predictor.addToContext(' ');
      }
    } else if (item === 'UNDO') { // Corresponds to UNDO constant
      setMessage(prev => prev.slice(0, -1));
    } else if (item === 'CLEAR') { // Corresponds to CLEAR constant
      setMessage('');
    } else if (item === 'SPEAK') { // Corresponds to SPEAK constant
      if ('speechSynthesis' in window && message) {
        const utterance = new SpeechSynthesisUtterance(message);
        const selectedVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utterance);
      } else if (!message) {
        // Do nothing if message is empty
      }
      else {
        alert('Text-to-speech not supported in this browser.');
      }
    } else {
      setMessage(prev => prev + item);
    }
    setScanIndex(0);
  }, [message, showWordPrediction, predictedWords, availableVoices, selectedVoiceURI]);

  const handleClear = useCallback(() => {
    setMessage('');
    setIsScanning(false);
    setScanIndex(0);
  }, []);

  const handleUndo = useCallback(() => {
    setMessage(prev => prev.slice(0, -1));
    setScanIndex(0);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setTrainingStatus(`Training on ${file.name}...`);
    try {
      const text = await file.text();
      
      // Load lexicon (optional but recommended)
      const lexiconResponse = await fetch('./data/aac_lexicon_en_gb.txt');
      const lexiconText = await lexiconResponse.text();
      const lexicon = lexiconText.split('\n').filter(w => w.trim());
      
      // Use error-tolerant predictor
      const newPredictor = createErrorTolerantPredictor({ 
        maxOrder: 5, 
        adaptive: true,
        lexicon: lexicon,
        maxEditDistance: 2,
        minSimilarity: 0.6,
        maxPredictions: 10
      });
      
      newPredictor.train(text);
      setPredictor(newPredictor);
      setTrainingStatus(`Model trained on: ${file.name} with ${lexicon.length} words`);
    } catch (error) {
      console.error("Failed to train model:", error);
      setTrainingStatus("Error training model. Please try again.");
    }
  }, []);
  
  const handleClearLearnedData = useCallback(() => {
    const sessionKey = `ppm-session-${selectedLanguage}`;
    localStorage.removeItem(sessionKey);
    setLearnedWordsCount(0);
    console.log('🗑️ Cleared learned data for', selectedLanguage);

    // Reload the predictor to reset it
    const loadLanguageModel = async () => {
      try {
        let corpusText = '';
        const trainingFileName = getTrainingFileName(selectedLanguage);

        if (trainingFileName) {
          try {
            const cdnUrl = `https://unpkg.com/@willwade/ppmpredictor@0.0.4/data/training/${trainingFileName}`;
            const response = await fetch(cdnUrl);
            if (response.ok) {
              corpusText = await response.text();
            }
          } catch (error) {
            console.warn(`⚠️ Could not load training data:`, error);
          }
        }

        const newPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10
        });

        if (corpusText) {
          newPredictor.train(corpusText);
        }

        setPredictor(newPredictor);
        setTrainingStatus(`✅ Learned data cleared. Model reset.`);
      } catch (error) {
        console.error("❌ Failed to reload model:", error);
      }
    };

    loadLanguageModel();
  }, [selectedLanguage]);

  const handleSwitch1 = useCallback(() => {
    if (scanMode === 'one-switch') {
      if (isScanning) {
        handleSelect(scanItems[scanIndex]);
      } else {
        setIsScanning(true);
      }
    } else { // two-switch
      setScanIndex(prev => (prev + 1) % scanItems.length);
    }
  }, [scanMode, isScanning, scanItems, scanIndex, handleSelect]);

  const handleSwitch2 = useCallback(() => {
    if (scanMode === 'two-switch') {
      handleSelect(scanItems[scanIndex]);
    }
  }, [scanMode, scanItems, scanIndex, handleSelect]);

  useEffect(() => {
    let scanInterval: number | undefined;
    let initialTimeout: number | undefined;

    if (isScanning && scanMode === 'one-switch') {
      // Use longer delay for first item (index 0), normal speed for others
      const isFirstItem = scanIndex === 0;
      const delay = isFirstItem ? firstItemDelay : scanSpeed;

      scanInterval = window.setInterval(() => {
        setScanIndex(prev => (prev + 1) % scanItems.length);
      }, delay);
    }

    return () => {
      clearInterval(scanInterval);
      clearTimeout(initialTimeout);
    };
  }, [isScanning, scanMode, scanSpeed, scanItems.length, scanIndex, firstItemDelay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleSwitch1();
      } else if (event.code === 'Enter' && scanMode === 'two-switch') {
        event.preventDefault();
        handleSwitch2();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwitch1, handleSwitch2, scanMode]);
  
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
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
        color: theme.colors.text
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
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        aria-label="Open Settings"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <main className="flex-grow flex flex-col p-2 gap-2 overflow-hidden">
        <Display
          message={message}
          fontSize={messageFontSize}
          isRTL={isRTL}
          theme={theme}
        />
        <Scanner
          currentItem={scanItems[scanIndex] ?? ''}
          fontSize={scannerFontSize}
          theme={theme}
        />
      </main>

      {/* Settings Modal - Always rendered so it's accessible even when control bar is hidden */}
      <Controls
        scanMode={scanMode}
        setScanMode={mode => {
          setScanMode(mode);
          setIsScanning(false);
          setScanIndex(0);
        }}
        scanSpeed={scanSpeed}
        setScanSpeed={setScanSpeed}
        firstItemDelay={firstItemDelay}
        setFirstItemDelay={setFirstItemDelay}
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
        hasTrainingData={hasTrainingData}
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
        learnedWordsCount={learnedWordsCount}
        onClearLearnedData={handleClearLearnedData}
      />
    </div>
  );
};

export default App;