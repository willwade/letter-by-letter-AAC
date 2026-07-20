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

  // Edge TTS voice list - shared by both sections when their engine is edge-tts.
  edgeVoices: { ShortName: string; Name: string; Gender: string; Locale: string }[];

  // Message Bar Voice
  messageVoiceEngine: TTSEngine;
  setMessageVoiceEngine: (engine: TTSEngine) => void;
  messageEdgeVoice: string;
  setMessageEdgeVoice: (voice: string) => void;
  messageEdgeRate: number;
  setMessageEdgeRate: (rate: number) => void;
  messageEdgePitch: number;
  setMessageEdgePitch: (pitch: number) => void;
  messageMespeakPitch: number;
  setMessageMespeakPitch: (pitch: number) => void;
  messageMespeakRate: number;
  setMessageMespeakRate: (rate: number) => void;

  // Cue Voice
  cueVoiceEngine: TTSEngine;
  setCueVoiceEngine: (engine: TTSEngine) => void;
  cueEdgeVoice: string;
  setCueEdgeVoice: (voice: string) => void;
  cueEdgeRate: number;
  setCueEdgeRate: (rate: number) => void;
  cueEdgePitch: number;
  setCueEdgePitch: (pitch: number) => void;
  cueMespeakPitch: number;
  setCueMespeakPitch: (pitch: number) => void;
  cueMespeakRate: number;
  setCueMespeakRate: (rate: number) => void;
}

interface VoiceControlsProps {
  label: string;
  engine: TTSEngine;
  setEngine: (engine: TTSEngine) => void;
  edgeVoice: string;
  setEdgeVoice: (voice: string) => void;
  edgePitch: number;
  setEdgePitch: (pitch: number) => void;
  edgeRate: number;
  setEdgeRate: (rate: number) => void;
  mespeakPitch: number;
  setMespeakPitch: (pitch: number) => void;
  mespeakRate: number;
  setMespeakRate: (rate: number) => void;
  edgeVoices: { ShortName: string; Name: string; Gender: string; Locale: string }[];
  theme: Theme;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  label,
  engine,
  setEngine,
  edgeVoice,
  setEdgeVoice,
  edgePitch,
  setEdgePitch,
  edgeRate,
  setEdgeRate,
  mespeakPitch,
  setMespeakPitch,
  mespeakRate,
  setMespeakRate,
  edgeVoices,
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
            value="edge-tts"
            checked={engine === 'edge-tts'}
            onChange={() => setEngine('edge-tts')}
            className="form-radio h-4 w-4 text-black"
          />
          Edge TTS
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

      {engine === 'edge-tts' ? (
        <>
          {/* Edge voice picker */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-edge-voice`} className="w-32 text-sm">
              Voice:
            </label>
            <select
              id={`${label}-edge-voice`}
              value={edgeVoice}
              onChange={(e) => setEdgeVoice(e.target.value)}
              className="w-72 p-1 border rounded-md text-sm"
              style={inputStyle}
            >
              {edgeVoices.length === 0 ? (
                <option value={edgeVoice}>{edgeVoice} (loading list…)</option>
              ) : (
                edgeVoices.map((voice) => (
                  <option key={voice.ShortName} value={voice.ShortName}>
                    {voice.ShortName} — {voice.Gender} ({voice.Locale})
                  </option>
                ))
              )}
            </select>
          </div>
          {/* Rate (edge: -50% to +200%) */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-edge-rate`} className="w-32 text-sm">
              Rate:
            </label>
            <input
              id={`${label}-edge-rate`}
              type="range"
              min="-50"
              max="100"
              step="5"
              value={edgeRate}
              onChange={(e) => setEdgeRate(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{edgeRate > 0 ? `+${edgeRate}` : edgeRate}%</span>
          </div>
          {/* Pitch (edge: -20Hz to +20Hz) */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${label}-edge-pitch`} className="w-32 text-sm">
              Pitch:
            </label>
            <input
              id={`${label}-edge-pitch`}
              type="range"
              min="-20"
              max="20"
              step="1"
              value={edgePitch}
              onChange={(e) => setEdgePitch(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{edgePitch > 0 ? `+${edgePitch}` : edgePitch}Hz</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-32"></span>
            <span className="text-xs text-gray-600 italic">
              Online (Microsoft Edge Read-Aloud). Honours the Scan Output device picker.
            </span>
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
              Offline. Only the en-us meSpeak voice ships with the app.
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
  edgeVoices,
  messageVoiceEngine,
  setMessageVoiceEngine,
  messageEdgeVoice,
  setMessageEdgeVoice,
  messageEdgeRate,
  setMessageEdgeRate,
  messageEdgePitch,
  setMessageEdgePitch,
  messageMespeakPitch,
  setMessageMespeakPitch,
  messageMespeakRate,
  setMessageMespeakRate,
  cueVoiceEngine,
  setCueVoiceEngine,
  cueEdgeVoice,
  setCueEdgeVoice,
  cueEdgeRate,
  setCueEdgeRate,
  cueEdgePitch,
  setCueEdgePitch,
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
          Reads the message bar after a selection and when SPEAK is pressed. Default is Edge TTS - high-quality,
          routable, and distinct from meSpeak cues.
        </p>
        <VoiceControls
          label="Message Bar"
          engine={messageVoiceEngine}
          setEngine={setMessageVoiceEngine}
          edgeVoice={messageEdgeVoice}
          setEdgeVoice={setMessageEdgeVoice}
          edgePitch={messageEdgePitch}
          setEdgePitch={setMessageEdgePitch}
          edgeRate={messageEdgeRate}
          setEdgeRate={setMessageEdgeRate}
          mespeakPitch={messageMespeakPitch}
          setMespeakPitch={setMessageMespeakPitch}
          mespeakRate={messageMespeakRate}
          setMespeakRate={setMessageMespeakRate}
          edgeVoices={edgeVoices}
          theme={theme}
        />
      </div>

      {/* Cue Voice — what reads each scanned item */}
      <div className="mt-6 mb-2">
        <h4 className="font-semibold text-base">Cue Voice</h4>
        <p className="text-xs text-gray-600 italic mb-2">
          Reads each item as it is scanned. Default is meSpeak (offline, low-latency) so cues sound different from
          the Edge TTS message bar. Only takes effect while Auditory Scan is on.
        </p>
        <VoiceControls
          label="Cue"
          engine={cueVoiceEngine}
          setEngine={setCueVoiceEngine}
          edgeVoice={cueEdgeVoice}
          setEdgeVoice={setCueEdgeVoice}
          edgePitch={cueEdgePitch}
          setEdgePitch={setCueEdgePitch}
          edgeRate={cueEdgeRate}
          setEdgeRate={setCueEdgeRate}
          mespeakPitch={cueMespeakPitch}
          setMespeakPitch={setCueMespeakPitch}
          mespeakRate={cueMespeakRate}
          setMespeakRate={setCueMespeakRate}
          edgeVoices={edgeVoices}
          theme={theme}
        />
      </div>
    </div>
  );
};
