import { useState, useCallback, useEffect, useRef } from 'react';
import { SPECIAL_ACTIONS, SPEAK, SPACE, UNDO, CLEAR, BACK } from '../constants';
import { ScanningStrategy, BlockMode, ErrorCorrectionSuggestion } from '../types';
import { generateBlocks, Block } from '../utils/layoutEngine';

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
  scanningStrategy: ScanningStrategy;
  blockMode: BlockMode;
  blockSize: number;
  // Error correction props
  suggestions?: ErrorCorrectionSuggestion[];
  showSuggestions?: boolean;
  // Timing tracking callback
  onItemChange?: (itemIndex: number) => void;
}

interface SelectionResult {
  action: 'select' | 'enter-block' | 'exit-block' | 'none' | 'apply-suggestion' | 'dismiss-suggestions';
  value?: string;
  suggestionIndex?: number;
}

interface UseScanningReturn {
  scanIndex: number;
  scanItems: string[];
  scanItemsSpoken: string[];
  isScanning: boolean;
  currentItem: string;
  setIsScanning: (value: boolean) => void;
  setScanIndex: (value: number | ((prev: number) => number)) => void;
  advanceScan: () => void;
  resetScan: () => void;
  processSelection: (item: string) => SelectionResult;
  scanStage: 'blocks' | 'items';
  currentItemSpoken: string;
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
  scanningStrategy,
  blockMode,
  blockSize,
  suggestions = [],
  showSuggestions = false,
  onItemChange,
}: UseScanningProps): UseScanningReturn {
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [scanItems, setScanItems] = useState<string[]>([...alphabet]);
  const [scanItemsSpoken, setScanItemsSpoken] = useState<string[]>([...alphabet]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Block scanning state
  const [scanStage, setScanStage] = useState<'blocks' | 'items'>('blocks');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  const pendingScanIndexRef = useRef<number | null>(null);

  // Reset stage when message changes (context change)
  // This ensures we go back to blocks when a letter is typed
  useEffect(() => {
    setScanStage('blocks');
    setScanIndex(0);
    setActiveBlockIndex(0);
  }, [message]);

  // Build scan items based on current state
  useEffect(() => {
    // If game mode is on, force linear strategy for now
    const effectiveStrategy = gameMode ? 'linear' : scanningStrategy;

    if (effectiveStrategy === 'linear') {
      const newScanItems: string[] = [];
      const predictionEnabledAndReady = enablePrediction && predictor;

      // Add error correction suggestions at the start if available
      // Prefix with "ec:" to identify them as error correction items
      if (showSuggestions && suggestions.length > 0) {
        suggestions.forEach((suggestion, index) => {
          newScanItems.push(`ec-suggestion-${index}`);
        });
        // Removed "ec-dismiss" - suggestions auto-dismiss on any selection
      }

      // Game Mode logic (simplified for brevity, matching original)
      if (gameMode && currentGameTarget) {
        if (predictionEnabledAndReady && showWordPrediction && predictedWords.length > 0)
          newScanItems.push(...predictedWords);
        if (predictionEnabledAndReady && predictedLetters.length > 0)
          newScanItems.push(...predictedLetters);
        if (predictionEnabledAndReady && speakAfterPredictions && message.length > 1)
          newScanItems.push(SPEAK);
        newScanItems.push(...alphabet);
        if (currentGameTarget[message.length] === ' ') newScanItems.push(SPACE);
        if (message.length > 0) {
          if (predictionEnabledAndReady && speakAfterPredictions) {
            newScanItems.push(SPACE, UNDO, CLEAR);
          } else {
            newScanItems.push(...SPECIAL_ACTIONS);
          }
        }
      } else if (!predictionEnabledAndReady) {
        newScanItems.push(...alphabet);
        if (message.length > 0) newScanItems.push(...SPECIAL_ACTIONS);
      } else {
        // Prediction enabled
        if (showWordPrediction && predictedWords.length > 0) newScanItems.push(...predictedWords);
        if (predictedLetters.length > 0) newScanItems.push(...predictedLetters);
        if (speakAfterPredictions && message.length > 1) newScanItems.push(SPEAK);
        newScanItems.push(...alphabet);
        if (message.length > 0) {
          if (speakAfterPredictions) {
            newScanItems.push(SPACE, UNDO, CLEAR);
          } else {
            newScanItems.push(...SPECIAL_ACTIONS);
          }
        }
      }

      setScanItems(newScanItems);
      // For linear, spoken items are mostly same as display items, with some exceptions
      setScanItemsSpoken(
        newScanItems.map((item) => {
          // Handle error correction items
          if (item.startsWith('ec-suggestion-')) {
            const index = parseInt(item.split('-')[2], 10);
            return suggestions[index]?.text || item;
          }

          if (item === '_') return 'Space';
          if (item === SPEAK) return 'Speak';
          if (item === UNDO) return 'Undo';
          if (item === CLEAR) return 'Clear';
          return item;
        })
      );
      setScanIndex(0);
    } else {
      // BLOCK STRATEGY
      const generatedBlocks = generateBlocks({
        mode: blockMode,
        blockSize,
        alphabet,
        predictedWords,
        predictedLetters,
      });
      setBlocks(generatedBlocks);

      if (scanStage === 'blocks') {
        setScanItems(generatedBlocks.map((b) => b.label));
        setScanItemsSpoken(generatedBlocks.map((b) => b.spokenLabel));
      } else {
        // Items stage
        const block = generatedBlocks[activeBlockIndex];
        if (block) {
          // Add error correction suggestions at the start of items
          const itemsWithSuggestions = [...block.items];
          const spokenItemsWithSuggestions = block.items.map((item) => {
            if (item === '_') return 'Space';
            if (item === SPEAK) return 'Speak';
            if (item === UNDO) return 'Undo';
            if (item === CLEAR) return 'Clear';
            return item;
          });

          if (showSuggestions && suggestions.length > 0) {
            suggestions.forEach((suggestion, index) => {
              itemsWithSuggestions.unshift(`ec-suggestion-${index}`);
              spokenItemsWithSuggestions.unshift(suggestion.text);
            });
          }

          setScanItems([...itemsWithSuggestions, BACK]);
          setScanItemsSpoken([...spokenItemsWithSuggestions, 'Go Back']);
        } else {
          // Fallback if index invalid (e.g. config changed)
          setScanStage('blocks');
          setScanItems(generatedBlocks.map((b) => b.label));
          setScanItemsSpoken(generatedBlocks.map((b) => b.spokenLabel));
        }
      }

      // Handle scan index restoration or reset
      if (pendingScanIndexRef.current !== null) {
        setScanIndex(pendingScanIndexRef.current);
        pendingScanIndexRef.current = null;
      } else {
        setScanIndex(0);
      }
    }
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
    scanningStrategy,
    blockMode,
    blockSize,
    scanStage,
    activeBlockIndex,
    suggestions,
    showSuggestions,
  ]);

  // Auto-advance scanning interval
  useEffect(() => {
    let scanInterval: number | undefined;

    if (isScanning && scanMode === 'one-switch' && !showSettingsModal) {
      const isFirstItem = scanIndex === 0;
      const delay = isFirstItem ? firstItemDelay : scanSpeed;

      scanInterval = window.setInterval(() => {
        setScanIndex((prev: number) => {
          playSound('click');
          return (prev + 1) % scanItems.length;
        });
      }, delay);
    }

    return () => {
      clearInterval(scanInterval);
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

  // Track scan index changes for timing
  useEffect(() => {
    if (onItemChange && scanIndex >= 0) {
      onItemChange(scanIndex);
    }
  }, [scanIndex, onItemChange]);

  const currentItem = scanItems[scanIndex] ?? '';

  // Determine the spoken representation of the current item
  let currentItemSpoken = currentItem;
  if (!gameMode && scanningStrategy === 'block' && scanStage === 'blocks') {
    const block = blocks[scanIndex];
    // If scanning blocks, use the spoken label (e.g. "A, B, C, D" instead of "A-D")
    if (block) {
      currentItemSpoken = block.spokenLabel;
    }
  } else if (currentItem === BACK) {
    currentItemSpoken = 'Go Back';
  } else if (currentItem === '_') {
    currentItemSpoken = 'Space';
  }

  const advanceScan = useCallback(() => {
    setScanIndex((prev: number) => (prev + 1) % scanItems.length);
  }, [scanItems.length]);

  const resetScan = useCallback(() => {
    setScanStage('blocks');
    setScanIndex(0);
    setActiveBlockIndex(0);
  }, []);

  const processSelection = useCallback(
    (item: string): SelectionResult => {
      const effectiveStrategy = gameMode ? 'linear' : scanningStrategy;

      if (effectiveStrategy === 'linear') {
        // Handle error correction actions
        if (item.startsWith('ec-suggestion-')) {
          const index = parseInt(item.split('-')[2], 10);
          return { action: 'apply-suggestion', suggestionIndex: index };
        }

        return { action: 'select', value: item };
      }

      // Block Strategy
      if (scanStage === 'blocks') {
        // Find block by label
        const index = blocks.findIndex((b) => b.label === item);
        if (index !== -1) {
          setActiveBlockIndex(index);
          setScanStage('items');
          // Scan index will be reset to 0 by useEffect
          return { action: 'enter-block' };
        }
        // Should not happen unless item doesn't match
        return { action: 'none' };
      } else {
        // Items stage
        if (item === BACK) {
          setScanStage('blocks');
          pendingScanIndexRef.current = activeBlockIndex;
          // Scan index will be restored by useEffect
          return { action: 'exit-block' };
        }

        // Selected a real item
        // We reset to blocks stage after selection
        setScanStage('blocks');
        setScanIndex(0);
        return { action: 'select', value: item };
      }
    },
    [gameMode, scanningStrategy, scanStage, blocks, activeBlockIndex]
  );

  return {
    scanIndex,
    scanItems,
    isScanning,
    currentItem,
    setIsScanning,
    setScanIndex,
    advanceScan,
    resetScan,
    processSelection,
    scanStage,
    currentItemSpoken,
    scanItemsSpoken,
  };
}
