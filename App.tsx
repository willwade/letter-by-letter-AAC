import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ALPHABET } from './constants';
import Display from './components/Display';
import Scanner from './components/Scanner';
import Controls from './components/Controls';
import { getUppercase, getLowercase, getScripts, getIndexData } from 'worldalphabets';
import { getTheme } from './themes';
import { resolveFontFamily } from './utils/fontMapping';
import { useSettings } from './hooks/useSettings';
import { usePrediction } from './hooks/usePrediction';
import { useScanning } from './hooks/useScanning';
import { useKeyboard } from './hooks/useKeyboard';
import { useAudio } from './hooks/useAudio';
import { useTTS } from './hooks/useTTS';
import { useAuditoryScanning } from './hooks/useAuditoryScanning';
import { useEdgeTTS } from './hooks/useEdgeTTS';
import { useSelectionLogic } from './hooks/useSelectionLogic';

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

  // MIGRATION: Audio handling now in useAudio hook!
  const { playSound, playBeep } = useAudio({
    enabled: settings.audioEffectsEnabled,
    volume: 0.3,
  });

  // MIGRATION: TTS handling now in useTTS hook!
  const { availableVoices, speak } = useTTS({
    selectedLanguage: settings.selectedLanguage,
    selectedVoiceURI: settings.selectedVoiceURI,
    setSelectedVoiceURI: settings.setSelectedVoiceURI,
  });

  // Auditory Scanning Hook (cue voice via meSpeak)
  // Pass user-controlled meSpeak pitch + rate so the cue voice is tunable and
  // honours a fixed WPM when the user has set one (replaces auto-from-scan-speed).
  const {
    playItem: playAuditoryItem,
    playMessage: playAuditoryMessage,
    addToCache: addAuditoryItemsToCache,
    availableDevices: auditoryDevices,
    requestAudioDeviceAccess,
    sinkStatus,
    applySinkIdWithGesture,
  } = useAuditoryScanning({
    enabled: settings.auditoryScanningEnabled,
    audioDeviceId: settings.auditoryScanningDeviceId,
    scanSpeed: settings.scanSpeed,
    pitch: settings.cueMespeakPitch,
    rate: settings.cueMespeakRate,
  });

  // Edge TTS hook (parallel to useAuditoryScanning). Used when either voice is
  // set to 'edge-tts' - shares the same audioDeviceId so output routing still
  // honours the Scan Output picker.
  const {
    availableVoices: edgeVoices,
    playItem: playEdgeItem,
    playMessage: playEdgeMessage,
  } = useEdgeTTS({
    enabled: settings.auditoryScanningEnabled,
    audioDeviceId: settings.auditoryScanningDeviceId,
  });

  // Use scanning hook (needs predictions to build scan items AND playSound)
  const {
    scanIndex,
    scanItems,
    isScanning,
    setIsScanning,
    setScanIndex,
    processSelection,
    scanItemsSpoken,
    currentItemSpoken,
  } = useScanning({
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
    // Pause auto-advance while the user is holding switch 1 to pick a hold zone,
    // so the item they want to commit to stays highlighted.
    pauseScanForHold: isHolding,
    playSound,
    scanningStrategy: settings.scanningStrategy,
    blockMode: settings.blockMode,
    blockSize: settings.blockSize,
  });

  // Update temp scan items when scanning hook updates them
  useEffect(() => {
    setTempScanItems(scanItems);
    // When scan items update, also update the auditory cache
    if (settings.auditoryScanningEnabled) {
      addAuditoryItemsToCache(scanItemsSpoken);
    }
  }, [scanItems, scanItemsSpoken, settings.auditoryScanningEnabled, addAuditoryItemsToCache]);

  // Voice-routing wrappers. The message bar and the cue can each use either
  // edge-tts (high-quality, routable, online) or meSpeak (offline, robotic).
  // The wrappers pick the right engine based on settings so the rest of the
  // app just calls one function. Defined early so multiple useEffects below
  // can consume them.
  const playMessageBarAudio = useCallback(
    async (text: string): Promise<void> => {
      if (settings.messageVoiceEngine === 'edge-tts') {
        await playEdgeMessage(text, {
          voice: settings.messageEdgeVoice,
          rate: settings.messageEdgeRate,
          pitch: settings.messageEdgePitch,
        });
      } else {
        await playAuditoryMessage(text, {
          pitch: settings.messageMespeakPitch,
          rate: settings.messageMespeakRate,
        });
      }
    },
    [
      settings.messageVoiceEngine,
      settings.messageEdgeVoice,
      settings.messageEdgeRate,
      settings.messageEdgePitch,
      settings.messageMespeakPitch,
      settings.messageMespeakRate,
      playEdgeMessage,
      playAuditoryMessage,
    ]
  );

  const playCueAudio = useCallback(
    (text: string) => {
      if (settings.cueVoiceEngine === 'edge-tts') {
        // Fire-and-forget - cues shouldn't block scanning.
        playEdgeItem(text, {
          voice: settings.cueEdgeVoice,
          rate: settings.cueEdgeRate,
          pitch: settings.cueEdgePitch,
        });
      } else {
        playAuditoryItem(text);
      }
    },
    [
      settings.cueVoiceEngine,
      settings.cueEdgeVoice,
      settings.cueEdgeRate,
      settings.cueEdgePitch,
      playEdgeItem,
      playAuditoryItem,
    ]
  );

  // Effect to play auditory scanning item when scan index changes
  useEffect(() => {
    if (isScanning && settings.auditoryScanningEnabled) {
      // Use currentItemSpoken from useScanning which handles block labels
      if (currentItemSpoken) {
        playCueAudio(currentItemSpoken);
      }
    }
  }, [
    scanIndex,
    isScanning,
    settings.auditoryScanningEnabled,
    currentItemSpoken,
    playCueAudio,
  ]);

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

  // MIGRATION: TTS voice loading now handled by useTTS hook!

  const { handleSelect: handleSelectionLogic, handleUndo, handleClear } = useSelectionLogic({
    message,
    setMessage,
    settings,
    predictedWords,
    currentGameTarget,
    predictor,
    playSound,
    speak,
    setLearnedWordsCount,
    setScanIndex,
  });

  const handleSelect = useCallback(
    (item: string) => {
      // Play select sound
      playSound('select');

      // Process selection through scanning hook (handles blocks vs items)
      const selection = processSelection(item);

      // If entering or exiting a block, we stop here (UI updates automatically)
      if (selection.action === 'enter-block' || selection.action === 'exit-block') {
        return;
      }

      // If nothing to do (shouldn't happen)
      if (selection.action === 'none') return;

      // Use the resolved value from the selection
      const selectedItem = selection.value || item;

      handleSelectionLogic(selectedItem);

      // Play auditory feedback for message if enabled
      if (settings.auditoryScanningEnabled) {
        // We use a small timeout to play message state after update
        setTimeout(() => {
          // This logic is mostly handled by the useEffect watching 'message' below,
          // but sometimes we want immediate confirmation?
          // The effect below handles it robustly.
        }, 0);
      }
    },
    [
      playSound,
      processSelection,
      handleSelectionLogic,
      settings.auditoryScanningEnabled,
    ]
  );

  // Effect to play auditory message when message changes via selection
  // We use a ref to track if the change was due to a selection vs internal reset
  // But actually, "reading out the message bar" usually happens on any change?
  // User said: "when a letter or word is selected ... read out ... the current message bar"
  // This implies Undo/Clear might not trigger it, or might?
  // Let's assume any *content* change triggers it.
  const prevMessageRef = React.useRef(message);
  const messagePlaybackIdRef = React.useRef(0);
  useEffect(() => {
    if (!settings.auditoryScanningEnabled || message === prevMessageRef.current) {
      prevMessageRef.current = message;
      return;
    }

    const playbackId = ++messagePlaybackIdRef.current;
    const wasScanning = isScanning;

    if (wasScanning) {
      setIsScanning(false);
    }

    const play = async () => {
      if (message.length > 0) {
        await playMessageBarAudio(message);
      }

      if (messagePlaybackIdRef.current === playbackId && wasScanning) {
        setIsScanning(true);
      }
    };

    play();
    prevMessageRef.current = message;
  }, [
    message,
    settings.auditoryScanningEnabled,
    playMessageBarAudio,
    isScanning,
    setIsScanning,
  ]);

  const handleClearWrapper = useCallback(() => {
    handleClear();
    setIsScanning(false);
  }, [handleClear, setIsScanning]);

  // Execute a hold action (SPEAK, UNDO, CLEAR, or RESTART)
  const executeHoldAction = useCallback(
    (action: string) => {
      console.log(`🎯 Executing hold action: ${action}, message: "${message}"`);
      switch (action) {
        case 'SPEAK':
          if (message) {
            console.log('🔊 Speaking message:', message);
            // Route through the message-bar voice wrapper so SPEAK honours the
            // user's chosen engine/voice/pitch/rate (Web Speech by default).
            void playMessageBarAudio(message);
          } else {
            console.log('⚠️ No message to speak');
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
    [message, playMessageBarAudio, handleUndo, handleClear, setIsScanning, setScanIndex]
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
      if (!isScanning) {
        // Start scanning so auditory cue plays on current item
        setIsScanning(true);
        return;
      }

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
    switch1Input: settings.switch1Input,
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
    playBeep,
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
        switch1Input={settings.switch1Input}
        setSwitch1Input={settings.setSwitch1Input}
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
        onClear={handleClearWrapper}
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
        auditoryScanningEnabled={settings.auditoryScanningEnabled}
        setAuditoryScanningEnabled={settings.setAuditoryScanningEnabled}
        auditoryScanningDeviceId={settings.auditoryScanningDeviceId}
        setAuditoryScanningDeviceId={(deviceId) => {
          applySinkIdWithGesture(deviceId);
          settings.setAuditoryScanningDeviceId(deviceId);
        }}
        auditoryDevices={auditoryDevices}
        onUnlockAudioDevices={requestAudioDeviceAccess}
        sinkStatus={sinkStatus}
        messageVoiceEngine={settings.messageVoiceEngine}
        setMessageVoiceEngine={settings.setMessageVoiceEngine}
        messageEdgeVoice={settings.messageEdgeVoice}
        setMessageEdgeVoice={settings.setMessageEdgeVoice}
        messageEdgeRate={settings.messageEdgeRate}
        setMessageEdgeRate={settings.setMessageEdgeRate}
        messageEdgePitch={settings.messageEdgePitch}
        setMessageEdgePitch={settings.setMessageEdgePitch}
        messageMespeakPitch={settings.messageMespeakPitch}
        setMessageMespeakPitch={settings.setMessageMespeakPitch}
        messageMespeakRate={settings.messageMespeakRate}
        setMessageMespeakRate={settings.setMessageMespeakRate}
        cueVoiceEngine={settings.cueVoiceEngine}
        setCueVoiceEngine={settings.setCueVoiceEngine}
        cueEdgeVoice={settings.cueEdgeVoice}
        setCueEdgeVoice={settings.setCueEdgeVoice}
        cueEdgeRate={settings.cueEdgeRate}
        setCueEdgeRate={settings.setCueEdgeRate}
        cueEdgePitch={settings.cueEdgePitch}
        setCueEdgePitch={settings.setCueEdgePitch}
        cueMespeakPitch={settings.cueMespeakPitch}
        setCueMespeakPitch={settings.setCueMespeakPitch}
        cueMespeakRate={settings.cueMespeakRate}
        setCueMespeakRate={settings.setCueMespeakRate}
        edgeVoices={edgeVoices}
        scanningStrategy={settings.scanningStrategy}
        setScanningStrategy={settings.setScanningStrategy}
        blockMode={settings.blockMode}
        setBlockMode={settings.setBlockMode}
        blockSize={settings.blockSize}
        setBlockSize={settings.setBlockSize}
      />
    </div>
  );
};

export default App;
