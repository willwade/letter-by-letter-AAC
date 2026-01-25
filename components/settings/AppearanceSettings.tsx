import React from 'react';
import type { ThemeName, Theme } from '../../types';
import { themes } from '../../themes';

interface AppearanceSettingsProps {
  themeName: ThemeName;
  setThemeName: (theme: ThemeName) => void;
  theme: Theme;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  messageFontSize: number;
  setMessageFontSize: (size: number) => void;
  scannerFontSize: number;
  setScannerFontSize: (size: number) => void;
  borderWidth: number;
  setBorderWidth: (width: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hideControlBar: boolean;
  setHideControlBar: (hide: boolean) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  themeName,
  setThemeName,
  theme,
  fontFamily,
  setFontFamily,
  messageFontSize,
  setMessageFontSize,
  scannerFontSize,
  setScannerFontSize,
  borderWidth,
  setBorderWidth,
  isFullscreen,
  onToggleFullscreen,
  hideControlBar,
  setHideControlBar,
}) => {
  return (
    <div className="border-t pt-4">
      <h3 className="font-bold text-lg mb-3">Appearance</h3>

      {/* Color Theme */}
      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="theme" className="font-semibold w-32">
          Color Theme:
        </label>
        <select
          id="theme"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value as ThemeName)}
          className="flex-1 p-2 border rounded"
          style={{
            backgroundColor: theme.colors.inputBg,
            color: theme.colors.inputText,
            borderColor: theme.colors.border,
          }}
        >
          {Object.values(themes).map((t) => (
            <option key={t.name} value={t.name}>
              {t.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Font Family */}
      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="fontFamily" className="font-semibold w-32">
          Font:
        </label>
        <select
          id="fontFamily"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="flex-1 p-2 border rounded"
          style={{
            backgroundColor: theme.colors.inputBg,
            color: theme.colors.inputText,
            borderColor: theme.colors.border,
          }}
        >
          <option value="system-ui">System Default</option>
          <option value="'Atkinson Hyperlegible', sans-serif">Atkinson Hyperlegible</option>
          <option value="'Playpen Sans', cursive">Playpen Sans</option>
          <option value="'Chewy', system-ui">Chewy</option>
          <option value="Arial, sans-serif">Arial</option>
        </select>
      </div>

      {/* Message Font Size */}
      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="messageFontSize" className="font-semibold w-32">
          Msg Font:
        </label>
        <input
          id="messageFontSize"
          type="range"
          min="16"
          max="150"
          step="1"
          value={messageFontSize}
          onChange={(e) => setMessageFontSize(Number(e.target.value))}
          className="w-48"
        />
        <span>{messageFontSize}px</span>
      </div>

      {/* Scanner Font Size */}
      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="scannerFontSize" className="font-semibold w-32">
          Ltr Font:
        </label>
        <input
          id="scannerFontSize"
          type="range"
          min="100"
          max="800"
          step="10"
          value={scannerFontSize}
          onChange={(e) => setScannerFontSize(Number(e.target.value))}
          className="w-48"
        />
        <span>{scannerFontSize}px</span>
      </div>

      {/* Border Width */}
      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="borderWidth" className="font-semibold w-32">
          Border Width:
        </label>
        <input
          id="borderWidth"
          type="range"
          min="0"
          max="20"
          step="1"
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className="w-48"
        />
        <span>{borderWidth}px</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold w-32"></span>
        <span className="text-sm text-gray-600 italic">
          Actions (SPEAK, UNDO, CLEAR, SPACE) and predictions get colored borders
        </span>
      </div>

      {/* Fullscreen Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold w-32">Display:</span>
        <button
          onClick={onToggleFullscreen}
          className="font-semibold py-2 px-4 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-transform transform active:scale-95"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        </button>
      </div>

      {/* Hide Control Bar Toggle */}
      <div className="flex items-center gap-4 mb-3">
        <span className="font-semibold w-32">Control Bar:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideControlBar}
            onChange={(e) => setHideControlBar(e.target.checked)}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Hide (use cog icon to access settings)
        </label>
      </div>
    </div>
  );
};
