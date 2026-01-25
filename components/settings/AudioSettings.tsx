import React from 'react';
import type { Theme } from '../../types';

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
}

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
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = theme.colors.buttonHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = theme.colors.buttonBg)
              }
            >
              Unlock Devices
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-32"></span>
            <span className="text-sm text-gray-600 italic">
              Tip: Select headphones for privacy. Edge may require mic permission to show device
              names.
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
    </div>
  );
};
