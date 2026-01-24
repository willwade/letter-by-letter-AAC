import React from 'react';

interface PredictionSettingsProps {
  enablePrediction: boolean;
  setEnablePrediction: (enable: boolean) => void;
  showWordPrediction: boolean;
  setShowWordPrediction: (show: boolean) => void;
  onFileUpload: (file: File) => void;
  trainingStatus: string;
  learnedWordsCount: number;
  onExportLearnedData: () => void;
  onClearLearnedData: () => void;
}

export const PredictionSettings: React.FC<PredictionSettingsProps> = ({
  enablePrediction,
  setEnablePrediction,
  showWordPrediction,
  setShowWordPrediction,
  onFileUpload,
  trainingStatus,
  learnedWordsCount,
  onExportLearnedData,
  onClearLearnedData,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <>
      {/* Prediction Master Toggle */}
      <div className="flex items-center gap-4">
        <span className="font-semibold w-32">Prediction:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enablePrediction}
            onChange={(e) => setEnablePrediction(e.target.checked)}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Enable
        </label>
      </div>

      {/* Training File Upload */}
      <div
        className={`flex items-center gap-4 transition-opacity ${!enablePrediction ? 'opacity-50' : 'opacity-100'}`}
      >
        <span className="font-semibold w-32">Training File:</span>
        <div className="flex flex-col">
          <input
            type="file"
            id="corpusFile"
            accept=".txt"
            onChange={handleFileChange}
            disabled={!enablePrediction}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-gray-600 mt-1">{trainingStatus}</span>
          <span className="text-xs text-gray-500 italic mt-1">
            Upload a .txt file to train the model. Your learned words will be automatically included.
          </span>
        </div>
      </div>

      {/* Word Prediction Toggle */}
      <div
        className={`flex items-center gap-4 transition-opacity ${!enablePrediction ? 'opacity-50' : 'opacity-100'}`}
      >
        <span className="font-semibold w-32"></span> {/* Spacer */}
        <label
          className={`flex items-center gap-2 ${!enablePrediction ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={showWordPrediction}
            onChange={(e) => setShowWordPrediction(e.target.checked)}
            disabled={!enablePrediction}
            className="form-checkbox h-5 w-5 text-black rounded"
          />
          Show Words
        </label>
      </div>

      {/* Adaptive Learning Status */}
      <div
        className={`flex items-center gap-4 transition-opacity ${!enablePrediction ? 'opacity-50' : 'opacity-100'}`}
      >
        <span className="font-semibold w-32"></span> {/* Spacer */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              📚 Learned words: <strong>{learnedWordsCount}</strong>
            </span>
            <button
              onClick={onExportLearnedData}
              disabled={!enablePrediction}
              className="text-xs py-1 px-3 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download complete training data (includes base training corpus + your learned words)"
            >
              📥 Export Training Data
            </button>
            {learnedWordsCount > 0 && (
              <button
                onClick={onClearLearnedData}
                disabled={!enablePrediction}
                className="text-xs py-1 px-3 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear all learned words and reset the model"
              >
                🗑️ Clear Learned
              </button>
            )}
          </div>
          <span className="text-xs text-gray-500 italic">
            The model learns from your word selections. Learned data is automatically included when
            you upload training files.
          </span>
        </div>
      </div>
    </>
  );
};
