import React from 'react';
import type { Theme } from '../types';

interface DisplayProps {
  message: string;
  fontSize: number;
  isRTL?: boolean;
  theme: Theme;
}

const Display: React.FC<DisplayProps> = ({ message, fontSize, isRTL = false, theme }) => {
  // Calculate responsive padding based on font size
  const padding = Math.max(8, Math.min(16, fontSize * 0.2));

  return (
    <div
      className="w-full rounded-lg flex items-center overflow-hidden"
      style={{
        padding: `${padding}px`,
        minHeight: `${fontSize * 1.5}px`,
        maxHeight: '25vh', // Limit to 25% of viewport height
        backgroundColor: theme.colors.displayBg,
        border: `2px solid ${theme.colors.border}`,
      }}
    >
      <p
        className="break-words w-full overflow-y-auto"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: `${fontSize * 1.2}px`,
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
          color: theme.colors.displayText,
        }}
      >
        {message}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
};

export default Display;