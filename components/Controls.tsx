import React from 'react';
import type { ScanMode, ThemeName, Theme, ScanningStrategy, BlockMode } from '../types';
import { ScanningSettings } from './settings/ScanningSettings';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { PredictionSettings } from './settings/PredictionSettings';
import { AudioSettings } from './settings/AudioSettings';
import { GameSettings } from './settings/GameSettings';
import { LanguageSettings } from './settings/LanguageSettings';
import { HoldSettings } from './settings/HoldSettings';

interface ControlsProps {
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  scanningStrategy: ScanningStrategy;
  setScanningStrategy: (strategy: ScanningStrategy) => void;
  blockMode: BlockMode;
  setBlockMode: (mode: BlockMode) => void;
  blockSize: number;
  setBlockSize: (size: number) => void;
  scanSpeed: number;
  setScanSpeed: (speed: number) => void;
  firstItemDelay: number;
  setFirstItemDelay: (delay: number) => void;
  holdSpeed: number;
  setHoldSpeed: (speed: number) => void;
  debounceTime: number;
  setDebounceTime: (time: number) => void;
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
  fontFamily: string;
  setFontFamily: (font: string) => void;
  borderWidth: number;
  setBorderWidth: (width: number) => void;
  learnedWordsCount: number;
  onClearLearnedData: () => void;
  onExportLearnedData: () => void;
  gameMode: boolean;
  setGameMode: (enabled: boolean) => void;
  gameWordList: string[];
  setGameWordList: (words: string[]) => void;
  gameTarget: string;
  audioEffectsEnabled: boolean;
  setAudioEffectsEnabled: (enabled: boolean) => void;
  speakAfterPredictions: boolean;
  setSpeakAfterPredictions: (enabled: boolean) => void;
  enableHoldActions: boolean;
  setEnableHoldActions: (enabled: boolean) => void;
  shortHoldDuration: number;
  setShortHoldDuration: (duration: number) => void;
  longHoldDuration: number;
  setLongHoldDuration: (duration: number) => void;
  shortHoldAction: string;
  setShortHoldAction: (action: string) => void;
  longHoldAction: string;
  setLongHoldAction: (action: string) => void;
  auditoryScanningEnabled: boolean;
  setAuditoryScanningEnabled: (enabled: boolean) => void;
  auditoryScanningDeviceId: string | null;
  setAuditoryScanningDeviceId: (deviceId: string | null) => void;
  auditoryDevices: MediaDeviceInfo[];
  onUnlockAudioDevices: () => void;
  sinkStatus: {
    route: 'context' | 'element' | 'unsupported' | 'error';
    targetSinkId: string;
    error?: string;
  } | null;
}

const Controls: React.FC<ControlsProps> = ({
  scanMode,
  setScanMode,
  scanSpeed,
  setScanSpeed,
  firstItemDelay,
  setFirstItemDelay,
  holdSpeed,
  setHoldSpeed,
  debounceTime,
  setDebounceTime,
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
  fontFamily,
  setFontFamily,
  borderWidth,
  setBorderWidth,
  learnedWordsCount,
  onClearLearnedData,
  onExportLearnedData,
  gameMode,
  setGameMode,
  gameWordList,
  setGameWordList,
  gameTarget,
  audioEffectsEnabled,
  setAudioEffectsEnabled,
  speakAfterPredictions,
  setSpeakAfterPredictions,
  enableHoldActions,
  setEnableHoldActions,
  shortHoldDuration,
  setShortHoldDuration,
  longHoldDuration,
  setLongHoldDuration,
  shortHoldAction,
  setShortHoldAction,
  longHoldAction,
  setLongHoldAction,
  auditoryScanningEnabled,
  setAuditoryScanningEnabled,
  auditoryScanningDeviceId,
  setAuditoryScanningDeviceId,
  auditoryDevices,
  onUnlockAudioDevices,
  sinkStatus,
  scanningStrategy,
  setScanningStrategy,
  blockMode,
  setBlockMode,
  blockSize,
  setBlockSize,
}) => {
  const handleStartStop = () => {
    setIsScanning(!isScanning);
  };

  return (
    <>
      {/* Settings Modal - Always rendered regardless of hideControlBar */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 border-0 p-0 w-full h-full cursor-default"
          onClick={() => setShowSettingsModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowSettingsModal(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close settings modal"
        >
          {/* Wrapper div to stop propagation without role conflict */}
          <div
            className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {/* Actual dialog container */}
            <div
              style={{ backgroundColor: theme.colors.modalBg, color: theme.colors.modalText }}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="sticky top-0 p-4 flex justify-between items-center"
                style={{
                  backgroundColor: theme.colors.modalBg,
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                <h2 className="text-2xl font-bold">Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close Settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <ScanningSettings
                  scanMode={scanMode}
                  setScanMode={setScanMode}
                  scanSpeed={scanSpeed}
                  setScanSpeed={setScanSpeed}
                  firstItemDelay={firstItemDelay}
                  setFirstItemDelay={setFirstItemDelay}
                  holdSpeed={holdSpeed}
                  setHoldSpeed={setHoldSpeed}
                  debounceTime={debounceTime}
                  setDebounceTime={setDebounceTime}
                  scanningStrategy={scanningStrategy}
                  setScanningStrategy={setScanningStrategy}
                  blockMode={blockMode}
                  setBlockMode={setBlockMode}
                  blockSize={blockSize}
                  setBlockSize={setBlockSize}
                />

                <HoldSettings
                  scanMode={scanMode}
                  enableHoldActions={enableHoldActions}
                  setEnableHoldActions={setEnableHoldActions}
                  shortHoldDuration={shortHoldDuration}
                  setShortHoldDuration={setShortHoldDuration}
                  longHoldDuration={longHoldDuration}
                  setLongHoldDuration={setLongHoldDuration}
                  shortHoldAction={shortHoldAction}
                  setShortHoldAction={setShortHoldAction}
                  longHoldAction={longHoldAction}
                  setLongHoldAction={setLongHoldAction}
                />

                <LanguageSettings
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                  availableLanguages={availableLanguages}
                  languageNames={languageNames}
                  selectedScript={selectedScript}
                  setSelectedScript={setSelectedScript}
                  availableScripts={availableScripts}
                  useUppercase={useUppercase}
                  setUseUppercase={setUseUppercase}
                  availableVoices={availableVoices}
                  selectedVoiceURI={selectedVoiceURI}
                  setSelectedVoiceURI={setSelectedVoiceURI}
                  theme={theme}
                />

                <PredictionSettings
                  enablePrediction={enablePrediction}
                  setEnablePrediction={setEnablePrediction}
                  showWordPrediction={showWordPrediction}
                  setShowWordPrediction={setShowWordPrediction}
                  onFileUpload={onFileUpload}
                  trainingStatus={trainingStatus}
                  learnedWordsCount={learnedWordsCount}
                  onExportLearnedData={onExportLearnedData}
                  onClearLearnedData={onClearLearnedData}
                />

                <AppearanceSettings
                  themeName={themeName}
                  setThemeName={setThemeName}
                  theme={theme}
                  fontFamily={fontFamily}
                  setFontFamily={setFontFamily}
                  messageFontSize={messageFontSize}
                  setMessageFontSize={setMessageFontSize}
                  scannerFontSize={scannerFontSize}
                  setScannerFontSize={setScannerFontSize}
                  borderWidth={borderWidth}
                  setBorderWidth={setBorderWidth}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={onToggleFullscreen}
                  hideControlBar={hideControlBar}
                  setHideControlBar={setHideControlBar}
                />

                <AudioSettings
                  audioEffectsEnabled={audioEffectsEnabled}
                  setAudioEffectsEnabled={setAudioEffectsEnabled}
                  auditoryScanningEnabled={auditoryScanningEnabled}
                  setAuditoryScanningEnabled={setAuditoryScanningEnabled}
                  auditoryScanningDeviceId={auditoryScanningDeviceId}
                  setAuditoryScanningDeviceId={setAuditoryScanningDeviceId}
                  auditoryDevices={auditoryDevices}
                  onUnlockAudioDevices={onUnlockAudioDevices}
                  sinkStatus={sinkStatus}
                  theme={theme}
                  speakAfterPredictions={speakAfterPredictions}
                  setSpeakAfterPredictions={setSpeakAfterPredictions}
                />

                <GameSettings
                  gameMode={gameMode}
                  setGameMode={setGameMode}
                  gameWordList={gameWordList}
                  setGameWordList={setGameWordList}
                  theme={theme}
                />
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = theme.colors.buttonHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = theme.colors.buttonBg)
                  }
                >
                  Close
                </button>
              </div>
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

            {/* ---- MIDDLE ---- */}
            <div className="flex justify-center items-center gap-2 sm:gap-4">
              {gameMode && gameTarget ? (
                <div className="flex items-center justify-center px-4 py-2 bg-blue-100 rounded-lg border-2 border-blue-400">
                  <span className="text-xl sm:text-3xl font-bold text-blue-900">
                    Type: {gameTarget}
                  </span>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* ---- RIGHT SIDE ---- */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={scanMode === 'one-switch' ? onSwitch1 : onSwitch2}
                className="flex-1 max-w-[160px] text-lg sm:text-2xl font-bold py-3 sm:py-4 px-3 sm:px-6 bg-violet-300 text-violet-900 rounded-lg hover:bg-violet-400 transition-transform transform active:scale-95"
                aria-label="Select"
              >
                SELECT
              </button>
            </div>
          </div>
        </footer>
      )}
    </>
  );
};

export default Controls;
