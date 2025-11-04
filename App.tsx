import React, { useState, useEffect, useCallback } from 'react';
import { ALPHABET, SPECIAL_ACTIONS, SPEAK } from './constants';
import type { ScanMode } from './types';
import Display from './components/Display';
import Scanner from './components/Scanner';
import Controls from './components/Controls';
import { createErrorTolerantPredictor, type Predictor } from '@willwade/ppmpredictor';


const App: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [scanItems, setScanItems] = useState<string[]>([...ALPHABET, ...SPECIAL_ACTIONS]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<ScanMode>('one-switch');
  const [scanSpeed, setScanSpeed] = useState<number>(1000);
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

  // Effect to load a default model and lexicon on startup
  useEffect(() => {
    const loadInitialModel = async () => {
        setTrainingStatus('Loading default model...');
        try {
            const [corpusResponse, lexiconResponse] = await Promise.all([
                fetch('./data/default_corpus.txt'),
                fetch('./data/aac_lexicon_en_gb.txt')
            ]);

            if (!corpusResponse.ok || !lexiconResponse.ok) {
                throw new Error('Failed to fetch initial model data.');
            }

            const corpusText = await corpusResponse.text();
            const lexiconText = await lexiconResponse.text();
            const lexicon = lexiconText.split('\n').filter(w => w.trim());

            const newPredictor = createErrorTolerantPredictor({ 
                maxOrder: 5, 
                adaptive: true,
                lexicon: lexicon,
                maxEditDistance: 2,
                minSimilarity: 0.6,
                maxPredictions: 10
            });

            newPredictor.train(corpusText);
            setPredictor(newPredictor);
            setTrainingStatus(`Default model loaded with ${lexicon.length} words.`);
        } catch (error) {
            console.error("Failed to load initial model:", error);
            setTrainingStatus("Error: Could not load default model.");
        }
    };

    loadInitialModel();
  }, []); // Empty array ensures this runs only once on mount

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

      // Filter for single alphabet characters, convert to uppercase for display, and ensure uniqueness.
      const uniqueLetters = [...new Set(
          charPredictions
              .map(p => p.text.toUpperCase())
              .filter(c => c.length === 1 && c >= 'A' && c <= 'Z')
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
        // Convert predictions to uppercase for UI consistency.
        setPredictedWords(wordPredictions.slice(0, 5).map(p => p.text.toUpperCase()));
      } else {
        setPredictedWords([]);
      }
    }, 250); // 250ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [message, enablePrediction, predictor]);


  useEffect(() => {
    let newScanItems: string[] = [];

    const predictionEnabledAndReady = enablePrediction && predictor;

    if (!predictionEnabledAndReady) {
      if (message.length > 1) {
        newScanItems.push(SPEAK);
      }
      newScanItems.push(...ALPHABET, ...SPECIAL_ACTIONS);
    } else {
      const uniqueAlphabet = ALPHABET.filter(letter => !predictedLetters.includes(letter));
      
      if (showWordPrediction && predictedWords.length > 0) {
        newScanItems.push(...predictedWords);
      }
      
      newScanItems.push(...predictedLetters);
      
      if (message.length > 1) {
          newScanItems.push(SPEAK);
      }

      newScanItems.push(...uniqueAlphabet, ...SPECIAL_ACTIONS);
    }
    
    setScanItems(newScanItems);
    setScanIndex(0);
  }, [predictedLetters, predictedWords, message, showWordPrediction, enablePrediction, predictor]);

  // Effect to load speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        if (!selectedVoiceURI) {
          // Try to set a default English voice
          const defaultVoice = voices.find(voice => voice.lang.startsWith('en') && voice.localService) || voices[0];
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
  }, [selectedVoiceURI]);

  const handleSelect = useCallback((item: string) => {
    if (showWordPrediction && predictedWords.includes(item)) {
      const lastSpaceIndex = message.lastIndexOf(' ');
      const messageBase = lastSpaceIndex === -1 ? '' : message.substring(0, lastSpaceIndex + 1);
      setMessage(messageBase + item + ' ');
    } else if (item === '_') { // Corresponds to SPACE constant
      setMessage(prev => prev + ' ');
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
    if (isScanning && scanMode === 'one-switch') {
      scanInterval = window.setInterval(() => {
        setScanIndex(prev => (prev + 1) % scanItems.length);
      }, scanSpeed);
    }
    return () => clearInterval(scanInterval);
  }, [isScanning, scanMode, scanSpeed, scanItems.length]);

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
    <div className="flex flex-col h-screen bg-white text-black font-sans">
      {/* Settings Cog Icon - Top Right */}
      <button
        onClick={() => setShowSettingsModal(true)}
        className="fixed top-2 right-2 z-50 p-2 bg-gray-200 bg-opacity-70 hover:bg-opacity-100 rounded-full transition-all hover:scale-110"
        aria-label="Open Settings"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <main className="flex-grow flex flex-col p-4 md:p-8 space-y-4">
        <Display message={message} fontSize={messageFontSize} />
        <Scanner currentItem={scanItems[scanIndex] ?? ''} fontSize={scannerFontSize} />
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
        isScanning={isScanning}
        setIsScanning={setIsScanning}
        onSwitch1={handleSwitch1}
        onSwitch2={handleSwitch2}
        onClear={handleClear}
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
      />
    </div>
  );
};

export default App;