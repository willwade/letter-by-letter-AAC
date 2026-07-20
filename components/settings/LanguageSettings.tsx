import React from 'react';
import type { Theme } from '../../types';
import { PredictionSettings } from './PredictionSettings';

interface LanguageSettingsProps {
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  availableLanguages: string[];
  languageNames: Record<string, string>;
  selectedScript: string | null;
  setSelectedScript: (script: string | null) => void;
  availableScripts: string[];
  useUppercase: boolean;
  setUseUppercase: (uppercase: boolean) => void;
  theme: Theme;

  // Prediction props
  enablePrediction: boolean;
  setEnablePrediction: (enable: boolean) => void;
  showWordPrediction: boolean;
  setShowWordPrediction: (show: boolean) => void;
  onFileUpload: (file: File) => void;
  trainingStatus: string;
  learnedWordsCount: number;
  onExportLearnedData: () => void;
  onClearLearnedData: () => void;
}

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({
  selectedLanguage,
  setSelectedLanguage,
  availableLanguages,
  languageNames,
  selectedScript,
  setSelectedScript,
  availableScripts,
  useUppercase,
  setUseUppercase,
  theme,
  enablePrediction,
  setEnablePrediction,
  showWordPrediction,
  setShowWordPrediction,
  onFileUpload,
  trainingStatus,
  learnedWordsCount,
  onExportLearnedData,
  onClearLearnedData,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Language Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-lg">Language & Alphabet</h3>

        {/* Language Picker */}
        <div className="flex items-center gap-2">
          <label htmlFor="languagePicker" className="font-semibold w-32">
            Language:
          </label>
          <select
            id="languagePicker"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-64 p-2 border rounded-md"
            style={{
              backgroundColor: theme.colors.inputBg,
              color: theme.colors.inputText,
              borderColor: theme.colors.border,
            }}
          >
            {availableLanguages
              .sort((a, b) => {
                const nameA = languageNames[a] || a.toUpperCase();
                const nameB = languageNames[b] || b.toUpperCase();
                return nameA.localeCompare(nameB);
              })
              .map((lang) => (
                <option key={lang} value={lang}>
                  {languageNames[lang] || lang.toUpperCase()}
                </option>
              ))}
          </select>
        </div>

        {/* Script Picker (only show if language has multiple scripts) */}
        {availableScripts.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="scriptPicker" className="font-semibold w-32">
              Script:
            </label>
            <select
              id="scriptPicker"
              value={selectedScript || ''}
              onChange={(e) => setSelectedScript(e.target.value || null)}
              className="w-64 p-2 border rounded-md"
              style={{
                backgroundColor: theme.colors.inputBg,
                color: theme.colors.inputText,
                borderColor: theme.colors.border,
              }}
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

        {/* Voice configuration moved to Audio settings (uses routable engines) */}
      </div>

      {/* Prediction Settings - Separator */}
      <div className="flex flex-col gap-3 border-t pt-4">
        <h3 className="font-bold text-lg">Prediction</h3>
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
      </div>
    </div>
  );
};
