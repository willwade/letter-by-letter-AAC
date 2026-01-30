import React, { useState, useRef, useEffect } from 'react';

interface HelpTooltipProps {
  content: string;
  theme: any;
}

export function HelpTooltip({ content, theme }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.2rem',
    height: '1.2rem',
    borderRadius: '50%',
    backgroundColor: theme.colors.buttonBg,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.buttonText,
    fontSize: '0.75rem',
    fontWeight: 'bold',
    cursor: 'help',
    marginLeft: '0.25rem',
    flexShrink: 0,
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: '100%',
    top: '0',
    marginLeft: '0.5rem',
    backgroundColor: theme.colors.modalBg,
    color: theme.colors.modalText,
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: `2px solid ${theme.colors.border}`,
    maxWidth: '300px',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    zIndex: 1000,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        style={buttonStyle}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Show help"
        type="button"
      >
        i
      </button>
      {isVisible && (
        <div ref={tooltipRef} style={tooltipStyle}>
          {content}
        </div>
      )}
    </span>
  );
}
