import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanning } from '../useScanning';
import { SPACE, UNDO, CLEAR, SPEAK, BACK } from '../../constants';

const ALPHABET = 'ABCD'.split(''); // Larger alphabet to test range labels

const defaultProps = {
  alphabet: ALPHABET,
  message: '',
  predictedLetters: [],
  predictedWords: [],
  enablePrediction: false,
  predictor: null,
  showWordPrediction: false,
  speakAfterPredictions: false,
  gameMode: false,
  currentGameTarget: '',
  scanMode: 'one-switch' as const,
  scanSpeed: 1000,
  firstItemDelay: 1000,
  showSettingsModal: false,
  pauseScanForHold: false,
  playSound: vi.fn(),
  scanningStrategy: 'linear' as const,
  blockMode: 'static' as const,
  blockSize: 3, // Block 1: A-C, Block 2: D, Block 3: Actions
};

describe('useScanning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Linear Strategy', () => {
    it('initializes with alphabet and actions', () => {
      const { result } = renderHook(() => useScanning({ ...defaultProps, message: 'A' }));

      // A, B, C, D, SPACE, SPEAK, UNDO, CLEAR
      expect(result.current.scanItems).toEqual(['A', 'B', 'C', 'D', SPACE, SPEAK, UNDO, CLEAR]);
    });

    it('advances scan index', () => {
      const { result } = renderHook(() => useScanning(defaultProps));

      act(() => {
        result.current.advanceScan();
      });

      expect(result.current.scanIndex).toBe(1);
      expect(result.current.currentItem).toBe('B');
    });

    it('processes selection directly', () => {
      const { result } = renderHook(() => useScanning(defaultProps));

      const selection = result.current.processSelection('A');

      expect(selection).toEqual({ action: 'select', value: 'A' });
    });
  });

  describe('Block Strategy', () => {
    const blockProps = {
      ...defaultProps,
      scanningStrategy: 'block' as const,
      blockSize: 3,
    };

    it('initializes in blocks stage with block labels', () => {
      const { result } = renderHook(() => useScanning(blockProps));

      // A-C (range because len=3), D, Actions
      expect(result.current.scanStage).toBe('blocks');
      expect(result.current.scanItems).toEqual(['A - C', 'D', 'Actions']);
    });

    it('enters a block on selection', () => {
      const { result } = renderHook(() => useScanning(blockProps));

      // Select first block "A - C"
      let selection;
      act(() => {
         selection = result.current.processSelection('A - C');
      });

      expect(selection).toEqual({ action: 'enter-block' });
      expect(result.current.scanStage).toBe('items');

      // Items: A, B, C, BACK
      expect(result.current.scanItems).toEqual(['A', 'B', 'C', BACK]);
    });

    it('selects an item and returns to blocks', () => {
      const { result } = renderHook(() => useScanning(blockProps));

      // Enter block
      act(() => {
        result.current.processSelection('A - C');
      });

      // Select 'A'
      let selection;
      act(() => {
        selection = result.current.processSelection('A');
      });

      expect(selection).toEqual({ action: 'select', value: 'A' });
      // Logic sets stage back to blocks immediately
      expect(result.current.scanStage).toBe('blocks');
      expect(result.current.scanItems).toEqual(['A - C', 'D', 'Actions']);
      expect(result.current.scanIndex).toBe(0);
    });

    it('handles BACK action', () => {
      const { result } = renderHook(() => useScanning(blockProps));

      // Enter block
      act(() => {
        result.current.processSelection('A - C');
      });

      // Select BACK
      let selection;
      act(() => {
        selection = result.current.processSelection(BACK);
      });

      expect(selection).toEqual({ action: 'exit-block' });
      expect(result.current.scanStage).toBe('blocks');
    });
  });
});
