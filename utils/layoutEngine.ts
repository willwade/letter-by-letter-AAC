import { SPACE, UNDO, CLEAR, SPEAK } from '../constants';

export interface Block {
  id: string;
  label: string;
  spokenLabel: string;
  items: string[];
  type?: 'prediction' | 'alphabet' | 'actions';
}

export interface LayoutOptions {
  mode: 'static' | 'predictive' | 'hybrid';
  blockSize: number;
  alphabet: string[];
  predictedWords: string[]; // Top words
  predictedLetters: string[]; // Top letters (sorted by prob)
}

/**
 * Helper to generate a label for a list of items.
 * If the items correspond to a contiguous slice of the reference alphabet, return "Start - End".
 * Otherwise return space-separated list.
 */
function generateLabel(items: string[], fullAlphabet: string[]): { label: string; spokenLabel: string } {
  // Check if items are a contiguous slice of fullAlphabet
  // This is a heuristic.
  // 1. Find index of first item in fullAlphabet
  const firstIdx = fullAlphabet.indexOf(items[0]);
  let isContiguous = false;

  if (firstIdx !== -1 && items.length > 1) {
    isContiguous = true;
    for (let i = 1; i < items.length; i++) {
      if (fullAlphabet[firstIdx + i] !== items[i]) {
        isContiguous = false;
        break;
      }
    }
  }

  // If contiguous and length > 2, use range. E.g. A, B -> "A B". A, B, C -> "A - C".
  if (isContiguous && items.length > 2) {
    const start = items[0];
    const end = items[items.length - 1];
    return {
      label: `${start} - ${end}`,
      spokenLabel: `${start} to ${end}`,
    };
  }

  // Special handling for labels
  const label = items
    .map((item) => {
      if (item === SPACE) return 'SPACE';
      if (item === UNDO) return 'UNDO';
      if (item === CLEAR) return 'CLEAR';
      if (item === SPEAK) return 'SPEAK';
      return item;
    })
    .join(' ');

  // Spoken label: comma separated for clear TTS
  const spokenLabel = items
    .map((item) => {
      if (item === SPACE) return 'Space';
      if (item === UNDO) return 'Undo';
      if (item === CLEAR) return 'Clear';
      if (item === SPEAK) return 'Speak';
      return item;
    })
    .join(', ');

  return { label, spokenLabel };
}

export function generateBlocks(options: LayoutOptions): Block[] {
  const { mode, blockSize, alphabet, predictedWords, predictedLetters } = options;
  const blocks: Block[] = [];
  let blockCounter = 0;

  // --- 1. WORD BLOCK (Predictions) ---
  // In Hybrid/Predictive modes, or even Static if we want word predictions available
  // The user prompt implies "C1. Add a word completion block" is a general feature for Blocks.
  // We'll add it if there are words.
  if (predictedWords.length > 0) {
    const items = [...predictedWords, SPACE, UNDO];
    blocks.push({
      id: `block-${blockCounter++}`,
      label: 'Predictions',
      spokenLabel: 'Word Predictions',
      items,
      type: 'prediction',
    });
  }

  // --- 2. LETTERS BLOCKS ---

  if (mode === 'static') {
    // Just chunk the alphabet
    for (let i = 0; i < alphabet.length; i += blockSize) {
      const chunk = alphabet.slice(i, i + blockSize);
      const { label, spokenLabel } = generateLabel(chunk, alphabet);
      blocks.push({
        id: `block-${blockCounter++}`,
        label,
        spokenLabel,
        items: chunk,
        type: 'alphabet',
      });
    }
  } else if (mode === 'hybrid') {
    // Block 1: Hot Letters (Top N)
    // Size = blockSize
    // Filter predictedLetters to only those in alphabet to avoid weird symbols?
    // But usually predictedLetters are from the alphabet.
    const validPredictedLetters = predictedLetters.filter(l => alphabet.includes(l));
    const hotLetters = validPredictedLetters.slice(0, blockSize);

    if (hotLetters.length > 0) {
      const { label, spokenLabel } = generateLabel(hotLetters, alphabet);
      blocks.push({
        id: `block-${blockCounter++}`,
        label: label,
        spokenLabel: 'Top Letters: ' + spokenLabel, // Explicitly announce it's top letters? Or just read them.
        items: hotLetters,
        type: 'prediction',
      });
    }

    // Blocks 2+: Fixed Alphabet
    for (let i = 0; i < alphabet.length; i += blockSize) {
      const chunk = alphabet.slice(i, i + blockSize);
      const { label, spokenLabel } = generateLabel(chunk, alphabet);
      blocks.push({
        id: `block-${blockCounter++}`,
        label,
        spokenLabel,
        items: chunk,
        type: 'alphabet',
      });
    }
  } else if (mode === 'predictive') {
    // Predictive blocks: Top predicted letters first, then remaining alphabet
    const validPredictedLetters = predictedLetters.filter(l => alphabet.includes(l));
    const usedLetters = new Set(validPredictedLetters);
    const remainingLetters = alphabet.filter((l) => !usedLetters.has(l));

    const sortedAlphabet = [...validPredictedLetters, ...remainingLetters];

    // Chunk it
    for (let i = 0; i < sortedAlphabet.length; i += blockSize) {
      const chunk = sortedAlphabet.slice(i, i + blockSize);
      const { label, spokenLabel } = generateLabel(chunk, alphabet);
      blocks.push({
        id: `block-${blockCounter++}`,
        label,
        spokenLabel,
        items: chunk,
        type: 'alphabet',
      });
    }
  }

  // --- 3. ACTIONS BLOCK ---
  // Always have a Tools block at the end.
  blocks.push({
    id: `block-${blockCounter++}`,
    label: 'Actions',
    spokenLabel: 'Actions',
    items: [SPACE, SPEAK, UNDO, CLEAR],
    type: 'actions',
  });

  return blocks;
}
