import React, { useState } from 'react';
import type { ScanMode, ThemeName, Theme } from '../types';
import { themes } from '../themes';

interface ControlsProps {
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  scanSpeed: number;
  setScanSpeed: (speed: number) => void;
  firstItemDelay: number;
  setFirstItemDelay: (delay: number) => void;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
  onSwitch1: () => void;
  onSwitch2: () => void;
  onClear: () => void;
  onUndo: () => void;
  messageFontSize: number;
  setMessageFontSize: (size: number) => void;
  scannerFontSize: number;
  setScannerFontSize: (size: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  enablePrediction: boolean;
  setEnablePrediction: (enable: boolean) => void;
  showWordPrediction: boolean;
  setShowWordPrediction: (show: boolean) => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string) => void;
  onFileUpload: (file: File) => void;
  trainingStatus: string;
  hasTrainingData: boolean;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  hideControlBar: boolean;
  setHideControlBar: (hide: boolean) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  availableLanguages: string[];
  languageNames: Record<string, string>;
  selectedScript: string | null;
  setSelectedScript: (script: string | null) => void;
  availableScripts: string[];
  useUppercase: boolean;
  setUseUppercase: (uppercase: boolean) => void;
  themeName: ThemeName;
  setThemeName: (theme: ThemeName) => void;
  theme: Theme;
}

const Controls: React.FC<ControlsProps> = ({
  scanMode,
  setScanMode,
  scanSpeed,
  setScanSpeed,
  firstItemDelay,
  setFirstItemDelay,
  isScanning,
  setIsScanning,
  onSwitch1,
  onSwitch2,
  onClear,
  onUndo,
  messageFontSize,
  setMessageFontSize,
  scannerFontSize,
  setScannerFontSize,
  isFullscreen,
  onToggleFullscreen,
  enablePrediction,
  setEnablePrediction,
  showWordPrediction,
  setShowWordPrediction,
  availableVoices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  onFileUpload,
  trainingStatus,
  hasTrainingData,
  showSettingsModal,
  setShowSettingsModal,
  hideControlBar,
  setHideControlBar,
  selectedLanguage,
  setSelectedLanguage,
  availableLanguages,
  languageNames,
  selectedScript,
  setSelectedScript,
  availableScripts,
  useUppercase,
  setUseUppercase,
  themeName,
  setThemeName,
  theme,
}) => {

  const handleStartStop = () => {
    setIsScanning(!isScanning);
  };

  const handlePreviewVoice = () => {
    if (!selectedVoiceURI || !window.speechSynthesis) return;

    const selectedVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
    if (!selectedVoice) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("This is a test of the selected voice.");
    utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };


  return (
    <>
      {/* Settings Modal - Always rendered regardless of hideControlBar */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowSettingsModal(false)}>
          <div
            className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
            style={{ backgroundColor: theme.colors.modalBg, color: theme.colors.modalText }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 p-4 flex justify-between items-center"
              style={{
                backgroundColor: theme.colors.modalBg,
                borderBottom: `1px solid ${theme.colors.border}`
              }}
            >
              <h2 className="text-2xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* Scan Mode */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <span className="font-semibold w-32">Mode:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scanMode"
                      value="one-switch"
                      checked={scanMode === 'one-switch'}
                      onChange={() => setScanMode('one-switch')}
                      className="form-radio h-5 w-5 text-black"
                    />
                    One-Switch
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scanMode"
                      value="two-switch"
                      checked={scanMode === 'two-switch'}
                      onChange={() => setScanMode('two-switch')}
                      className="form-radio h-5 w-5 text-black"
                    />
                    Two-Switch
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-32"></span>
                  <span className="text-sm text-gray-600 italic">
                    {scanMode === 'one-switch'
                      ? 'Press Space to select'
                      : 'Press Space to advance, Enter to select'}
                  </span>
                </div>
              </div>

              {/* Scan Speed */}
              {scanMode === 'one-switch' && (
                <>
                  <div className="flex items-center gap-2">
                    <label htmlFor="scanSpeed" className="font-semibold w-32">Speed:</label>
                    <input
                      id="scanSpeed"
                      type="range"
                      min="200"
                      max="3000"
                      step="100"
                      value={scanSpeed}
                      onChange={(e) => setScanSpeed(Number(e.target.value))}
                      className="w-48"
                    />
                    <span>{(scanSpeed / 1000).toFixed(1)}s</span>
                  </div>

                  {/* First Item Delay */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="firstItemDelay" className="font-semibold w-32">First Item:</label>
                    <input
                      id="firstItemDelay"
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={firstItemDelay}
                      onChange={(e) => setFirstItemDelay(Number(e.target.value))}
                      className="w-48"
                    />
                    <span>{(firstItemDelay / 1000).toFixed(1)}s</span>
                  </div>
                </>
              )}

              {/* Language Selection */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">Language & Alphabet</h3>

                {/* Language Picker */}
                <div className="flex items-center gap-2 mb-3">
                  <label htmlFor="languagePicker" className="font-semibold w-32">Language:</label>
                  <select
                    id="languagePicker"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="form-select w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {availableLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {languageNames[lang] || lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Script Picker (only show if language has multiple scripts) */}
                {availableScripts.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <label htmlFor="scriptPicker" className="font-semibold w-32">Script:</label>
                    <select
                      id="scriptPicker"
                      value={selectedScript || ''}
                      onChange={(e) => setSelectedScript(e.target.value || null)}
                      className="form-select w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      {availableScripts.map((script) => (
                        <option key={script} value={script}>
                          {script}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Case Toggle */}
                <div className="flex items-center gap-4">
                  <span className="font-semibold w-32">Case:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="letterCase"
                      checked={useUppercase}
                      onChange={() => setUseUppercase(true)}
                      className="form-radio h-5 w-5 text-black"
                    />
                    Uppercase
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="letterCase"
                      checked={!useUppercase}
                      onChange={() => setUseUppercase(false)}
                      className="form-radio h-5 w-5 text-black"
                    />
                    Lowercase
                  </label>
                </div>
              </div>

              {/* Voice Picker */}
              {availableVoices.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="voicePicker" className="font-semibold w-32">Voice:</label>
                  <select
                    id="voicePicker"
                    value={selectedVoiceURI || ''}
                    onChange={(e) => setSelectedVoiceURI(e.target.value)}
                    className="form-select w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {availableVoices.map((voice, index) => (
                      <option key={`${voice.voiceURI}-${index}`} value={voice.voiceURI}>
                        {`${voice.name} (${voice.lang})`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handlePreviewVoice}
                    className="p-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-transform transform active:scale-95"
                    aria-label="Preview selected voice"
                    title="Preview Voice"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Prediction Master Toggle */}
              <div className="flex items-center gap-4">
                <span className="font-semibold w-32">Prediction:</span>
                <label className={`flex items-center gap-2 ${hasTrainingData ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={enablePrediction}
                    onChange={(e) => setEnablePrediction(e.target.checked)}
                    disabled={!hasTrainingData}
                    className="form-checkbox h-5 w-5 text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!hasTrainingData ? 'No training data available for this language' : ''}
                  />
                  Enable
                </label>
                {!hasTrainingData && (
                  <span className="text-sm text-gray-500 italic">
                    (No training data available)
                  </span>
                )}
              </div>

              {/* Training File Upload */}
              <div className={`flex items-center gap-4 transition-opacity ${!enablePrediction ? 'opacity-50' : 'opacity-100'}`}>
                <span className="font-semibold w-32"></span> {/* Spacer */}
                <div className="flex flex-col">
                  <input
                    type="file"
                    id="corpusFile"
                    accept=".txt"
                    onChange={handleFileChange}
                    disabled={!enablePrediction}
                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-600 mt-1">{trainingStatus}</span>
                </div>
              </div>

              {/* Word Prediction Toggle */}
              <div className={`flex items-center gap-4 transition-opacity ${!enablePrediction ? 'opacity-50' : 'opacity-100'}`}>
                <span className="font-semibold w-32"></span> {/* Spacer */}
                <label className={`flex items-center gap-2 ${!enablePrediction ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={showWordPrediction}
                    onChange={(e) => setShowWordPrediction(e.target.checked)}
                    disabled={!enablePrediction}
                    className="form-checkbox h-5 w-5 text-black rounded"
                  />
                  Show Words
                </label>
              </div>

              {/* Appearance Section */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">Appearance</h3>

                {/* Color Theme */}
                <div className="flex items-center gap-2 mb-3">
                  <label htmlFor="theme" className="font-semibold w-32">Color Theme:</label>
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

                {/* Message Font Size */}
                <div className="flex items-center gap-2 mb-3">
                  <label htmlFor="messageFontSize" className="font-semibold w-32">Msg Font:</label>
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
                  <label htmlFor="scannerFontSize" className="font-semibold w-32">Ltr Font:</label>
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
                <div className="flex items-center gap-4">
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
            </div>

            <div
              className="sticky bottom-0 p-4 flex justify-end"
              style={{
                backgroundColor: theme.colors.modalBg,
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-lg font-bold py-2 px-6 rounded-lg transition-transform transform active:scale-95"
                style={{
                  backgroundColor: theme.colors.buttonBg,
                  color: theme.colors.buttonText,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.buttonHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.buttonBg}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Control Bar - Only show if not hidden */}
      {!hideControlBar && (
        <footer
          className="p-2 sm:p-4"
          style={{
            backgroundColor: theme.colors.background,
            borderTop: `2px solid ${theme.colors.border}`,
          }}
        >
          <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* ---- LEFT SIDE ---- */}
        <div className="flex-1 flex justify-start">
          {scanMode === 'one-switch' && (
            <button
                onClick={onSwitch1}
                className="flex-1 max-w-[160px] text-lg sm:text-2xl font-bold py-3 sm:py-4 px-3 sm:px-6 bg-violet-300 text-violet-900 rounded-lg hover:bg-violet-400 transition-transform transform active:scale-95"
                aria-label="Select"
            >
                SELECT
            </button>
          )}
          {scanMode === 'two-switch' && (
            <button
                onClick={onSwitch2}
                className="flex-1 max-w-[160px] text-lg sm:text-2xl font-bold py-3 sm:py-4 px-3 sm:px-6 bg-violet-300 text-violet-900 rounded-lg hover:bg-violet-400 transition-transform transform active:scale-95"
                aria-label="Select"
            >
                SELECT
            </button>
          )}
        </div>

        {/* ---- MIDDLE ---- */}
        <div className="flex justify-center items-center gap-2 sm:gap-4">
          <button
              onClick={onUndo}
              className="flex-1 min-w-[70px] max-w-[160px] text-lg sm:text-2xl font-bold py-3 sm:py-4 px-2 sm:px-6 bg-orange-300 text-orange-900 rounded-lg hover:bg-orange-400 transition-transform transform active:scale-95"
              aria-label="Undo Last Character"
          >
              UNDO
          </button>
          <button
              onClick={onClear}
              className="flex-1 min-w-[70px] max-w-[160px] text-lg sm:text-2xl font-bold py-3 sm:py-4 px-2 sm:px-6 bg-yellow-300 text-yellow-900 rounded-lg hover:bg-yellow-400 transition-transform transform active:scale-95"
              aria-label="Clear Message"
          >
              CLEAR
          </button>
        </div>

        {/* ---- RIGHT SIDE ---- */}
        <div className="flex-1 flex justify-end">
          {scanMode === 'one-switch' && (
            <button
                onClick={handleStartStop}
                className={`flex-1 max-w-[160px] text-lg sm:text-2xl font-bold py-3 sm:py-4 px-3 sm:px-6 rounded-lg transition-transform transform active:scale-95 ${isScanning ? 'bg-red-300 text-red-900 hover:bg-red-400' : 'bg-green-300 text-green-900 hover:bg-green-400'}`}
            >
                {isScanning ? 'STOP' : 'START'}
            </button>
          )}
          {scanMode === 'two-switch' && (
            <button
                onClick={onSwitch1}
                className="flex-1 max-w-[160px] text-lg sm:text-2xl font-bold py-3 sm:py-4 px-3 sm:px-6 bg-violet-300 text-violet-900 rounded-lg hover:bg-violet-400 transition-transform transform active:scale-95"
                aria-label="Next"
            >
                NEXT
            </button>
          )}
        </div>
          </div>
        </footer>
      )}
    </>
  );
};

export default Controls;