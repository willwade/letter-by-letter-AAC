export type ScanMode = 'one-switch' | 'two-switch';

export type ScanningStrategy = 'linear' | 'block';

export type BlockMode = 'static' | 'predictive' | 'hybrid';

export type ThemeName =
  | 'default'
  | 'dark'
  | 'yellow-black'
  | 'white-black'
  | 'black-yellow'
  | 'cyan-black';

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    background: string;
    text: string;
    scannerBg: string;
    scannerText: string;
    displayBg: string;
    displayText: string;
    buttonBg: string;
    buttonText: string;
    buttonHover: string;
    modalBg: string;
    modalText: string;
    inputBg: string;
    inputText: string;
    border: string;
    actionBorder: string; // Border color for SPEAK, UNDO, CLEAR, SPACE
    predictionBorder: string; // Border color for letter and word predictions
  };
}

// Error Correction & Reaction Time Inference Types

export interface ReactionTimeStats {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  samples: number[];
  testDate: number; // timestamp
  switchType: 'one-switch' | 'two-switch';
}

export interface ErrorCorrectionSuggestion {
  text: string;
  originalMessage: string;
  correctedMessage: string;
  probability: number;
  distance: number;
  similarity: number;
}

export interface SelectionTiming {
  itemIndex: number;
  item: string;
  timestamp: number;
  dwellTime: number;
  timeSinceLastSelection: number;
}

export interface InferenceResult {
  intendedItem?: string;
  confidence: number;
  alternatives: Array<{ item: string; probability: number }>;
}
