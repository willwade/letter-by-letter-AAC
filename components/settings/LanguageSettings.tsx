import React from 'react';
import type { Theme } from '../../types';

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
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string) => void;
  theme: Theme;
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
  availableVoices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  theme,
}) => {
  const handlePreviewVoice = () => {
    if (!selectedVoiceURI || !window.speechSynthesis) return;

    const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
    if (!selectedVoice) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('This is a test of the selected voice.');
    utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="border-t pt-4">
      <h3 className="font-bold text-lg mb-3">Language & Alphabet</h3>

      {/* Language Picker */}
      <div className="flex items-center gap-2 mb-3">
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
        <div className="flex items-center gap-2 mb-3">
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
      <div className="flex items-center gap-4 mb-3">
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

      {/* Voice Picker */}
      {availableVoices.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="voicePicker" className="font-semibold w-32">
            Voice:
          </label>
          <select
            id="voicePicker"
            value={selectedVoiceURI || ''}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            className="w-64 p-2 border rounded-md"
            style={{
              backgroundColor: theme.colors.inputBg,
              color: theme.colors.inputText,
              borderColor: theme.colors.border,
            }}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
