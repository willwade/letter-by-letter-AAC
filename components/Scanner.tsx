import React, { useLayoutEffect, useRef } from 'react';
import type { Theme } from '../types';

interface ScannerProps {
  currentItem: string;
  fontSize: number;
  theme: Theme;
  fontFamily: string;
}

const Scanner: React.FC<ScannerProps> = ({ currentItem, fontSize, theme, fontFamily }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !itemRef.current) {
      return;
    }

    const container = containerRef.current;
    const item = itemRef.current;

    // Make the element invisible to prevent a flicker while we adjust the size.
    // This happens synchronously before the browser has a chance to paint.
    item.style.visibility = 'hidden';

    const calculateAndSetFontSize = () => {
      // Reset styles for measurement
      item.style.whiteSpace = 'nowrap';

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Use 98% of available space - very minimal margin
      const maxWidth = containerWidth * 0.98;
      const maxHeight = containerHeight * 0.98;

      // console.log('📏 Scanner sizing:', {
      //   fontSize,
      //   containerWidth,
      //   containerHeight,
      //   maxWidth,
      //   maxHeight,
      //   currentItem
      // });

      // Binary search to find the largest font size that fits
      let minSize = 12;
      let maxSize = fontSize;
      let bestSize = minSize;

      // Try up to 20 iterations to find optimal size
      for (let i = 0; i < 20; i++) {
        const testSize = Math.floor((minSize + maxSize) / 2);
        item.style.fontSize = `${testSize}px`;

        const itemWidth = item.scrollWidth;
        const itemHeight = item.scrollHeight;

        // console.log(`🔍 Testing ${testSize}px: ${itemWidth}×${itemHeight} vs ${maxWidth}×${maxHeight}`);

        if (itemWidth <= maxWidth && itemHeight <= maxHeight) {
          // This size fits! Try larger
          bestSize = testSize;
          minSize = testSize + 1;
        } else {
          // Too big, try smaller
          maxSize = testSize - 1;
        }

        if (minSize > maxSize) break;
      }

      // Apply the best size we found
      item.style.fontSize = `${bestSize}px`;
      // console.log('✅ Final font size:', bestSize);

      // Allow wrapping for long words if needed
      if (currentItem.length > 10) {
        item.style.whiteSpace = 'normal';
      } else {
        item.style.whiteSpace = 'nowrap';
      }
    };

    calculateAndSetFontSize();

    // Now that the size is correct, make it visible again.
    // This all happens before the browser's next paint.
    item.style.visibility = 'visible';

    // Observe the container for resize events (e.g., window resize) to recalculate.
    const resizeObserver = new ResizeObserver(calculateAndSetFontSize);
    resizeObserver.observe(container);

    // Cleanup observer on unmount or when dependencies change.
    return () => resizeObserver.disconnect();

  }, [currentItem, fontSize]);

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
        className="font-bold select-none text-center"
        style={{
          // We start with the max font size. The useLayoutEffect will correct it
          // before the user sees it, preventing the flicker.
          fontSize: `${fontSize}px`,
          color: theme.colors.scannerText,
          display: 'inline-block',
          maxWidth: '100%',
          fontFamily: fontFamily,
        }}
      >
        {currentItem}
      </span>
    </div>
  );
};

export default Scanner;