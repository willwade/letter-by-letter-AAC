import React, { useLayoutEffect, useRef } from 'react';

interface ScannerProps {
  currentItem: string;
  fontSize: number;
}

const Scanner: React.FC<ScannerProps> = ({ currentItem, fontSize }) => {
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
      // We always measure against the maximum possible font size.
      item.style.fontSize = `${fontSize}px`;

      const containerWidth = container.offsetWidth;
      // Use a padding factor to avoid text touching the edges
      const maxWidth = containerWidth * 0.95; 
      const itemWidth = item.scrollWidth;
      
      if (itemWidth > maxWidth) {
        // If the item is too wide, reduce font size proportionally to fit.
        const newSize = Math.floor(fontSize * (maxWidth / itemWidth));
        item.style.fontSize = `${newSize}px`;
      }
      // If it fits, the font size is already correctly set to the max size.
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
    <div ref={containerRef} className="w-full flex-grow flex items-center justify-center bg-white border-4 border-black rounded-lg p-2 overflow-hidden">
      <span 
        ref={itemRef}
        className="font-bold text-black select-none text-center"
        style={{ 
          // We start with the max font size. The useLayoutEffect will correct it
          // before the user sees it, preventing the flicker.
          fontSize: `${fontSize}px`,
          wordBreak: 'break-word',
        }}
      >
        {currentItem}
      </span>
    </div>
  );
};

export default Scanner;