import type { Theme } from './types';

export const themes: Record<string, Theme> = {
  default: {
    name: 'default',
    displayName: 'Default (Black on White)',
    colors: {
      background: '#ffffff',
      text: '#000000',
      scannerBg: '#ffffff',
      scannerText: '#000000',
      displayBg: '#f3f4f6',
      displayText: '#000000',
      buttonBg: '#3b82f6',
      buttonText: '#ffffff',
      buttonHover: '#2563eb',
      modalBg: '#ffffff',
      modalText: '#000000',
      inputBg: '#ffffff',
      inputText: '#000000',
      border: '#d1d5db',
      actionBorder: '#ef4444',      // Red for actions
      predictionBorder: '#3b82f6',  // Blue for predictions
    },
  },
  dark: {
    name: 'dark',
    displayName: 'Dark Mode (White on Dark Gray)',
    colors: {
      background: '#1f2937',
      text: '#f9fafb',
      scannerBg: '#111827',
      scannerText: '#f9fafb',
      displayBg: '#374151',
      displayText: '#f9fafb',
      buttonBg: '#3b82f6',
      buttonText: '#ffffff',
      buttonHover: '#2563eb',
      modalBg: '#1f2937',
      modalText: '#f9fafb',
      inputBg: '#374151',
      inputText: '#f9fafb',
      border: '#4b5563',
      actionBorder: '#f87171',      // Light red for actions
      predictionBorder: '#60a5fa',  // Light blue for predictions
    },
  },
  'yellow-black': {
    name: 'yellow-black',
    displayName: 'High Contrast (Yellow on Black)',
    colors: {
      background: '#000000',
      text: '#ffff00',
      scannerBg: '#ffff00',
      scannerText: '#000000',
      displayBg: '#1a1a1a',
      displayText: '#ffff00',
      buttonBg: '#ffff00',
      buttonText: '#000000',
      buttonHover: '#cccc00',
      modalBg: '#000000',
      modalText: '#ffff00',
      inputBg: '#1a1a1a',
      inputText: '#ffff00',
      border: '#ffff00',
      actionBorder: '#ff0000',      // Red for actions
      predictionBorder: '#00ff00',  // Green for predictions
    },
  },
  'white-black': {
    name: 'white-black',
    displayName: 'High Contrast (White on Black)',
    colors: {
      background: '#000000',
      text: '#ffffff',
      scannerBg: '#ffffff',
      scannerText: '#000000',
      displayBg: '#1a1a1a',
      displayText: '#ffffff',
      buttonBg: '#ffffff',
      buttonText: '#000000',
      buttonHover: '#cccccc',
      modalBg: '#000000',
      modalText: '#ffffff',
      inputBg: '#1a1a1a',
      inputText: '#ffffff',
      border: '#ffffff',
      actionBorder: '#ff0000',      // Red for actions
      predictionBorder: '#00ff00',  // Green for predictions
    },
  },
  'black-yellow': {
    name: 'black-yellow',
    displayName: 'High Contrast (Black on Yellow)',
    colors: {
      background: '#ffff00',
      text: '#000000',
      scannerBg: '#000000',
      scannerText: '#ffff00',
      displayBg: '#ffffcc',
      displayText: '#000000',
      buttonBg: '#000000',
      buttonText: '#ffff00',
      buttonHover: '#333333',
      modalBg: '#ffff00',
      modalText: '#000000',
      inputBg: '#ffffcc',
      inputText: '#000000',
      border: '#000000',
      actionBorder: '#ff0000',      // Red for actions
      predictionBorder: '#0000ff',  // Blue for predictions
    },
  },
  'cyan-black': {
    name: 'cyan-black',
    displayName: 'High Contrast (Cyan on Black)',
    colors: {
      background: '#000000',
      text: '#00ffff',
      scannerBg: '#00ffff',
      scannerText: '#000000',
      displayBg: '#1a1a1a',
      displayText: '#00ffff',
      buttonBg: '#00ffff',
      buttonText: '#000000',
      buttonHover: '#00cccc',
      modalBg: '#000000',
      modalText: '#00ffff',
      inputBg: '#1a1a1a',
      inputText: '#00ffff',
      border: '#00ffff',
      actionBorder: '#ff00ff',      // Magenta for actions
      predictionBorder: '#ffff00',  // Yellow for predictions
    },
  },
};

export const getTheme = (themeName: string): Theme => {
  return themes[themeName] || themes.default;
};

