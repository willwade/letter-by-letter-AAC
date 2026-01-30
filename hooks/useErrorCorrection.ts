import { useState, useEffect, useCallback, useRef } from 'react';
import type { Predictor } from '@willwade/ppmpredictor';
import type { ErrorCorrectionSuggestion } from '../types';

interface UseErrorCorrectionProps {
  predictor: Predictor | null;
  message: string;
  lastSelected: string;
  enableCorrection: boolean;
  threshold: number;
  scanItems: string[];
}

export function useErrorCorrection({
  predictor,
  message,
  lastSelected,
  enableCorrection,
  threshold,
  scanItems,
}: UseErrorCorrectionProps) {
  const [suggestions, setSuggestions] = useState<ErrorCorrectionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Track recently rejected/applied suggestions to avoid re-offering
  const recentSuggestionsRef = useRef<Set<string>>(new Set());

  // Calculate Levenshtein edit distance
  const levenshteinDistance = useCallback((str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }, []);

  // Calculate similarity score (0-1, higher is better)
  const calculateSimilarity = useCallback(
    (str1: string, str2: string): number => {
      const maxLen = Math.max(str1.length, str2.length);
      if (maxLen === 0) return 1.0;
      const distance = levenshteinDistance(str1, str2);
      return 1.0 - distance / maxLen;
    },
    [levenshteinDistance]
  );

  // Build keyboard adjacency map from scan items
  const buildAdjacencyMap = useCallback((items: string[]): Map<string, string[]> => {
    const map = new Map<string, string[]>();

    // Filter out special items (error correction items with 'ec-' prefix)
    // Include all other items including SPACE ('_'), letters, and special actions
    const scanableItems = items.filter((item) => !item.startsWith('ec-'));

    for (let i = 0; i < scanableItems.length; i++) {
      const item = scanableItems[i];
      const neighbors: string[] = [];

      // Previous item in scan order
      if (i > 0) {
        neighbors.push(scanableItems[i - 1]);
      }
      // Next item in scan order
      if (i < scanableItems.length - 1) {
        neighbors.push(scanableItems[i + 1]);
      }

      map.set(item, neighbors);
    }

    return map;
  }, []);

  // Check for adjacent key errors
  const checkAdjacentErrors = useCallback(
    (originalMessage: string, adjacencyMap: Map<string, string[]>): string[] => {
      if (originalMessage.length === 0) return [];

      const lastChar = originalMessage[originalMessage.length - 1].toLowerCase();
      const corrections: string[] = [];

      // Check if last character has adjacent neighbors
      const neighbors = adjacencyMap.get(lastChar);
      if (neighbors && neighbors.length > 0) {
        for (const neighbor of neighbors) {
          const corrected =
            originalMessage.slice(0, -1) + (originalMessage[0] === originalMessage[0].toUpperCase() ? neighbor.toUpperCase() : neighbor);
          corrections.push(corrected);
        }
      }

      return corrections;
    },
    []
  );

  // Helper function to safely get predictions from predictor
  const getPredictions = useCallback((context: string, count: number): string[] => {
    if (!predictor) return [];

    try {
      // Try different method names that might exist
      if (typeof predictor.getNextPredictions === 'function') {
        return predictor.getNextPredictions(context, count);
      } else if (typeof predictor.predict === 'function') {
        const result = predictor.predict(context);
        return Array.isArray(result) ? result.slice(0, count) : [];
      } else if (typeof predictor.getPredictions === 'function') {
        return predictor.getPredictions(context, count);
      }
    } catch (error) {
      console.warn('Error getting predictions from PPM:', error);
    }

    return [];
  }, [predictor]);

  // Fuzzy matching using PPM predictor
  const useFuzzyMatching = useCallback(
    (currentMessage: string): string[] => {
      if (!predictor) return [];

      const matches: string[] = [];
      const contextWords = currentMessage.split(' ').filter((w) => w.length > 0);

      if (contextWords.length === 0) return matches;

      const lastWord = contextWords[contextWords.length - 1];

      // Get next predictions from PPM
      const predictions = getPredictions(contextWords.join(' '), 10);

      for (const prediction of predictions) {
        // Check if prediction is similar to last word
        const similarity = calculateSimilarity(lastWord, prediction);
        if (similarity >= threshold && lastWord !== prediction) {
          const corrected = contextWords.slice(0, -1).join(' ') + (contextWords.length > 1 ? ' ' : '') + prediction;
          matches.push(corrected);
        }
      }

      return matches;
    },
    [predictor, threshold, calculateSimilarity, getPredictions]
  );

  // Generate suggestions after each selection
  useEffect(() => {
    // Clear recent suggestions tracking when message changes significantly
    // (e.g., user types more characters or makes a correction)
    recentSuggestionsRef.current.clear();

    if (!enableCorrection || !predictor || message.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const generateSuggestions = () => {
      const candidates: ErrorCorrectionSuggestion[] = [];
      const adjacencyMap = buildAdjacencyMap(scanItems);

      // Check adjacent key errors
      const adjacentCorrections = checkAdjacentErrors(message, adjacencyMap);
      for (const correction of adjacentCorrections) {
        // Skip if this correction was recently shown
        if (recentSuggestionsRef.current.has(correction)) {
          continue;
        }

        const distance = levenshteinDistance(message, correction);
        const similarity = calculateSimilarity(message, correction);

        if (similarity >= threshold) {
          // Check probability using PPM
          const words = correction.split(' ');
          const lastWord = words[words.length - 1];
          const context = words.slice(0, -1).join(' ');
          const predictions = getPredictions(context, 100);
          const probability = predictions.includes(lastWord) ? 0.8 : 0.5;

          candidates.push({
            text: `Did you mean "${correction}"?`,
            originalMessage: message,
            correctedMessage: correction,
            probability,
            distance,
            similarity,
          });
        }
      }

      // Fuzzy matching with PPM
      const fuzzyMatches = useFuzzyMatching(message);
      for (const correction of fuzzyMatches) {
        // Skip if this correction was recently shown
        if (recentSuggestionsRef.current.has(correction)) {
          continue;
        }

        const distance = levenshteinDistance(message, correction);
        const similarity = calculateSimilarity(message, correction);

        if (similarity >= threshold) {
          const words = correction.split(' ');
          const lastWord = words[words.length - 1];
          const context = words.slice(0, -1).join(' ');
          const predictions = getPredictions(context, 100);
          const probability = predictions.includes(lastWord) ? 0.9 : 0.6;

          // Avoid duplicates
          if (!candidates.some((c) => c.correctedMessage === correction)) {
            candidates.push({
              text: `Did you mean "${correction}"?`,
              originalMessage: message,
              correctedMessage: correction,
              probability,
              distance,
              similarity,
            });
          }
        }
      }

      // Sort by similarity and probability
      candidates.sort((a, b) => {
        const scoreA = a.similarity * a.probability;
        const scoreB = b.similarity * b.probability;
        return scoreB - scoreA;
      });

      // Take top 3 suggestions
      const topSuggestions = candidates.slice(0, 3);

      // Track these suggestions as recently shown
      topSuggestions.forEach((suggestion) => {
        recentSuggestionsRef.current.add(suggestion.correctedMessage);
      });

      setSuggestions(topSuggestions);
      setShowSuggestions(topSuggestions.length > 0);
    };

    generateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, lastSelected, enableCorrection, predictor, threshold, scanItems.length, getPredictions]);

  const dismissSuggestions = useCallback(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    // Note: We don't clear recentSuggestionsRef here because:
    // 1. If user dismissed by selecting something else, the message will change and clear it
    // 2. If user dismissed by continuing to type, we still want to avoid re-offering
    // 3. It gets cleared when message changes significantly (see useEffect above)
  }, []);

  const applySuggestion = useCallback(
    (suggestion: ErrorCorrectionSuggestion): string => {
      return suggestion.correctedMessage;
    },
    []
  );

  return {
    suggestions,
    showSuggestions,
    dismissSuggestions,
    applySuggestion,
  };
}
