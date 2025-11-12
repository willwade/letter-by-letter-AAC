/// <reference types="vite/client" />
import { useState, useEffect, useCallback } from 'react';
import { createErrorTolerantPredictor, type Predictor } from '@willwade/ppmpredictor';
import { loadFrequencyList } from 'worldalphabets';
import { getTrainingFileName } from '../trainingDataMap';

/**
 * Build a keyboard adjacency map from an alphabetical list.
 * Each letter is adjacent to the letters immediately before and after it in the list.
 */
function buildKeyboardAdjacencyMap(letters: string[]): Record<string, string[]> {
  const adjacencyMap: Record<string, string[]> = {};

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i].toLowerCase();
    const neighbors: string[] = [];

    // Add previous letter if exists
    if (i > 0) {
      neighbors.push(letters[i - 1].toLowerCase());
    }

    // Add next letter if exists
    if (i < letters.length - 1) {
      neighbors.push(letters[i + 1].toLowerCase());
    }

    adjacencyMap[letter] = neighbors;
  }

  return adjacencyMap;
}

interface UsePredictionProps {
  message: string;
  alphabet: string[];
  selectedLanguage: string;
  enablePrediction: boolean;
  showWordPrediction: boolean;
  useUppercase: boolean;
  scanItems: string[];
}

export function usePrediction({
  message,
  alphabet,
  selectedLanguage,
  enablePrediction,
  showWordPrediction,
  useUppercase,
  scanItems,
}: UsePredictionProps) {
  const [predictor, setPredictor] = useState<Predictor | null>(null);
  const [predictedLetters, setPredictedLetters] = useState<string[]>([]);
  const [predictedWords, setPredictedWords] = useState<string[]>([]);
  const [trainingStatus, setTrainingStatus] = useState<string>('No model loaded.');
  const [learnedWordsCount, setLearnedWordsCount] = useState<number>(0);
  const [loadedTrainingData, setLoadedTrainingData] = useState<string>('');

  // Effect to load language-specific model and training data
  useEffect(() => {
    const loadLanguageModel = async () => {
      setTrainingStatus(`Loading model for ${selectedLanguage}...`);
      try {
        const trainingFileName = getTrainingFileName(selectedLanguage);
        let corpusText = '';
        let lexicon: string[] = [];

        // Try to load training data from local files
        if (trainingFileName) {
          try {
            const basePath = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${basePath}data/training/${trainingFileName}`);
            if (response.ok) {
              corpusText = await response.text();
              console.log(`✅ Loaded training data from ${trainingFileName}`);
            } else {
              console.warn(`⚠️ Could not load training file: ${trainingFileName}`);
            }
          } catch (error) {
            console.warn(`⚠️ Error loading training file:`, error);
          }
        }

        // Try to load lexicon from worldalphabets frequency lists
        try {
          // First try worldalphabets frequency list (top 1000 words)
          lexicon = await loadFrequencyList(selectedLanguage);
          console.log(`✅ Using ${lexicon.length} words from worldalphabets frequency list`);
        } catch (error) {
          console.warn(`⚠️ Could not load lexicon:`, error);
        }

        // Build keyboard adjacency map from current alphabet
        const adjacencyMap = buildKeyboardAdjacencyMap(alphabet);

        // Create predictor with error tolerance, keyboard awareness, and lexicon
        const newPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10,
          keyboardAware: true,
          keyboardAdjacencyMap: adjacencyMap,
          lexicon: lexicon.length > 0 ? lexicon : undefined,
        });

        console.log(
          '✅ Created predictor with keyboard awareness for alphabet:',
          alphabet.slice(0, 10)
        );
        if (lexicon.length > 0) {
          console.log(
            `✅ Predictor has lexicon with ${lexicon.length} words for error-tolerant matching`
          );
        }

        // Train on corpus text if available
        if (corpusText) {
          console.log(`📚 Training on corpus text (${corpusText.length} characters)...`);
          // Convert to lowercase for case-insensitive training
          const normalizedCorpus = corpusText.toLowerCase();
          newPredictor.train(normalizedCorpus);

          // Store the normalized training data for export
          setLoadedTrainingData(normalizedCorpus);

          // Count words in training corpus
          const corpusWords = corpusText.trim().split(/\s+/).filter((w) => w.length > 0).length;
          setTrainingStatus(
            `✅ Trained on ${trainingFileName} (${corpusWords.toLocaleString()} words) + lexicon (${lexicon.length} words)`
          );
        } else {
          // No training data loaded
          setLoadedTrainingData('');
          setTrainingStatus(
            `✅ Model ready with lexicon (${lexicon.length} words). Will learn from your input.`
          );
        }

        // Load and replay session data from localStorage for adaptive learning
        const sessionKey = `ppm-session-${selectedLanguage}`;
        const sessionData = localStorage.getItem(sessionKey);
        if (sessionData) {
          const learnedWords = sessionData
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
          console.log(`📚 Also loading ${learnedWords.length} learned words from previous sessions`);
          // Session data is already lowercase (saved from user input which is normalized)
          newPredictor.train(sessionData);
          setLearnedWordsCount(learnedWords.length);
        } else {
          setLearnedWordsCount(0);
        }

        setPredictor(newPredictor);
      } catch (error) {
        console.error('❌ Failed to load language model:', error);
        setTrainingStatus(`❌ Error: Could not load model for ${selectedLanguage}.`);

        // Create a basic predictor even if loading fails
        const fallbackPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
        });
        setPredictor(fallbackPredictor);
        setLearnedWordsCount(0);
      }
    };

    loadLanguageModel();
  }, [selectedLanguage, alphabet]); // Reload when language or alphabet changes

  // Debounced effect for running predictions as the user types
  useEffect(() => {
    if (!enablePrediction || !predictor) {
      setPredictedLetters([]);
      setPredictedWords([]);
      return;
    }

    const handler = setTimeout(() => {
      const lowerCaseMessage = message.toLowerCase();

      // IMPORTANT: We're in adaptive mode, so we DON'T call addToContext() here
      // because it would train the model on partial/incomplete text.
      // Instead, we pass context as parameters to the prediction methods.

      // For character prediction, we need to set context temporarily
      // Reset and set context for character prediction only
      predictor.resetContext();
      if (lowerCaseMessage) {
        predictor.addToContext(lowerCaseMessage);
      }

      // Predict next character based on current context
      const charPredictions = predictor.predictNextCharacter();

      // Filter for single alphabet characters AND space
      // Note: predictor always works in lowercase, so we filter for lowercase then transform
      const letterFilter = (c: string) => c.length === 1 && ((c >= 'a' && c <= 'z') || c === ' ');

      // Apply case transformation based on useUppercase setting
      const caseTransform = useUppercase
        ? (s: string) => s.toUpperCase()
        : (s: string) => s.toLowerCase();

      const filteredLetters = charPredictions
        .filter((p: { text: string; probability: number }) => letterFilter(p.text))
        .map((p: { text: string; probability: number }) => p.text === ' ' ? '_' : caseTransform(p.text))  // Convert space to underscore for display
        .slice(0, 5);

      console.log('🔤 Character predictions:', {
        rawPredictions: charPredictions.length,
        filteredLetters: filteredLetters.length,
        letters: filteredLetters,
        context: lowerCaseMessage.slice(-20) // Last 20 chars of context
      });

      setPredictedLetters(filteredLetters);

      // Word predictions - use precedingContext parameter to avoid training
      if (showWordPrediction) {
        let wordPredictions: { text: string; probability: number }[] = [];

        // Check if message ends with space (complete word just typed)
        if (lowerCaseMessage.endsWith(' ') && lowerCaseMessage.trim().length > 0) {
          // Next word prediction - predict what comes after the last complete word
          const words = lowerCaseMessage.trim().split(/\s+/);
          const lastWord = words[words.length - 1] || '';

          if (lastWord) {
            wordPredictions = predictor.predictNextWord(lastWord, 10);
            console.log('🔮 Next word predictions after "' + lastWord + '":', wordPredictions);
          }
        } else {
          // Word completion - predict completions for partial word being typed
          const words = lowerCaseMessage.split(/\s+/);
          const partialWord = words[words.length - 1] || '';
          const precedingText = words.slice(0, -1).join(' ');

          // Pass precedingContext to avoid training on partial text
          wordPredictions = predictor.predictWordCompletion(
            partialWord,
            precedingText,
            10
          );

          console.log('🔮 Word completions for "' + partialWord + '" (context: "' + precedingText + '"):', wordPredictions);
        }

        // Filter out words with unwanted punctuation (keep only letters, numbers, hyphens, apostrophes within words)
        // This removes predictions like "CLES,'S," or "BALANCED,),"
        const filteredPredictions = wordPredictions.filter((p: { text: string; probability: number }) => {
          // Allow only: letters, numbers, hyphens, and apostrophes (but not at start/end)
          // Reject: commas, periods, parentheses, brackets, etc.
          const text = p.text;

          // Check if word contains unwanted punctuation
          const hasUnwantedPunctuation = /[,.()[\]{};:!?"""''`~@#$%^&*+=<>/\\|]/.test(text);

          return !hasUnwantedPunctuation;
        });

        // Apply case transformation based on useUppercase setting
        // Extract text property from prediction objects
        const transformedWords = filteredPredictions
          .map((p: { text: string; probability: number }) => (useUppercase ? p.text.toUpperCase() : p.text.toLowerCase()))
          .slice(0, 3);

        setPredictedWords(transformedWords);
      } else {
        setPredictedWords([]);
      }

      // Reset context after prediction to avoid training on partial text
      predictor.resetContext();
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [message, enablePrediction, predictor, useUppercase, showWordPrediction]);

  // Effect to update keyboard adjacency map when scan items change
  useEffect(() => {
    if (!predictor || !enablePrediction) return;

    // Extract just the letters from scanItems (filter out special actions)
    const letters = scanItems.filter(
      (item) =>
        item.length === 1 &&
        ((item >= 'a' && item <= 'z') ||
          (item >= 'A' && item <= 'Z') ||
          item.match(/\p{L}/u)) // Unicode letter
    );

    if (letters.length > 0) {
      // Build adjacency map based on the CURRENT scan order
      // This represents the actual navigation order, so "adjacent" means
      // the user might accidentally select the item before/after while scanning
      const adjacencyMap = buildKeyboardAdjacencyMap(letters);

      // Update the predictor's keyboard adjacency map using updateConfig
      if (predictor.updateConfig) {
        predictor.updateConfig({ keyboardAdjacencyMap: adjacencyMap });
        console.log(
          '🔄 Updated keyboard adjacency map based on current scan order:',
          letters.slice(0, 10)
        );
      }
    }
  }, [scanItems, predictor, enablePrediction]);

  // File upload handler
  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();

        // Try to load lexicon from worldalphabets frequency lists
        let lexicon: string[] = [];
        try {
          lexicon = await loadFrequencyList(selectedLanguage);
          console.log(`✅ Using ${lexicon.length} words from worldalphabets frequency list`);
        } catch (error) {
          console.warn(`⚠️ Could not load lexicon:`, error);
        }

        // Build keyboard adjacency map from current alphabet
        const adjacencyMap = buildKeyboardAdjacencyMap(alphabet);

        // Create new predictor with lexicon
        const newPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10,
          keyboardAware: true,
          keyboardAdjacencyMap: adjacencyMap,
          lexicon: lexicon.length > 0 ? lexicon : undefined,
        });

        // Train on uploaded file (normalize to lowercase)
        const normalizedText = text.toLowerCase();
        newPredictor.train(normalizedText);
        setLoadedTrainingData(normalizedText);

        // Also load and train on any existing learned data for this language
        const sessionKey = `ppm-session-${selectedLanguage}`;
        const sessionData = localStorage.getItem(sessionKey);
        if (sessionData) {
          const learnedWords = sessionData
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
          console.log(
            `📚 Also loading ${learnedWords.length} learned words from previous sessions`
          );
          // Session data is already lowercase
          newPredictor.train(sessionData);
          setLearnedWordsCount(learnedWords.length);
        } else {
          setLearnedWordsCount(0);
        }

        setPredictor(newPredictor);

        // Count words in uploaded file
        const uploadedWords = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
        setTrainingStatus(
          `✅ Trained on ${file.name} (${uploadedWords.toLocaleString()} words) + lexicon (${lexicon.length} words)`
        );
      } catch (error) {
        console.error('Failed to train model:', error);
        setTrainingStatus('Error training model. Please try again.');
      }
    },
    [selectedLanguage, alphabet]
  );

  // Export learned data handler
  const handleExportLearnedData = useCallback(async () => {
    const sessionKey = `ppm-session-${selectedLanguage}`;
    const sessionData = localStorage.getItem(sessionKey) || '';

    // Count words
    const learnedWords = sessionData.trim().split(/\s+/).filter((w) => w.length > 0).length;
    const trainingWords = loadedTrainingData.trim().split(/\s+/).filter((w) => w.length > 0)
      .length;

    // Combine training data and learned data
    const combinedData = loadedTrainingData
      ? `${loadedTrainingData}\n\n# Learned from usage:\n${sessionData}`
      : sessionData;

    // Create a blob and download
    const blob = new Blob([combinedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-data-${selectedLanguage}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const totalWords = trainingWords + learnedWords;
    console.log(
      `📥 Exported training data for ${selectedLanguage}: ${trainingWords.toLocaleString()} training words + ${learnedWords.toLocaleString()} learned words = ${totalWords.toLocaleString()} total words`
    );
  }, [selectedLanguage, loadedTrainingData]);

  // Clear learned data handler
  const handleClearLearnedData = useCallback(() => {
    const sessionKey = `ppm-session-${selectedLanguage}`;
    localStorage.removeItem(sessionKey);
    setLearnedWordsCount(0);
    console.log('🗑️ Cleared learned data for', selectedLanguage);

    // Reload the predictor to reset it
    const loadLanguageModel = async () => {
      try {
        let lexicon: string[] = [];

        // Try to load lexicon from worldalphabets frequency lists
        try {
          lexicon = await loadFrequencyList(selectedLanguage);
          console.log(`✅ Using ${lexicon.length} words from worldalphabets frequency list`);
        } catch (error) {
          console.warn(`⚠️ Could not load lexicon:`, error);
        }

        // Build keyboard adjacency map from current alphabet
        const adjacencyMap = buildKeyboardAdjacencyMap(alphabet);

        const newPredictor = createErrorTolerantPredictor({
          maxOrder: 5,
          adaptive: true,
          maxEditDistance: 2,
          minSimilarity: 0.6,
          maxPredictions: 10,
          keyboardAware: true,
          keyboardAdjacencyMap: adjacencyMap,
          lexicon: lexicon.length > 0 ? lexicon : undefined,
        });

        // Train on loaded training data if available
        if (loadedTrainingData) {
          newPredictor.train(loadedTrainingData);
        }

        setPredictor(newPredictor);
        setTrainingStatus(
          loadedTrainingData
            ? `✅ Reset to training data + lexicon (${lexicon.length} words)`
            : `✅ Using lexicon only (${lexicon.length} words)`
        );
      } catch (error) {
        console.error('Failed to reload predictor:', error);
      }
    };

    loadLanguageModel();
  }, [selectedLanguage, alphabet, loadedTrainingData]);

  return {
    predictor,
    predictedLetters,
    predictedWords,
    trainingStatus,
    learnedWordsCount,
    setLearnedWordsCount,
    handleFileUpload,
    handleExportLearnedData,
    handleClearLearnedData,
  };
}

