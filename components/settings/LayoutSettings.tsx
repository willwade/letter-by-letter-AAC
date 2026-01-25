import React from 'react';
import type { ScanningStrategy, BlockMode } from '../../types';

interface LayoutSettingsProps {
  scanningStrategy: ScanningStrategy;
  setScanningStrategy: (strategy: ScanningStrategy) => void;
  blockMode: BlockMode;
  setBlockMode: (mode: BlockMode) => void;
  blockSize: number;
  setBlockSize: (size: number) => void;
  speakAfterPredictions: boolean;
  setSpeakAfterPredictions: (enabled: boolean) => void;
}

export const LayoutSettings: React.FC<LayoutSettingsProps> = ({
  scanningStrategy,
  setScanningStrategy,
  blockMode,
  setBlockMode,
  blockSize,
  setBlockSize,
  speakAfterPredictions,
  setSpeakAfterPredictions,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Scanning Strategy */}
      <div className="flex flex-col gap-2">
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

      {/* SPEAK Button Placement - Moved from AudioSettings */}
      <div className="flex items-center gap-4 border-t pt-4">
        <span className="font-semibold w-32">SPEAK Button:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={speakAfterPredictions}
            onChange={(e) => setSpeakAfterPredictions(e.target.checked)}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Show after predictions (instead of in action block)
        </label>
      </div>
    </div>
  );
};
