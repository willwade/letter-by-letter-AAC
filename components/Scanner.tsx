import React, { useLayoutEffect, useRef } from 'react';
import type { Theme } from '../types';
import { SPEAK, UNDO, CLEAR, SPACE } from '../constants';

interface ScannerProps {
  currentItem: string;
  fontSize: number;
  theme: Theme;
  fontFamily: string;
  borderWidth: number;
  predictedLetters: string[];
  predictedWords: string[];
}

const Scanner: React.FC<ScannerProps> = ({
  currentItem,
  fontSize,
  theme,
  fontFamily,
  borderWidth,
  predictedLetters,
  predictedWords,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !itemRef.current) {
      return;
    }

    const container = containerRef.current;
    const item = itemRef.current;

    let resizeTimeoutId: number | null = null;

    const calculateAndSetFontSize = () => {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      // Try font size starting from the maximum and work down
      let currentSize = fontSize;

      // Allow up to 5% margin
      const maxWidth = containerWidth * 0.95;
      const maxHeight = containerHeight * 0.95;

      // Start with the requested size and reduce if needed
      while (currentSize > 12) {
        item.style.fontSize = `${currentSize}px`;
        item.style.whiteSpace = 'nowrap';

        const itemWidth = item.scrollWidth;
        const itemHeight = item.scrollHeight;

        if (itemWidth <= maxWidth && itemHeight <= maxHeight) {
          // This size fits!
          break;
        }

        // Too big, reduce by 10% and try again
        currentSize = Math.max(12, Math.floor(currentSize * 0.9));
      }

      item.style.fontSize = `${currentSize}px`;

      // Allow wrapping for long words if needed
      if (currentItem.length > 10) {
        item.style.whiteSpace = 'normal';
      } else {
        item.style.whiteSpace = 'nowrap';
      }
    };

    const handleResize = () => {
      // Debounce resize observer callback
      if (resizeTimeoutId !== null) {
        clearTimeout(resizeTimeoutId);
      }
      resizeTimeoutId = window.setTimeout(() => {
        calculateAndSetFontSize();
        resizeTimeoutId = null;
      }, 100);
    };

    calculateAndSetFontSize();

    // Observe the container for resize events
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup observer on unmount or when dependencies change
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutId !== null) {
        clearTimeout(resizeTimeoutId);
      }
    };
  }, [currentItem, fontSize]);

  // Determine if current item is an action or prediction
  const isAction =
    currentItem === SPEAK || currentItem === UNDO || currentItem === CLEAR || currentItem === SPACE;
  const isPrediction =
    predictedLetters.includes(currentItem) || predictedWords.includes(currentItem);

  // Determine text stroke (outline) style for the letter itself
  let textStroke = '';
  if (borderWidth > 0) {
    if (isAction) {
      textStroke = `${borderWidth}px ${theme.colors.actionBorder}`;
    } else if (isPrediction) {
      textStroke = `${borderWidth}px ${theme.colors.predictionBorder}`;
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex-grow flex items-center justify-center rounded-lg overflow-hidden"
      style={{
        backgroundColor: theme.colors.scannerBg,
        border: `4px solid ${theme.colors.border}`,
      }}
    >
      <span
        ref={itemRef}
        className="font-bold select-none"
        style={{
          fontSize: `${fontSize}px`,
          color: theme.colors.scannerText,
          fontFamily: fontFamily,
          WebkitTextStroke: textStroke,
          textStroke: textStroke,
          lineHeight: '1',
          display: 'inline-block',
        }}
      >
        {currentItem}
      </span>
    </div>
  );
};

export default Scanner;
