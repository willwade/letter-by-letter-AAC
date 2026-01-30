import React from 'react';
import type { ReactionTimeStats } from '../../types';
import { HelpTooltip } from '../HelpTooltip';

interface ErrorCorrectionSettingsProps {
  errorCorrectionEnabled: boolean;
  setErrorCorrectionEnabled: (enabled: boolean) => void;
  errorCorrectionThreshold: number;
  setErrorCorrectionThreshold: (threshold: number) => void;
  showConfidenceIndicator: boolean;
  setShowConfidenceIndicator: (show: boolean) => void;
  enableInference: boolean;
  setEnableInference: (enabled: boolean) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (threshold: number) => void;
  reactionTimeStats: ReactionTimeStats | null;
  setReactionTimeStats: (stats: ReactionTimeStats | null) => void;
  onStartReactionTimeTest: () => void;
  theme: any;
}

export function ErrorCorrectionSettings({
  errorCorrectionEnabled,
  setErrorCorrectionEnabled,
  errorCorrectionThreshold,
  setErrorCorrectionThreshold,
  showConfidenceIndicator,
  setShowConfidenceIndicator,
  enableInference,
  setEnableInference,
  confidenceThreshold,
  setConfidenceThreshold,
  reactionTimeStats,
  setReactionTimeStats,
  onStartReactionTimeTest,
  theme,
}: ErrorCorrectionSettingsProps) {
  const containerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: `1px solid ${theme.colors.border}`,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    color: theme.colors.modalText,
  };

  const settingRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  };

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const labelStyle: React.CSSProperties = {
    color: theme.colors.modalText,
    fontSize: '1rem',
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem',
    border: `2px solid ${theme.colors.border}`,
    borderRadius: '0.25rem',
    backgroundColor: theme.colors.inputBg,
    color: theme.colors.inputText,
    fontSize: '1rem',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    backgroundColor: theme.colors.buttonBg,
    color: theme.colors.buttonText,
    border: `2px solid ${theme.colors.border}`,
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  };

  const statsStyle: React.CSSProperties = {
    backgroundColor: theme.colors.inputBg,
    padding: '1rem',
    borderRadius: '0.5rem',
    marginTop: '1rem',
    border: `2px solid ${theme.colors.border}`,
  };

  const statsTextStyle: React.CSSProperties = {
    color: theme.colors.inputText,
    fontSize: '0.9rem',
    marginBottom: '0.25rem',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: theme.colors.modalText }}>
        Error Correction & Inference
      </h2>

      {/* Error Correction Section */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>Error Correction</h3>

        <div style={settingRowStyle}>
          <div style={labelContainerStyle}>
            <label style={labelStyle}>Enable Error Correction</label>
            <HelpTooltip
              theme={theme}
              content="Automatically detects and suggests corrections for typos using PPM prediction and keyboard adjacency. Suggestions appear as scannable items with orange borders."
            />
          </div>
          <input
            type="checkbox"
            checked={errorCorrectionEnabled}
            onChange={(e) => setErrorCorrectionEnabled(e.target.checked)}
            style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
          />
        </div>

        <div style={settingRowStyle}>
          <div style={labelContainerStyle}>
            <label style={labelStyle}>Correction Threshold</label>
            <HelpTooltip
              theme={theme}
              content="How similar a word must be to suggest a correction (0.0 to 1.0). Higher values (e.g., 0.8) only suggest very similar words. Lower values (e.g., 0.4) suggest more corrections but may include false positives."
            />
          </div>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={errorCorrectionThreshold}
            onChange={(e) => setErrorCorrectionThreshold(parseFloat(e.target.value))}
            style={{ ...inputStyle, width: '100px' }}
          />
        </div>
        <p style={{ fontSize: '0.8rem', color: theme.colors.modalText, opacity: 0.7, marginTop: '0.5rem' }}>
          Higher values require more similarity before suggesting corrections
        </p>
      </div>

      {/* Reaction Time Inference Section */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>Reaction Time Inference</h3>

        <div style={settingRowStyle}>
          <div style={labelContainerStyle}>
            <label style={labelStyle}>Enable Inference</label>
            <HelpTooltip
              theme={theme}
              content="Uses your reaction time to determine selection confidence. If you select faster/slower than your typical reaction time, the system may infer you meant a different item."
            />
          </div>
          <input
            type="checkbox"
            checked={enableInference}
            onChange={(e) => setEnableInference(e.target.checked)}
            style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
          />
        </div>

        <div style={settingRowStyle}>
          <div style={labelContainerStyle}>
            <label style={labelStyle}>Confidence Threshold</label>
            <HelpTooltip
              theme={theme}
              content="Minimum confidence level (0.0 to 1.0) required to accept a selection. If confidence is below this threshold, the system may suggest alternative items. Default: 0.6"
            />
          </div>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            style={{ ...inputStyle, width: '100px' }}
          />
        </div>

        <div style={settingRowStyle}>
          <div style={labelContainerStyle}>
            <label style={labelStyle}>Show Confidence Indicator</label>
            <HelpTooltip
              theme={theme}
              content="Displays a colored dot in the bottom-right corner showing selection confidence: Green (≥80%), Yellow (50-79%), Red (&lt;50%). Also warns if scan speed differs from your recommended speed."
            />
          </div>
          <input
            type="checkbox"
            checked={showConfidenceIndicator}
            onChange={(e) => setShowConfidenceIndicator(e.target.checked)}
            style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Reaction Time Test Section */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>Reaction Time Test</h3>

        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={buttonStyle} onClick={onStartReactionTimeTest}>
            {reactionTimeStats ? 'Retake Reaction Time Test' : 'Take Reaction Time Test'}
          </button>
          <HelpTooltip
            theme={theme}
            content="Measures your reaction time by showing a smiley face at random intervals. Press your switch (Space/Enter) as quickly as possible when you see it. Results calibrate the inference system to your personal timing."
          />
        </div>

        {reactionTimeStats && (
          <div style={statsStyle}>
            <div style={statsTextStyle}>
              <strong>Switch Type:</strong> {reactionTimeStats.switchType}
            </div>
            <div style={statsTextStyle}>
              <strong>Mean:</strong> {reactionTimeStats.mean.toFixed(0)} ms
            </div>
            <div style={statsTextStyle}>
              <strong>Std Dev:</strong> {reactionTimeStats.stdDev.toFixed(0)} ms
            </div>
            <div style={statsTextStyle}>
              <strong>Min:</strong> {reactionTimeStats.min.toFixed(0)} ms
            </div>
            <div style={statsTextStyle}>
              <strong>Max:</strong> {reactionTimeStats.max.toFixed(0)} ms
            </div>
            <div style={statsTextStyle}>
              <strong>Test Date:</strong> {new Date(reactionTimeStats.testDate).toLocaleDateString()}
            </div>
            <button
              style={{ ...buttonStyle, marginTop: '0.5rem', fontSize: '0.8rem' }}
              onClick={() => setReactionTimeStats(null)}
            >
              Clear Stats
            </button>
          </div>
        )}

        {!reactionTimeStats && (
          <p style={{ fontSize: '0.8rem', color: theme.colors.modalText, opacity: 0.7, marginTop: '0.5rem' }}>
            Take this test to calibrate reaction time inference. The test measures your typical reaction time
            to help improve selection accuracy.
          </p>
        )}
      </div>
    </div>
  );
}
