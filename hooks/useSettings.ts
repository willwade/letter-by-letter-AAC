import { useState, useEffect } from 'react';
import type { ScanMode, ThemeName, ScanningStrategy, BlockMode, Switch1Input, TTSEngine } from '../types';

/**
 * Custom hook to manage all app settings with localStorage persistence.
 * This consolidates ~20 settings state variables and their persistence logic.
 */
export function useSettings() {
  // Scanning settings
  const [scanMode, setScanMode] = useState<ScanMode>(() => {
    return (localStorage.getItem('scanMode') as ScanMode) || 'one-switch';
  });

  const [switch1Input, setSwitch1Input] = useState<Switch1Input>(() => {
    return (localStorage.getItem('switch1Input') as Switch1Input) || 'space';
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

  // Block Scanning settings
  const [scanningStrategy, setScanningStrategy] = useState<ScanningStrategy>(() => {
    return (localStorage.getItem('scanningStrategy') as ScanningStrategy) || 'linear';
  });

  const [blockMode, setBlockMode] = useState<BlockMode>(() => {
    return (localStorage.getItem('blockMode') as BlockMode) || 'hybrid';
  });

  const [blockSize, setBlockSize] = useState<number>(() => {
    const saved = localStorage.getItem('blockSize');
    return saved ? Number(saved) : 5;
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

  // Auditory Scanning settings
  const [auditoryScanningEnabled, setAuditoryScanningEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auditoryScanningEnabled') === 'true';
  });

  const [auditoryScanningDeviceId, setAuditoryScanningDeviceId] = useState<string | null>(() => {
    return localStorage.getItem('auditoryScanningDeviceId') || null;
  });

  // Message bar voice settings (what reads out the composed message)
  // Defaults to edge-tts (high-quality, routable via AudioContext) so the message
  // bar sounds different from meSpeak cues AND honours the Scan Output device.
  // Migrate any pre-existing webspeech default to edge-tts.
  const [messageVoiceEngine, setMessageVoiceEngine] = useState<TTSEngine>(() => {
    const saved = localStorage.getItem('messageVoiceEngine');
    if (!saved) return 'edge-tts';
    // Migrate pre-existing webspeech setting (no longer a valid engine).
    if (saved === 'webspeech') return 'edge-tts';
    return saved as TTSEngine;
  });
  const [messageEdgeVoice, setMessageEdgeVoice] = useState<string>(() => {
    return localStorage.getItem('messageEdgeVoice') || 'en-US-EmmaMultilingualNeural';
  });
  // edge-tts rate/pitch are signed-percent / signed-Hz strings. We store the
  // numeric slider value and format on use.
  const [messageEdgeRate, setMessageEdgeRate] = useState<number>(() => {
    const saved = localStorage.getItem('messageEdgeRate');
    return saved ? Number(saved) : 0;
  });
  const [messageEdgePitch, setMessageEdgePitch] = useState<number>(() => {
    const saved = localStorage.getItem('messageEdgePitch');
    return saved ? Number(saved) : 0;
  });
  const [messageMespeakPitch, setMessageMespeakPitch] = useState<number>(() => {
    const saved = localStorage.getItem('messageMespeakPitch');
    return saved ? Number(saved) : 50;
  });
  const [messageMespeakRate, setMessageMespeakRate] = useState<number>(() => {
    const saved = localStorage.getItem('messageMespeakRate');
    return saved ? Number(saved) : 175;
  });

  // Cue voice settings (what reads each scanned item)
  // Defaults to meSpeak (offline, low-latency) so cues sound different from the
  // edge-tts message bar. Migrate any pre-existing webspeech default to mespeak.
  const [cueVoiceEngine, setCueVoiceEngine] = useState<TTSEngine>(() => {
    const saved = localStorage.getItem('cueVoiceEngine');
    if (!saved) return 'mespeak';
    if (saved === 'webspeech') return 'mespeak';
    return saved as TTSEngine;
  });
  const [cueEdgeVoice, setCueEdgeVoice] = useState<string>(() => {
    return localStorage.getItem('cueEdgeVoice') || 'en-US-EmmaMultilingualNeural';
  });
  const [cueEdgeRate, setCueEdgeRate] = useState<number>(() => {
    const saved = localStorage.getItem('cueEdgeRate');
    return saved ? Number(saved) : 0;
  });
  const [cueEdgePitch, setCueEdgePitch] = useState<number>(() => {
    const saved = localStorage.getItem('cueEdgePitch');
    return saved ? Number(saved) : 0;
  });
  const [cueMespeakPitch, setCueMespeakPitch] = useState<number>(() => {
    const saved = localStorage.getItem('cueMespeakPitch');
    return saved ? Number(saved) : 50;
  });
  // Replaces the previous auto-rate-from-scan-speed logic with a user-fixed WPM.
  const [cueMespeakRate, setCueMespeakRate] = useState<number>(() => {
    const saved = localStorage.getItem('cueMespeakRate');
    return saved ? Number(saved) : 175;
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
    localStorage.setItem('switch1Input', switch1Input);
    localStorage.setItem('scanSpeed', scanSpeed.toString());
    localStorage.setItem('firstItemDelay', firstItemDelay.toString());
    localStorage.setItem('holdSpeed', holdSpeed.toString());
    localStorage.setItem('debounceTime', debounceTime.toString());
    localStorage.setItem('scanningStrategy', scanningStrategy);
    localStorage.setItem('blockMode', blockMode);
    localStorage.setItem('blockSize', blockSize.toString());
    localStorage.setItem('enablePrediction', enablePrediction.toString());
    localStorage.setItem('showWordPrediction', showWordPrediction.toString());
    localStorage.setItem('messageFontSize', messageFontSize.toString());
    localStorage.setItem('scannerFontSize', scannerFontSize.toString());
    localStorage.setItem('theme', themeName);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('borderWidth', borderWidth.toString());
    localStorage.setItem('audioEffectsEnabled', audioEffectsEnabled.toString());
    localStorage.setItem('auditoryScanningEnabled', auditoryScanningEnabled.toString());
    localStorage.setItem('messageVoiceEngine', messageVoiceEngine);
    localStorage.setItem('messageEdgeVoice', messageEdgeVoice);
    localStorage.setItem('messageEdgeRate', messageEdgeRate.toString());
    localStorage.setItem('messageEdgePitch', messageEdgePitch.toString());
    localStorage.setItem('messageMespeakPitch', messageMespeakPitch.toString());
    localStorage.setItem('messageMespeakRate', messageMespeakRate.toString());
    localStorage.setItem('cueVoiceEngine', cueVoiceEngine);
    localStorage.setItem('cueEdgeVoice', cueEdgeVoice);
    localStorage.setItem('cueEdgeRate', cueEdgeRate.toString());
    localStorage.setItem('cueEdgePitch', cueEdgePitch.toString());
    localStorage.setItem('cueMespeakPitch', cueMespeakPitch.toString());
    localStorage.setItem('cueMespeakRate', cueMespeakRate.toString());
    if (auditoryScanningDeviceId) {
      localStorage.setItem('auditoryScanningDeviceId', auditoryScanningDeviceId);
    } else {
      localStorage.removeItem('auditoryScanningDeviceId');
    }
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
    switch1Input,
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
    auditoryScanningEnabled,
    auditoryScanningDeviceId,
    messageVoiceEngine,
    messageEdgeVoice,
    messageEdgeRate,
    messageEdgePitch,
    messageMespeakPitch,
    messageMespeakRate,
    cueVoiceEngine,
    cueEdgeVoice,
    cueEdgeRate,
    cueEdgePitch,
    cueMespeakPitch,
    cueMespeakRate,
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
    switch1Input,
    setSwitch1Input,
    scanSpeed,
    setScanSpeed,
    firstItemDelay,
    setFirstItemDelay,
    holdSpeed,
    setHoldSpeed,
    debounceTime,
    setDebounceTime,

    // Block Scanning settings
    scanningStrategy,
    setScanningStrategy,
    blockMode,
    setBlockMode,
    blockSize,
    setBlockSize,

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

    // Auditory Scanning settings
    auditoryScanningEnabled,
    setAuditoryScanningEnabled,
    auditoryScanningDeviceId,
    setAuditoryScanningDeviceId,

    // Message bar voice settings
    messageVoiceEngine,
    setMessageVoiceEngine,
    messageEdgeVoice,
    setMessageEdgeVoice,
    messageEdgeRate,
    setMessageEdgeRate,
    messageEdgePitch,
    setMessageEdgePitch,
    messageMespeakPitch,
    setMessageMespeakPitch,
    messageMespeakRate,
    setMessageMespeakRate,

    // Cue voice settings
    cueVoiceEngine,
    setCueVoiceEngine,
    cueEdgeVoice,
    setCueEdgeVoice,
    cueEdgeRate,
    setCueEdgeRate,
    cueEdgePitch,
    setCueEdgePitch,
    cueMespeakPitch,
    setCueMespeakPitch,
    cueMespeakRate,
    setCueMespeakRate,

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
