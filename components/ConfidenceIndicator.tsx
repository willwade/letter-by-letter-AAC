import React from 'react';

interface ConfidenceIndicatorProps {
  confidence: number;
  showWarning?: boolean;
  recommendedSpeed?: number | null;
  currentSpeed?: number;
  theme: any; // Use the theme type from the app
}

export function ConfidenceIndicator({
  confidence,
  showWarning = false,
  recommendedSpeed,
  currentSpeed,
  theme,
}: ConfidenceIndicatorProps) {
  // Determine color based on confidence level
  const getConfidenceColor = (): string => {
    if (confidence >= 0.8) return '#22c55e'; // Green
    if (confidence >= 0.5) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const color = getConfidenceColor();
  const confidencePercent = Math.round(confidence * 100);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: theme.colors.buttonBg,
    borderRadius: '0.25rem',
    border: `1px solid ${theme.colors.border}`,
    fontSize: '0.7rem',
  };

  const dotStyle: React.CSSProperties = {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  };

  const textStyle: React.CSSProperties = {
    color: theme.colors.buttonText,
    fontSize: '0.7rem',
    fontWeight: 'normal',
  };

  const warningStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: '0.65rem',
    marginTop: '0.1rem',
  };

  return (
    <div style={containerStyle}>
      <div style={dotStyle} />
      <div>
        <div style={textStyle}>{confidencePercent}% confident</div>
        {showWarning && recommendedSpeed && currentSpeed && Math.abs(currentSpeed - recommendedSpeed) > recommendedSpeed * 0.2 && (
          <div style={warningStyle}>
            Recommended scan speed: {recommendedSpeed}ms
          </div>
        )}
      </div>
    </div>
  );
}
