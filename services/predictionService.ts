import type { Predictor } from '@willwade/ppmpredictor';

export interface Predictions {
  words: string[];
  letters: string[];
}

// Most common starting letters in English as a default for an empty message.
const COMMON_STARTING_LETTERS = ['T', 'A', 'O', 'I', 'S', 'W'];
// Most common letters overall in English, as a fallback if no specific predictions can be made.
const COMMON_LETTERS_FALLBACK = ['E', 'T', 'A', 'O', 'I', 'N'];


export const getPredictions = (predictor: Predictor, currentText: string): Predictions => {
  if (currentText.length === 0) {
    return {
      words: [],
      letters: COMMON_STARTING_LETTERS,
    };
  }

  try {
    // --- WORD PREDICTION ---
    // The library needs the preceding context and the current partial word separately.
    const lastSpaceIndex = currentText.lastIndexOf(' ');
    const precedingContext = lastSpaceIndex === -1 ? '' : currentText.substring(0, lastSpaceIndex + 1);
    const lastWordFragment = lastSpaceIndex === -1 ? currentText : currentText.substring(lastSpaceIndex + 1);

    const predictedWordsResult = predictor.predictWordCompletion(lastWordFragment, precedingContext);
    const topWords = predictedWordsResult.map(p => p.text).slice(0, 3);
    
    // --- LETTER PREDICTION ---
    // The library can predict the next character directly from the full context.
    const predictedLettersResult = predictor.predictNextCharacter(currentText);
    let topLetters = predictedLettersResult
      .map(p => p.text.toUpperCase())
      .filter(char => /^[A-Z]$/.test(char)); // Ensure we only get single letters
    
    topLetters = [...new Set(topLetters)].slice(0, 6); // Get unique letters, max 6

    // --- GRACEFUL FALLBACK ---
    // If the model provides no letter suggestions, use a generic fallback.
    if (topLetters.length === 0) {
      topLetters = COMMON_LETTERS_FALLBACK;
    }

    return {
      words: topWords,
      letters: topLetters,
    };

  } catch (error) {
    console.error("Error getting predictions:", error);
    // On error, provide a safe fallback.
    return { words: [], letters: COMMON_LETTERS_FALLBACK };
  }
};
