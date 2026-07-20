import React from 'react';
import type { Theme, TTSEngine } from '../../types';

interface AudioSettingsProps {
  audioEffectsEnabled: boolean;
  setAudioEffectsEnabled: (enabled: boolean) => void;
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
  theme: Theme;

  // Web Speech voice list - shared by both sections when their engine is webspeech.
  availableVoices: SpeechSynthesisVoice[];

  // Message Bar Voice
  messageVoiceEngine: TTSEngine;
  setMessageVoiceEngine: (engine: TTSEngine) => void;
  messageWebspeechVoiceURI: string | null;
  setMessageWebspeechVoiceURI: (uri: string | null) => void;
  messageWebspeechPitch: number;
  setMessageWebspeechPitch: (pitch: number) => void;
  messageWebspeechRate: number;
  setMessageWebspeechRate: (rate: number) => void;
  messageMespeakPitch: number;
  setMessageMespeakPitch: (pitch: number) => void;
  messageMespeakRate: number;
  setMessageMespeakRate: (rate: number) => void;

  // Cue Voice
  cueVoiceEngine: TTSEngine;
  setCueVoiceEngine: (engine: TTSEngine) => void;
  cueWebspeechVoiceURI: string | null;
  setCueWebspeechVoiceURI: (uri: string | null) => void;
  cueWebspeechPitch: number;
  setCueWebspeechPitch: (pitch: number) => void;
  cueWebspeechRate: number;
  setCueWebspeechRate: (rate: number) => void;
  cueMespeakPitch: number;
  setCueMespeakPitch: (pitch: number) => void;
  cueMespeakRate: number;
  setCueMespeakRate: (rate: number) => void;
}

interface VoiceControlsProps {
  label: string;
  engine: TTSEngine;
  setEngine: (engine: TTSEngine) => void;
  webspeechVoiceURI: string | null;
  setWebspeechVoiceURI: (uri: string | null) => void;
  webspeechPitch: number;
  setWebspeechPitch: (pitch: number) => void;
  webspeechRate: number;
  setWebspeechRate: (rate: number) => void;
  mespeakPitch: number;
  setMespeakPitch: (pitch: number) => void;
  mespeakRate: number;
  setMespeakRate: (rate: number) => void;
  availableVoices: SpeechSynthesisVoice[];
  theme: Theme;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  label,
  engine,
  setEngine,
  webspeechVoiceURI,
  setWebspeechVoiceURI,
  webspeechPitch,
  setWebspeechPitch,
  webspeechRate,
  setWebspeechRate,
  mespeakPitch,
  setMespeakPitch,
  mespeakRate,
  setMespeakRate,
  availableVoices,
  theme,
}) => {
  const inputStyle = {
    backgroundColor: theme.colors.inputBg,
    color: theme.colors.inputText,
    borderColor: theme.colors.border,
  };

  return (
    <div className="flex flex-col gap-2 mb-4 p-3 border rounded-md" style={{ borderColor: theme.colors.border }}>
      <div className="font-semibold">{label}</div>

      {/* Engine selector */}
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm">Engine:</span>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name={`${label}-engine`}
            value="webspeech"
            checked={engine === 'webspeech'}
            onChange={() => setEngine('webspeech')}
            className="form-radio h-4 w-4 text-black"
          />
          Web Speech
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name={`${label}-engine`}
            value="mespeak"
            checked={engine === 'mespeak'}
            onChange={() => setEngine('mespeak')}
            className="form-radio h-4 w-4 text-black"
          />
          meSpeak
        </label>
      </div>

      {engine === 'webspeech' ? (
        <>
          {/* Web Speech voice picker */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-ws-voice`} className="w-32 text-sm">
              Voice:
            </label>
            <select
              id={`${label}-ws-voice`}
              value={webspeechVoiceURI || ''}
              onChange={(e) => setWebspeechVoiceURI(e.target.value || null)}
              className="w-64 p-1 border rounded-md text-sm"
              style={inputStyle}
            >
              <option value="">System default</option>
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
          {/* Pitch (Web Speech: 0-2, default 1) */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-ws-pitch`} className="w-32 text-sm">
              Pitch:
            </label>
            <input
              id={`${label}-ws-pitch`}
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={webspeechPitch}
              onChange={(e) => setWebspeechPitch(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{webspeechPitch.toFixed(1)}</span>
          </div>
          {/* Rate (Web Speech: 0.1-10, default 1) */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-ws-rate`} className="w-32 text-sm">
              Rate:
            </label>
            <input
              id={`${label}-ws-rate`}
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={webspeechRate}
              onChange={(e) => setWebspeechRate(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{webspeechRate.toFixed(1)}x</span>
          </div>
        </>
      ) : (
        <>
          {/* Pitch (meSpeak: 0-99, default 50) */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-ms-pitch`} className="w-32 text-sm">
              Pitch:
            </label>
            <input
              id={`${label}-ms-pitch`}
              type="range"
              min="0"
              max="99"
              step="1"
              value={mespeakPitch}
              onChange={(e) => setMespeakPitch(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{mespeakPitch}</span>
          </div>
          {/* Rate (meSpeak: WPM, 50-450, default 175) */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-ms-rate`} className="w-32 text-sm">
              Rate:
            </label>
            <input
              id={`${label}-ms-rate`}
              type="range"
              min="50"
              max="450"
              step="5"
              value={mespeakRate}
              onChange={(e) => setMespeakRate(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{mespeakRate} WPM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-32"></span>
            <span className="text-xs text-gray-600 italic">
              Only the en-us meSpeak voice ships with the app.
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  audioEffectsEnabled,
  setAudioEffectsEnabled,
  auditoryScanningEnabled,
  setAuditoryScanningEnabled,
  auditoryScanningDeviceId,
  setAuditoryScanningDeviceId,
  auditoryDevices,
  onUnlockAudioDevices,
  sinkStatus,
  theme,
  availableVoices,
  messageVoiceEngine,
  setMessageVoiceEngine,
  messageWebspeechVoiceURI,
  setMessageWebspeechVoiceURI,
  messageWebspeechPitch,
  setMessageWebspeechPitch,
  messageWebspeechRate,
  setMessageWebspeechRate,
  messageMespeakPitch,
  setMessageMespeakPitch,
  messageMespeakRate,
  setMessageMespeakRate,
  cueVoiceEngine,
  setCueVoiceEngine,
  cueWebspeechVoiceURI,
  setCueWebspeechVoiceURI,
  cueWebspeechPitch,
  setCueWebspeechPitch,
  cueWebspeechRate,
  setCueWebspeechRate,
  cueMespeakPitch,
  setCueMespeakPitch,
  cueMespeakRate,
  setCueMespeakRate,
}) => {
  return (
    <div className="border-t pt-4">
      <h3 className="font-bold text-lg mb-3">Auditory Features</h3>

      {/* Audio Effects Toggle */}
      <div className="flex items-center gap-4 mb-3">
        <span className="font-semibold w-32">UI Sounds:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={audioEffectsEnabled}
            onChange={(e) => setAudioEffectsEnabled(e.target.checked)}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Play click/beep sounds
        </label>
      </div>

      {/* Auditory Scanning Enable Toggle */}
      <div className="flex items-center gap-4 mb-3">
        <span className="font-semibold w-32">Auditory Scan:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={auditoryScanningEnabled}
            onChange={(e) => setAuditoryScanningEnabled(e.target.checked)}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Read items while scanning
        </label>
      </div>

      {/* Output Device Selector (Only if Auditory Scanning is enabled) */}
      {auditoryScanningEnabled && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label htmlFor="audioDevicePicker" className="font-semibold w-32">
              Scan Output:
            </label>
            <select
              id="audioDevicePicker"
              value={auditoryScanningDeviceId || ''}
              onChange={(e) => setAuditoryScanningDeviceId(e.target.value || null)}
              className="w-64 p-2 border rounded-md"
              style={{
                backgroundColor: theme.colors.inputBg,
                color: theme.colors.inputText,
                borderColor: theme.colors.border,
              }}
            >
              <option value="">Default Output</option>
              {auditoryDevices.map((device, index) => (
                <option key={`${device.deviceId}-${index}`} value={device.deviceId}>
                  {device.label || `Device ${index + 1}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onUnlockAudioDevices}
              className="text-sm py-2 px-3 rounded-md transition-colors"
              style={{
                backgroundColor: theme.colors.buttonBg,
                color: theme.colors.buttonText,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.buttonHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.buttonBg)}
            >
              Unlock Devices
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-32"></span>
            <span className="text-sm text-gray-600 italic">
              Tip: Select headphones for privacy. Edge may require mic permission to show device names.
            </span>
          </div>
          {sinkStatus && (
            <div className="flex items-center gap-2">
              <span className="w-32"></span>
              <span className="text-xs text-gray-500 italic">
                Output routing: {sinkStatus.route} ({sinkStatus.targetSinkId}
                {sinkStatus.error ? ` - ${sinkStatus.error}` : ''})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Bar Voice — what reads out the composed message */}
      <div className="mt-6 mb-2">
        <h4 className="font-semibold text-base">Message Bar Voice</h4>
        <p className="text-xs text-gray-600 italic mb-2">
          Reads the message bar after a selection and when SPEAK is pressed. Default is Web Speech so it sounds
          different from meSpeak cues.
        </p>
        <VoiceControls
          label="Message Bar"
          engine={messageVoiceEngine}
          setEngine={setMessageVoiceEngine}
          webspeechVoiceURI={messageWebspeechVoiceURI}
          setWebspeechVoiceURI={setMessageWebspeechVoiceURI}
          webspeechPitch={messageWebspeechPitch}
          setWebspeechPitch={setMessageWebspeechPitch}
          webspeechRate={messageWebspeechRate}
          setWebspeechRate={setMessageWebspeechRate}
          mespeakPitch={messageMespeakPitch}
          setMespeakPitch={setMessageMespeakPitch}
          mespeakRate={messageMespeakRate}
          setMespeakRate={setMessageMespeakRate}
          availableVoices={availableVoices}
          theme={theme}
        />
      </div>

      {/* Cue Voice — what reads each scanned item */}
      <div className="mt-6 mb-2">
        <h4 className="font-semibold text-base">Cue Voice</h4>
        <p className="text-xs text-gray-600 italic mb-2">
          Reads each item as it is scanned. Default is meSpeak so cues sound different from the Web Speech message
          bar. Only takes effect while Auditory Scan is on.
        </p>
        <VoiceControls
          label="Cue"
          engine={cueVoiceEngine}
          setEngine={setCueVoiceEngine}
          webspeechVoiceURI={cueWebspeechVoiceURI}
          setWebspeechVoiceURI={setCueWebspeechVoiceURI}
          webspeechPitch={cueWebspeechPitch}
          setWebspeechPitch={setCueWebspeechPitch}
          webspeechRate={cueWebspeechRate}
          setWebspeechRate={setCueWebspeechRate}
          mespeakPitch={cueMespeakPitch}
          setMespeakPitch={setCueMespeakPitch}
          mespeakRate={cueMespeakRate}
          setMespeakRate={setCueMespeakRate}
          availableVoices={availableVoices}
          theme={theme}
        />
      </div>
    </div>
  );
};
