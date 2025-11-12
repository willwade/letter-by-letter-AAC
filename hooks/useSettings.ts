import { useState, useEffect } from 'react';
import type { ScanMode, ThemeName } from '../types';

/**
 * Custom hook to manage all app settings with localStorage persistence.
 * This consolidates ~20 settings state variables and their persistence logic.
 */
export function useSettings() {
  // Scanning settings
  const [scanMode, setScanMode] = useState<ScanMode>(() => {
    return (localStorage.getItem('scanMode') as ScanMode) || 'one-switch';
  });

  const [scanSpeed, setScanSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('scanSpeed');
    return saved ? Number(saved) : 1000;
  });

  const [firstItemDelay, setFirstItemDelay] = useState<number>(() => {
    const saved = localStorage.getItem('firstItemDelay');
    return saved ? Number(saved) : 1500;
  });

  const [holdSpeed, setHoldSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('holdSpeed');
    return saved ? Number(saved) : 100;
  });

  const [debounceTime, setDebounceTime] = useState<number>(() => {
    const saved = localStorage.getItem('debounceTime');
    return saved ? Number(saved) : 0;
  });

  // Prediction settings
  const [enablePrediction, setEnablePrediction] = useState<boolean>(() => {
    const saved = localStorage.getItem('enablePrediction');
    return saved !== null ? saved === 'true' : true;
  });

  const [showWordPrediction, setShowWordPrediction] = useState<boolean>(() => {
    return localStorage.getItem('showWordPrediction') === 'true';
  });

  // Appearance settings
  const [messageFontSize, setMessageFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('messageFontSize');
    return saved ? Number(saved) : 48;
  });

  const [scannerFontSize, setScannerFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('scannerFontSize');
    return saved ? Number(saved) : 300;
  });

  const [themeName, setThemeName] = useState<ThemeName>(() => {
    return (localStorage.getItem('theme') as ThemeName) || 'default';
  });

  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('fontFamily') || 'system-ui';
  });

  const [borderWidth, setBorderWidth] = useState<number>(() => {
    const saved = localStorage.getItem('borderWidth');
    return saved ? Number(saved) : 0;
  });

  // Audio settings
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
    return localStorage.getItem('selectedVoiceURI') || null;
  });

  const [audioEffectsEnabled, setAudioEffectsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('audioEffectsEnabled') === 'true';
  });

  // UI settings
  const [hideControlBar, setHideControlBar] = useState<boolean>(() => {
    return localStorage.getItem('hideControlBar') === 'true';
  });

  const [speakAfterPredictions, setSpeakAfterPredictions] = useState<boolean>(() => {
    return localStorage.getItem('speakAfterPredictions') === 'true';
  });

  // Hold action settings
  const [enableHoldActions, setEnableHoldActions] = useState<boolean>(() => {
    return localStorage.getItem('enableHoldActions') === 'true';
  });

  const [shortHoldDuration, setShortHoldDuration] = useState<number>(() => {
    const saved = localStorage.getItem('shortHoldDuration');
    return saved ? Number(saved) : 1000;
  });

  const [longHoldDuration, setLongHoldDuration] = useState<number>(() => {
    const saved = localStorage.getItem('longHoldDuration');
    return saved ? Number(saved) : 2000;
  });

  const [shortHoldAction, setShortHoldAction] = useState<string>(() => {
    return localStorage.getItem('shortHoldAction') || 'SPEAK';
  });

  const [longHoldAction, setLongHoldAction] = useState<string>(() => {
    return localStorage.getItem('longHoldAction') || 'CLEAR';
  });

  // Game mode settings
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

  // Language settings
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('selectedLanguage') || 'en';
  });

  const [selectedScript, setSelectedScript] = useState<string | null>(() => {
    return localStorage.getItem('selectedScript') || null;
  });

  const [useUppercase, setUseUppercase] = useState<boolean>(() => {
    return localStorage.getItem('useUppercase') === 'true';
  });

  // Persist all settings to localStorage
  // Using a single useEffect to batch all localStorage writes
  useEffect(() => {
    localStorage.setItem('scanMode', scanMode);
    localStorage.setItem('scanSpeed', scanSpeed.toString());
    localStorage.setItem('firstItemDelay', firstItemDelay.toString());
    localStorage.setItem('holdSpeed', holdSpeed.toString());
    localStorage.setItem('debounceTime', debounceTime.toString());
    localStorage.setItem('enablePrediction', enablePrediction.toString());
    localStorage.setItem('showWordPrediction', showWordPrediction.toString());
    localStorage.setItem('messageFontSize', messageFontSize.toString());
    localStorage.setItem('scannerFontSize', scannerFontSize.toString());
    localStorage.setItem('theme', themeName);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('borderWidth', borderWidth.toString());
    localStorage.setItem('audioEffectsEnabled', audioEffectsEnabled.toString());
    localStorage.setItem('hideControlBar', hideControlBar.toString());
    localStorage.setItem('speakAfterPredictions', speakAfterPredictions.toString());
    localStorage.setItem('enableHoldActions', enableHoldActions.toString());
    localStorage.setItem('shortHoldDuration', shortHoldDuration.toString());
    localStorage.setItem('longHoldDuration', longHoldDuration.toString());
    localStorage.setItem('shortHoldAction', shortHoldAction);
    localStorage.setItem('longHoldAction', longHoldAction);
    localStorage.setItem('gameMode', gameMode.toString());
    localStorage.setItem('gameWordList', JSON.stringify(gameWordList));
    localStorage.setItem('currentGameWordIndex', currentGameWordIndex.toString());
    localStorage.setItem('selectedLanguage', selectedLanguage);
    localStorage.setItem('useUppercase', useUppercase.toString());

    if (selectedVoiceURI) {
      localStorage.setItem('selectedVoiceURI', selectedVoiceURI);
    } else {
      localStorage.removeItem('selectedVoiceURI');
    }

    if (selectedScript) {
      localStorage.setItem('selectedScript', selectedScript);
    } else {
      localStorage.removeItem('selectedScript');
    }
  }, [
    scanMode,
    scanSpeed,
    firstItemDelay,
    holdSpeed,
    debounceTime,
    enablePrediction,
    showWordPrediction,
    messageFontSize,
    scannerFontSize,
    themeName,
    fontFamily,
    borderWidth,
    selectedVoiceURI,
    audioEffectsEnabled,
    hideControlBar,
    speakAfterPredictions,
    enableHoldActions,
    shortHoldDuration,
    longHoldDuration,
    shortHoldAction,
    longHoldAction,
    gameMode,
    gameWordList,
    currentGameWordIndex,
    selectedLanguage,
    selectedScript,
    useUppercase,
  ]);

  return {
    // Scanning settings
    scanMode,
    setScanMode,
    scanSpeed,
    setScanSpeed,
    firstItemDelay,
    setFirstItemDelay,
    holdSpeed,
    setHoldSpeed,
    debounceTime,
    setDebounceTime,

    // Prediction settings
    enablePrediction,
    setEnablePrediction,
    showWordPrediction,
    setShowWordPrediction,

    // Appearance settings
    messageFontSize,
    setMessageFontSize,
    scannerFontSize,
    setScannerFontSize,
    themeName,
    setThemeName,
    fontFamily,
    setFontFamily,
    borderWidth,
    setBorderWidth,

    // Audio settings
    selectedVoiceURI,
    setSelectedVoiceURI,
    audioEffectsEnabled,
    setAudioEffectsEnabled,

    // UI settings
    hideControlBar,
    setHideControlBar,
    speakAfterPredictions,
    setSpeakAfterPredictions,

    // Hold action settings
    enableHoldActions,
    setEnableHoldActions,
    shortHoldDuration,
    setShortHoldDuration,
    longHoldDuration,
    setLongHoldDuration,
    shortHoldAction,
    setShortHoldAction,
    longHoldAction,
    setLongHoldAction,

    // Game mode settings
    gameMode,
    setGameMode,
    gameWordList,
    setGameWordList,
    currentGameWordIndex,
    setCurrentGameWordIndex,

    // Language settings
    selectedLanguage,
    setSelectedLanguage,
    selectedScript,
    setSelectedScript,
    useUppercase,
    setUseUppercase,
  };
}

