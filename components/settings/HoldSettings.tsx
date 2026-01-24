import React from 'react';

interface HoldSettingsProps {
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
  scanMode: 'one-switch' | 'two-switch' | 'auto-scan';
}

export const HoldSettings: React.FC<HoldSettingsProps> = ({
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
  scanMode,
}) => {
  if (scanMode !== 'one-switch') return null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <span className="font-semibold w-32">Hold Actions:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enableHoldActions}
            onChange={(e) => setEnableHoldActions(e.target.checked)}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Enable hold-to-activate actions
        </label>
      </div>

      {enableHoldActions && (
        <>
          {/* Short Hold - Green Zone */}
          <div className="flex flex-col gap-2 ml-8">
            <div className="flex items-center gap-2">
              <label htmlFor="shortHoldDuration" className="font-semibold w-32">
                Green Zone:
              </label>
              <input
                id="shortHoldDuration"
                type="range"
                min="500"
                max="3000"
                step="100"
                value={shortHoldDuration}
                onChange={(e) => setShortHoldDuration(Number(e.target.value))}
                className="w-48"
              />
              <span className="w-16">{(shortHoldDuration / 1000).toFixed(1)}s</span>
              <select
                value={shortHoldAction}
                onChange={(e) => setShortHoldAction(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="SPEAK">Speak</option>
                <option value="UNDO">Undo</option>
                <option value="CLEAR">Clear</option>
                <option value="RESTART">Restart Scan</option>
              </select>
            </div>
          </div>

          {/* Long Hold - Red Zone */}
          <div className="flex flex-col gap-2 ml-8">
            <div className="flex items-center gap-2">
              <label htmlFor="longHoldDuration" className="font-semibold w-32">
                Red Zone:
              </label>
              <input
                id="longHoldDuration"
                type="range"
                min="1000"
                max="5000"
                step="100"
                value={longHoldDuration}
                onChange={(e) => setLongHoldDuration(Number(e.target.value))}
                className="w-48"
              />
              <span className="w-16">{(longHoldDuration / 1000).toFixed(1)}s</span>
              <select
                value={longHoldAction}
                onChange={(e) => setLongHoldAction(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="SPEAK">Speak</option>
                <option value="UNDO">Undo</option>
                <option value="CLEAR">Clear</option>
                <option value="RESTART">Restart Scan</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1 ml-8">
            <span className="text-sm text-gray-600 italic">• Quick tap: Normal selection</span>
            <span className="text-sm text-gray-600 italic">
              • Hold & release in green: Execute green zone action
            </span>
            <span className="text-sm text-gray-600 italic">
              • Hold & release in red: Execute red zone action
            </span>
            <span className="text-sm text-gray-600 italic">• Beep when entering each zone</span>
          </div>
        </>
      )}
    </div>
  );
};
