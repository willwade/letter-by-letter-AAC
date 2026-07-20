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
  // Used to clamp zone minima: zones below the scan rate are unusable because
  // the scan would have moved on before the user can release.
  scanSpeed: number;
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
  scanSpeed,
}) => {
  if (scanMode !== 'one-switch') return null;

  // Dynamic minima so the user can't configure a zone shorter than the scan
  // window (it would never fire reliably). Step is 100ms.
  const STEP = 100;
  const greenMin = Math.max(500, scanSpeed);
  const redMin = Math.max(1000, shortHoldDuration + STEP);

  const handleGreenChange = (value: number) => {
    const clamped = Math.max(greenMin, value);
    setShortHoldDuration(clamped);
    // If red is now ≤ green, bump it up to preserve red > green.
    if (longHoldDuration <= clamped) {
      setLongHoldDuration(Math.min(clamped + STEP, 5000));
    }
  };

  const handleRedChange = (value: number) => {
    setLongHoldDuration(Math.max(redMin, value));
  };

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
                min={greenMin}
                max="3000"
                step={STEP}
                value={shortHoldDuration}
                onChange={(e) => handleGreenChange(Number(e.target.value))}
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
                min={redMin}
                max="5000"
                step={STEP}
                value={longHoldDuration}
                onChange={(e) => handleRedChange(Number(e.target.value))}
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
            <span className="text-sm text-gray-600 italic">
              • Scanning pauses while you hold so you can see what you&apos;re committing to
            </span>
            <span className="text-sm text-gray-600 italic">
              • Zone times are clamped to be at least the scan rate ({(scanSpeed / 1000).toFixed(1)}
              s)
            </span>
          </div>
        </>
      )}
    </div>
  );
};
