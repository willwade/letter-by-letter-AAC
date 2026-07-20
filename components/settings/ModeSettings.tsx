import React from 'react';
import type { ScanMode, Switch1Input } from '../../types';
import { HoldSettings } from './HoldSettings';

interface ModeSettingsProps {
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  switch1Input: Switch1Input;
  setSwitch1Input: (input: Switch1Input) => void;
  scanSpeed: number;
  setScanSpeed: (speed: number) => void;
  firstItemDelay: number;
  setFirstItemDelay: (delay: number) => void;
  holdSpeed: number;
  setHoldSpeed: (speed: number) => void;
  debounceTime: number;
  setDebounceTime: (time: number) => void;

  // Hold Settings props
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
}

export const ModeSettings: React.FC<ModeSettingsProps> = ({
  scanMode,
  setScanMode,
  switch1Input,
  setSwitch1Input,
  scanSpeed,
  setScanSpeed,
  firstItemDelay,
  setFirstItemDelay,
  holdSpeed,
  setHoldSpeed,
  debounceTime,
  setDebounceTime,
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
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Scan Mode */}
      <div className="flex flex-col gap-2">
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
        <div className="flex items-center gap-4">
          <span className="w-32"></span>
          <span className="text-sm text-gray-600 italic">
            {scanMode === 'one-switch'
              ? switch1Input === 'click'
                ? 'Click anywhere to select'
                : 'Press Space to select'
              : switch1Input === 'click'
                ? 'Click anywhere to advance, press Enter to select'
                : 'Press Space to advance, Enter to select'}
          </span>
        </div>
      </div>

      {/* Switch 1 Input Source */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="font-semibold w-32">Switch 1 Input:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="switch1Input"
              value="space"
              checked={switch1Input === 'space'}
              onChange={() => setSwitch1Input('space')}
              className="form-radio h-5 w-5 text-black"
            />
            Space
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="switch1Input"
              value="click"
              checked={switch1Input === 'click'}
              onChange={() => setSwitch1Input('click')}
              className="form-radio h-5 w-5 text-black"
            />
            Left Click
          </label>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-32"></span>
          <span className="text-sm text-gray-600 italic">
            Choose how switch 1 is triggered. Click mode fires on any left-click outside of
            buttons and inputs.
          </span>
        </div>
      </div>

      {/* Scan Speed */}
      {scanMode === 'one-switch' && (
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="scanSpeed" className="font-semibold w-32">
              Speed:
            </label>
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

          {/* First Item Delay */}
          <div className="flex items-center gap-2">
            <label htmlFor="firstItemDelay" className="font-semibold w-32">
              First Item:
            </label>
            <input
              id="firstItemDelay"
              type="range"
              min="500"
              max="5000"
              step="100"
              value={firstItemDelay}
              onChange={(e) => setFirstItemDelay(Number(e.target.value))}
              className="w-48"
            />
            <span>{(firstItemDelay / 1000).toFixed(1)}s</span>
          </div>
        </>
      )}

      {/* Hold Speed for Two-Switch Mode */}
      {scanMode === 'two-switch' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="holdSpeed" className="font-semibold w-32">
              Hold Speed:
            </label>
            <input
              id="holdSpeed"
              type="range"
              min="50"
              max="500"
              step="25"
              value={holdSpeed}
              onChange={(e) => setHoldSpeed(Number(e.target.value))}
              className="w-48"
            />
            <span>{holdSpeed}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-32"></span>
            <span className="text-sm text-gray-600 italic">
              Speed when holding down NEXT button
            </span>
          </div>
        </div>
      )}

      {/* Switch Debounce Time */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="debounceTime" className="font-semibold w-32">
            Debounce:
          </label>
          <input
            id="debounceTime"
            type="range"
            min="0"
            max="500"
            step="50"
            value={debounceTime}
            onChange={(e) => setDebounceTime(Number(e.target.value))}
            className="w-48"
          />
          <span>{debounceTime}ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32"></span>
          <span className="text-sm text-gray-600 italic">
            Ignore accidental double-presses within this time
          </span>
        </div>
      </div>

      {/* Hold Settings */}
      <HoldSettings
        scanMode={scanMode}
        scanSpeed={scanSpeed}
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
    </div>
  );
};
