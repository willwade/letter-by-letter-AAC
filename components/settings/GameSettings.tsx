import React, { useState, useEffect } from 'react';
import type { Theme } from '../../types';

interface GameSettingsProps {
  gameMode: boolean;
  setGameMode: (enabled: boolean) => void;
  gameWordList: string[];
  setGameWordList: (words: string[]) => void;
  theme: Theme;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  gameMode,
  setGameMode,
  gameWordList,
  setGameWordList,
  theme,
}) => {
  // Local state for game word list input to allow typing commas
  const [gameWordListInput, setGameWordListInput] = useState<string>(gameWordList.join(', '));

  // Update local input when gameWordList changes externally
  useEffect(() => {
    setGameWordListInput(gameWordList.join(', '));
  }, [gameWordList]);

  return (
    <>
      {/* Game Mode Toggle */}
      <div className="flex items-center gap-4 mb-3">
        <span className="font-semibold w-32">Game Mode:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={gameMode}
            onChange={(e) => setGameMode(e.target.checked)}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Enable
        </label>
      </div>

      {/* Game Word List */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <label htmlFor="gameWordList" className="font-semibold w-32">
            Word List:
          </label>
          <input
            id="gameWordList"
            type="text"
            value={gameWordListInput}
            onChange={(e) => {
              setGameWordListInput(e.target.value);
            }}
            onBlur={() => {
              // Parse and save when user leaves the field
              const words = gameWordListInput
                .split(',')
                .map((w) => w.trim())
                .filter((w) => w.length > 0);
              setGameWordList(words);
            }}
            disabled={!gameMode}
            className="flex-1 p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.colors.inputBg,
              color: theme.colors.inputText,
              borderColor: theme.colors.border,
            }}
            placeholder="hi, hello, cold, hot, tea please"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32"></span>
          <span className="text-sm text-gray-600 italic">
            Comma-separated words to practice typing
          </span>
        </div>
      </div>
    </>
  );
};
