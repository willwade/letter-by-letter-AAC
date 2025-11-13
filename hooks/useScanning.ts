import { useState, useCallback, useEffect } from 'react';
import { SPECIAL_ACTIONS, SPEAK, SPACE, UNDO, CLEAR } from '../constants';

interface UseScanningProps {
  alphabet: string[];
  message: string;
  predictedLetters: string[];
  predictedWords: string[];
  enablePrediction: boolean;
  predictor: unknown | null; // The predictor instance (for checking if ready)
  showWordPrediction: boolean;
  speakAfterPredictions: boolean;
  gameMode: boolean;
  currentGameTarget: string;
  scanMode: 'one-switch' | 'two-switch' | 'auto-scan';
  scanSpeed: number;
  firstItemDelay: number;
  showSettingsModal: boolean;
  playSound: (sound: 'click' | 'beep') => void;
}

interface UseScanningReturn {
  scanIndex: number;
  scanItems: string[];
  isScanning: boolean;
  currentItem: string;
  setIsScanning: (value: boolean) => void;
  setScanIndex: (value: number | ((prev: number) => number)) => void;
  advanceScan: () => void;
  resetScan: () => void;
}

export function useScanning({
  alphabet,
  message,
  predictedLetters,
  predictedWords,
  enablePrediction,
  predictor,
  showWordPrediction,
  speakAfterPredictions,
  gameMode,
  currentGameTarget,
  scanMode,
  scanSpeed,
  firstItemDelay,
  showSettingsModal,
  playSound,
}: UseScanningProps): UseScanningReturn {
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [scanItems, setScanItems] = useState<string[]>([...alphabet]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Build scan items based on current state
  useEffect(() => {
    const newScanItems: string[] = [];

    const predictionEnabledAndReady = enablePrediction && predictor;

    // Game Mode: show predictions (if enabled) and full alphabet, but only next correct letter is selectable
    if (gameMode && currentGameTarget) {
      // Include predicted words at the start if prediction is enabled
      if (predictionEnabledAndReady && showWordPrediction && predictedWords.length > 0) {
        newScanItems.push(...predictedWords);
      }

      // Include predicted letters if prediction is enabled
      if (predictionEnabledAndReady && predictedLetters.length > 0) {
        newScanItems.push(...predictedLetters);
      }

      // Conditionally add SPEAK after predictions if setting is enabled
      if (predictionEnabledAndReady && speakAfterPredictions && message.length > 1) {
        newScanItems.push(SPEAK);
      }

      // Include full alphabet
      newScanItems.push(...alphabet);

      // If next character is a space, include SPACE action
      const nextChar = currentGameTarget[message.length];
      if (nextChar === ' ') {
        newScanItems.push(SPACE);
      }

      // Always include actions at the end
      if (message.length > 0) {
        // If SPEAK is after predictions, exclude it from SPECIAL_ACTIONS here
        if (predictionEnabledAndReady && speakAfterPredictions) {
          newScanItems.push(SPACE, UNDO, CLEAR);
        } else {
          newScanItems.push(...SPECIAL_ACTIONS);
        }
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
      console.log('📋 Building scan items with predictions:', {
        predictedWords: predictedWords.length,
        predictedLetters: predictedLetters.length,
        letters: predictedLetters,
      });

      // Include predicted words at the start
      if (showWordPrediction && predictedWords.length > 0) {
        newScanItems.push(...predictedWords);
      }

      // Include predicted letters
      if (predictedLetters.length > 0) {
        newScanItems.push(...predictedLetters);
      }

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
    currentGameTarget,
    speakAfterPredictions,
  ]);

  // Auto-advance scanning interval for one-switch mode
  useEffect(() => {
    let scanInterval: number | undefined;
    let initialTimeout: number | undefined;

    // Pause scanning when settings modal is open
    if (isScanning && scanMode === 'one-switch' && !showSettingsModal) {
      // Use longer delay for first item (index 0), normal speed for others
      const isFirstItem = scanIndex === 0;
      const delay = isFirstItem ? firstItemDelay : scanSpeed;

      scanInterval = window.setInterval(() => {
        setScanIndex((prev: number) => {
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
  }, [
    isScanning,
    scanMode,
    scanSpeed,
    scanItems.length,
    scanIndex,
    firstItemDelay,
    playSound,
    showSettingsModal,
  ]);

  // Get current item being scanned
  const currentItem = scanItems[scanIndex] ?? '';

  // Advance to next scan item
  const advanceScan = useCallback(() => {
    setScanIndex((prev: number) => (prev + 1) % scanItems.length);
  }, [scanItems.length]);

  // Reset scan to beginning
  const resetScan = useCallback(() => {
    setScanIndex(0);
  }, []);

  return {
    scanIndex,
    scanItems,
    isScanning,
    currentItem,
    setIsScanning,
    setScanIndex,
    advanceScan,
    resetScan,
  };
}
