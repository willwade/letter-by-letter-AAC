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
}) => {
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="w-full flex flex-col items-center justify-between gap-4">
      {/* Collapsible Settings Panel */}
      {showSettings && (
        <div className="w-full p-4 mb-4 border rounded-lg bg-gray-50 flex flex-col items-center justify-between gap-6 animate-fade-in-down">
          <div className="w-full flex flex-col gap-4">
            {/* Scan Mode */}
            <div className="flex items-center gap-4">
              <span className="font-semibold w-28">Mode:</span>
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
                <label htmlFor="scanSpeed" className="font-semibold w-28">Speed:</label>
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
                <label htmlFor="voicePicker" className="font-semibold w-28">Voice:</label>
                <select
                  id="voicePicker"
                  value={selectedVoiceURI || ''}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="form-select w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
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
              <span className="font-semibold w-28">Prediction:</span>
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
              <span className="font-semibold w-28"></span> {/* Spacer */}
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
              <span className="font-semibold w-28"></span> {/* Spacer */}
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
                <label htmlFor="messageFontSize" className="font-semibold w-28">Msg Font:</label>
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
                <label htmlFor="scannerFontSize" className="font-semibold w-28">Ltr Font:</label>
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
              <span className="font-semibold w-28">Display:</span>
              <button
                onClick={onToggleFullscreen}
                className="font-semibold py-2 px-4 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-transform transform active:scale-95"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </button>
            </div>
          </div>
          <button onClick={() => setShowSettings(false)} className="mt-2 text-lg font-bold py-2 px-4 bg-gray-300 text-black rounded-lg hover:bg-gray-400">
            Close
          </button>
        </div>
      )}

      {/* Main Control Bar */}
      <div className="w-full flex items-center justify-between gap-4">
        <div className="flex-1 flex justify-start">
          {!showSettings && (
            <button onClick={() => setShowSettings(true)} className="text-xl font-bold py-3 px-5 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-transform transform active:scale-95">
              Settings
            </button>
          )}
        </div>

        <div className="flex justify-center md:justify-end gap-4">
          <button
            onClick={onClear}
            className="w-40 text-2xl font-bold py-4 px-6 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-transform transform active:scale-95"
            aria-label="Clear Message"
          >
            CLEAR
          </button>
          {scanMode === 'one-switch' ? (
            <button
              onClick={handleStartStop}
              className={`w-40 text-2xl font-bold py-4 px-6 rounded-lg transition-transform transform active:scale-95 ${isScanning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
            >
              {isScanning ? 'STOP' : 'START'}
            </button>
          ) : null}
          
          <button
            onClick={onSwitch1}
            className="w-40 text-2xl font-bold py-4 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-transform transform active:scale-95"
            aria-label={scanMode === 'one-switch' ? 'Select' : 'Next'}
          >
            {scanMode === 'one-switch' ? 'SELECT' : 'NEXT'}
          </button>

          {scanMode === 'two-switch' && (
            <button
              onClick={onSwitch2}
              className="w-40 text-2xl font-bold py-4 px-6 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-transform transform active:scale-95"
              aria-label="Select"
            >
              SELECT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;