import { useState, useCallback, useRef } from 'react';
import type { ReactionTimeStats, SelectionTiming, InferenceResult } from '../types';

interface UseReactionTimeInferenceProps {
  stats: ReactionTimeStats | null;
  enableInference: boolean;
  confidenceThreshold: number;
  scanMode: 'one-switch' | 'two-switch';
  scanSpeed: number;
}

export function useReactionTimeInference({
  stats,
  enableInference,
  confidenceThreshold,
  scanMode,
  scanSpeed,
}: UseReactionTimeInferenceProps) {
  const [timings, setTimings] = useState<SelectionTiming[]>([]);
  const [currentInference, setCurrentInference] = useState<InferenceResult | null>(null);
  const itemStartTimeRef = useRef<number>(0);
  const lastSelectionTimeRef = useRef<number>(0);

  // Record when an item becomes current (scanning highlights it)
  const recordItemStart = useCallback(() => {
    itemStartTimeRef.current = performance.now();
  }, []);

  // Calculate 95% confidence interval
  const getConfidenceBounds = useCallback((): { lower: number; upper: number } | null => {
    if (!stats || stats.samples.length < 3) return null;

    const margin = 1.96 * (stats.stdDev / Math.sqrt(stats.samples.length));
    return {
      lower: stats.mean - margin,
      upper: stats.mean + margin,
    };
  }, [stats]);

  // Calculate recommended scan speed based on reaction time
  const getRecommendedScanSpeed = useCallback((): number | null => {
    if (!stats) return null;

    // Recommend scan speed that allows user to react within 80% of their mean reaction time
    // This gives them a comfortable buffer
    const targetSpeed = stats.mean * 0.8;

    // Round to nearest 100ms
    return Math.round(targetSpeed / 100) * 100;
  }, [stats]);

  // Check if current scan speed is appropriate
  const isScanSpeedAppropriate = useCallback((): boolean => {
    const recommended = getRecommendedScanSpeed();
    if (!recommended) return true;

    // Allow 20% tolerance
    const tolerance = recommended * 0.2;
    return Math.abs(scanSpeed - recommended) <= tolerance;
  }, [scanSpeed, getRecommendedScanSpeed]);

  // Calculate confidence based on dwell time
  const calculateConfidence = useCallback(
    (dwellTime: number, timeSinceLastSelection: number): number => {
      if (!stats) {
        return 0.5; // Neutral confidence without stats
      }

      const bounds = getConfidenceBounds();
      if (!bounds) {
        return 0.5;
      }

      // Very short dwell (< 50% of lower bound) -> Low confidence
      if (dwellTime < bounds.lower * 0.5) {
        return 0.3;
      }

      // Normal dwell (within bounds) -> High confidence
      if (dwellTime >= bounds.lower && dwellTime <= bounds.upper) {
        return 0.95;
      }

      // Slightly short (50%-100% of lower bound) -> Medium confidence
      if (dwellTime >= bounds.lower * 0.5 && dwellTime < bounds.lower) {
        return 0.7;
      }

      // Long dwell (> 150% of upper bound) -> Medium confidence, might have hesitated
      if (dwellTime > bounds.upper * 1.5) {
        return 0.6;
      }

      // Slightly long (100%-150% of upper bound) -> Good confidence
      return 0.85;
    },
    [stats, getConfidenceBounds]
  );

  // Get adjacent items (potential alternatives if confidence is low)
  const getAdjacentAlternatives = useCallback(
    (scanItems: string[], currentIndex: number): Array<{ item: string; probability: number }> => {
      const alternatives: Array<{ item: string; probability: number }> = [];
      const numItems = scanItems.length;

      // Previous item
      const prevIndex = (currentIndex - 1 + numItems) % numItems;
      alternatives.push({ item: scanItems[prevIndex], probability: 0.3 });

      // Next item
      const nextIndex = (currentIndex + 1) % numItems;
      alternatives.push({ item: scanItems[nextIndex], probability: 0.2 });

      // Two items before
      const prev2Index = (currentIndex - 2 + numItems) % numItems;
      alternatives.push({ item: scanItems[prev2Index], probability: 0.1 });

      return alternatives;
    },
    []
  );

  // Record selection timing
  const recordSelection = useCallback(
    (itemIndex: number, item: string, scanItems: string[]): InferenceResult => {
      if (!enableInference) {
        setCurrentInference({ confidence: 1.0, alternatives: [] });
        return { confidence: 1.0, alternatives: [] };
      }

      const now = performance.now();
      const dwellTime = now - itemStartTimeRef.current;
      const timeSinceLastSelection = lastSelectionTimeRef.current ? now - lastSelectionTimeRef.current : 0;

      // Store timing
      const timing: SelectionTiming = {
        itemIndex,
        item,
        timestamp: now,
        dwellTime,
        timeSinceLastSelection,
      };

      setTimings((prev) => [...prev.slice(-9), timing]); // Keep last 10 timings
      lastSelectionTimeRef.current = now;

      // Calculate confidence
      const confidence = calculateConfidence(dwellTime, timeSinceLastSelection);

      // Generate alternatives if confidence is low
      let alternatives: Array<{ item: string; probability: number }> = [];
      if (confidence < confidenceThreshold) {
        alternatives = getAdjacentAlternatives(scanItems, itemIndex);
      }

      const result: InferenceResult = {
        intendedItem: confidence >= confidenceThreshold ? item : undefined,
        confidence,
        alternatives,
      };

      setCurrentInference(result);
      return result;
    },
    [enableInference, calculateConfidence, getAdjacentAlternatives, confidenceThreshold]
  );

  // Reset timing state
  const resetTimings = useCallback(() => {
    setTimings([]);
    setCurrentInference(null);
    lastSelectionTimeRef.current = 0;
  }, []);

  return {
    recordItemStart,
    recordSelection,
    currentInference,
    getConfidenceBounds,
    getRecommendedScanSpeed,
    isScanSpeedAppropriate,
    resetTimings,
  };
}
