import React, { useState } from 'react';
import type { ScanMode } from '../types';

interface ControlsProps {
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  scanSpeed: number;
  setScanSpeed: (speed: number) => void;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
  onSwitch1: () => void;
  onSwitch2: () => void;
  onClear: () => void;
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
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  hideControlBar: boolean;
  setHideControlBar: (hide: boolean) => void;
}

const Controls: React.FC<ControlsProps> = ({
  scanMode,
  setScanMode,
  scanSpeed,
  setScanSpeed,
  isScanning,
  setIsScanning,
  onSwitch1,
  onSwitch2,
  onClear,
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
  showSettingsModal,
  setShowSettingsModal,
  hideControlBar,
  setHideControlBar,
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
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

              {/* Scan Speed */}
              {scanMode === 'one-switch' && (
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
              )}

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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePrediction}
                    onChange={(e) => setEnablePrediction(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-black rounded"
                  />
                  Enable
                </label>
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

              {/* Message Font Size */}
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
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

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-lg font-bold py-2 px-6 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-transform transform active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Control Bar - Only show if not hidden */}
      {!hideControlBar && (
        <footer className="p-4 bg-gray-100 border-t-2 border-gray-300">
          <div className="w-full flex items-center justify-between gap-4">
        {/* ---- LEFT SIDE ---- */}
        <div className="flex-1 flex justify-start">
          {scanMode === 'one-switch' && (
            <button
                onClick={onSwitch1}
                className="w-40 text-2xl font-bold py-4 px-6 bg-violet-300 text-violet-900 rounded-lg hover:bg-violet-400 transition-transform transform active:scale-95"
                aria-label="Select"
            >
                SELECT
            </button>
          )}
          {scanMode === 'two-switch' && (
            <button
                onClick={onSwitch2}
                className="w-40 text-2xl font-bold py-4 px-6 bg-violet-300 text-violet-900 rounded-lg hover:bg-violet-400 transition-transform transform active:scale-95"
                aria-label="Select"
            >
                SELECT
            </button>
          )}
        </div>

        {/* ---- MIDDLE ---- */}
        <div className="flex justify-center items-center gap-4">
          <button
              onClick={onClear}
              className="w-40 text-2xl font-bold py-4 px-6 bg-yellow-300 text-yellow-900 rounded-lg hover:bg-yellow-400 transition-transform transform active:scale-95"
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
                className={`w-40 text-2xl font-bold py-4 px-6 rounded-lg transition-transform transform active:scale-95 ${isScanning ? 'bg-red-300 text-red-900 hover:bg-red-400' : 'bg-green-300 text-green-900 hover:bg-green-400'}`}
            >
                {isScanning ? 'STOP' : 'START'}
            </button>
          )}
          {scanMode === 'two-switch' && (
            <button
                onClick={onSwitch1}
                className="w-40 text-2xl font-bold py-4 px-6 bg-violet-300 text-violet-900 rounded-lg hover:bg-violet-400 transition-transform transform active:scale-95"
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