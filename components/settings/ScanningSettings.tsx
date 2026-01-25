import React from 'react';
import type { ScanMode, ScanningStrategy, BlockMode } from '../../types';

interface ScanningSettingsProps {
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  scanSpeed: number;
  setScanSpeed: (speed: number) => void;
  firstItemDelay: number;
  setFirstItemDelay: (delay: number) => void;
  holdSpeed: number;
  setHoldSpeed: (speed: number) => void;
  debounceTime: number;
  setDebounceTime: (time: number) => void;
  scanningStrategy: ScanningStrategy;
  setScanningStrategy: (strategy: ScanningStrategy) => void;
  blockMode: BlockMode;
  setBlockMode: (mode: BlockMode) => void;
  blockSize: number;
  setBlockSize: (size: number) => void;
}

export const ScanningSettings: React.FC<ScanningSettingsProps> = ({
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
  scanningStrategy,
  setScanningStrategy,
  blockMode,
  setBlockMode,
  blockSize,
  setBlockSize,
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
              ? 'Press Space to select'
              : 'Press Space to advance, Enter to select'}
          </span>
        </div>
      </div>

      {/* Scanning Strategy */}
      <div className="flex flex-col gap-2 border-t pt-4 mt-2">
        <h3 className="font-bold text-lg mb-2">Scanning Layout</h3>
        <div className="flex items-center gap-4">
          <span className="font-semibold w-32">Strategy:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scanningStrategy"
              value="linear"
              checked={scanningStrategy === 'linear'}
              onChange={() => setScanningStrategy('linear')}
              className="form-radio h-5 w-5 text-black"
            />
            Linear
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scanningStrategy"
              value="block"
              checked={scanningStrategy === 'block'}
              onChange={() => setScanningStrategy('block')}
              className="form-radio h-5 w-5 text-black"
            />
            Block
          </label>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <span className="w-32"></span>
          <span className="text-sm text-gray-600 italic">
            {scanningStrategy === 'linear'
              ? 'Scan items one by one'
              : 'Scan groups of items (faster for many items)'}
          </span>
        </div>

        {scanningStrategy === 'block' && (
          <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-200 ml-8 mb-2">
            <div className="flex items-center gap-4">
              <span className="font-semibold w-28">Block Mode:</span>
              <select
                value={blockMode}
                onChange={(e) => setBlockMode(e.target.value as BlockMode)}
                className="p-2 border rounded"
              >
                <option value="static">Static (Alphabetical)</option>
                <option value="predictive">Predictive (Dynamic)</option>
                <option value="hybrid">Hybrid (Hot + Fixed)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="blockSize" className="font-semibold w-28">
                Block Size:
              </label>
              <input
                id="blockSize"
                type="range"
                min="3"
                max="10"
                step="1"
                value={blockSize}
                onChange={(e) => setBlockSize(Number(e.target.value))}
                className="w-48"
              />
              <span>{blockSize} items</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 italic">
                {blockMode === 'static' && 'Fixed alphabetical blocks.'}
                {blockMode === 'predictive' && 'Blocks reordered by prediction probability.'}
                {blockMode === 'hybrid' && 'First block predictive, remaining blocks fixed.'}
              </span>
            </div>
          </div>
        )}
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
    </div>
  );
};
