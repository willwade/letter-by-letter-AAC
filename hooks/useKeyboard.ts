import { useEffect, useRef } from 'react';

interface KeyboardConfig {
  // Key mappings
  switch1Key: string; // e.g., 'Space'
  switch2Key: string; // e.g., 'Enter'
  // Input source for switch 1: keyboard key or global left-click
  switch1Input: 'space' | 'click';

  // Callbacks
  onSwitch1: () => void;
  onSwitch2: () => void;
  onHoldAction: (action: string) => void;

  // Settings
  scanMode: 'one-switch' | 'two-switch' | 'auto-scan';
  holdSpeed: number;
  debounceTime: number;
  disabled: boolean; // e.g., when settings modal is open

  // Hold actions
  enableHoldActions: boolean;
  shortHoldDuration: number;
  longHoldDuration: number;
  shortHoldAction: string;
  longHoldAction: string;

  // Audio feedback
  playSound: (sound: 'click' | 'beep') => void;

  // Visual feedback callbacks
  setIsHolding: (value: boolean) => void;
  setHoldProgress: (value: number) => void;
  setHoldZone: (value: 'none' | 'green' | 'red') => void;
}

export function useKeyboard(config: KeyboardConfig) {
  const {
    switch1Key,
    switch2Key,
    switch1Input,
    onSwitch1,
    onSwitch2,
    onHoldAction,
    scanMode,
    holdSpeed,
    debounceTime,
    disabled,
    enableHoldActions,
    shortHoldDuration,
    longHoldDuration,
    shortHoldAction,
    longHoldAction,
    playSound,
    setIsHolding,
    setHoldProgress,
    setHoldZone,
  } = config;

  // Use ref to track hold zone for keyup handler (avoids stale closure)
  const holdZoneRef = useRef<'none' | 'green' | 'red'>('none');
  const holdProgressIntervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Don't attach keyboard listeners when disabled
    if (disabled) {
      return;
    }

    let holdInterval: number | undefined;
    const lastKeyUpTime: { [key: string]: number } = {};
    let shortHoldTimeout: number | undefined;
    let longHoldTimeout: number | undefined;
    // Track press state so a mouseup without a matching mousedown is a no-op
    let switch1Pressed = false;

    // Shared "press" logic for switch 1, invoked by either keydown or mousedown.
    // `isRepeat` mirrors KeyboardEvent.repeat (false on first press, true on auto-repeats).
    const triggerSwitch1Press = (isRepeat: boolean) => {
      // Debounce check - ignore bounces/double-presses on the initial press only
      if (!isRepeat && debounceTime > 0) {
        const now = Date.now();
        const lastUp = lastKeyUpTime[switch1Key] || 0;
        const timeSinceLastUp = now - lastUp;

        if (timeSinceLastUp < debounceTime) {
          console.log(`🚫 Ignored bounce: ${timeSinceLastUp}ms since last release`);
          return;
        }
      }

      // One-switch mode with hold actions enabled
      if (scanMode === 'one-switch' && enableHoldActions) {
        if (!isRepeat) {
          // First press - start tracking hold time
          setIsHolding(true);
          setHoldProgress(0);
          setHoldZone('none');
          holdZoneRef.current = 'none';

          // Animate progress bar and update zones
          console.log(
            `⏱️ Starting hold timer - shortHold: ${shortHoldDuration}ms, longHold: ${longHoldDuration}ms`
          );
          const startTime = Date.now();

          // Clear any existing interval first
          if (holdProgressIntervalRef.current !== undefined) {
            clearInterval(holdProgressIntervalRef.current);
          }

          holdProgressIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / longHoldDuration) * 100, 100);
            console.log(
              `📊 Progress: ${progress.toFixed(1)}%, elapsed: ${elapsed}ms, zone: ${elapsed >= longHoldDuration ? 'red' : elapsed >= shortHoldDuration ? 'green' : 'none'}`
            );
            setHoldProgress(progress);

            // Update zone based on elapsed time (zones are updated in setInterval, beeps in setTimeout)
            if (elapsed >= longHoldDuration) {
              console.log('🔴 Setting zone to RED');
              setHoldZone('red');
              holdZoneRef.current = 'red'; // Update ref immediately
              if (holdProgressIntervalRef.current !== undefined) {
                clearInterval(holdProgressIntervalRef.current);
                holdProgressIntervalRef.current = undefined;
              }
            } else if (elapsed >= shortHoldDuration) {
              console.log('🟢 Setting zone to GREEN');
              setHoldZone('green');
              holdZoneRef.current = 'green'; // Update ref immediately
            }
          }, 16); // ~60fps

          // Set timeout to beep when entering green zone
          shortHoldTimeout = window.setTimeout(() => {
            playSound('beep');
            console.log(`🟢 Entered green zone (${shortHoldDuration}ms)`);
          }, shortHoldDuration);

          // Set timeout to beep when entering red zone
          longHoldTimeout = window.setTimeout(() => {
            playSound('beep');
            console.log(`🔴 Entered red zone (${longHoldDuration}ms)`);
          }, longHoldDuration);
        }
        // Always return when hold actions are enabled to prevent normal switch behavior
        // (both for first press and repeat events)
        return;
      }

      // In two-switch mode, implement custom hold-down behavior with configurable speed
      if (scanMode === 'two-switch') {
        // Detect if this is a repeat event (key is being held)
        if (isRepeat) {
          // Key is being held - check if we should advance based on holdSpeed
          if (!holdInterval) {
            holdInterval = window.setInterval(() => {
              onSwitch1();
            }, holdSpeed);
          }
        } else {
          // First press
          onSwitch1();
        }
      } else {
        // One-switch mode: normal behavior (hold actions disabled or repeat event)
        onSwitch1();
      }
    };

    // Shared "release" logic for switch 1, invoked by either keyup or mouseup.
    const triggerSwitch1Release = () => {
      // Record the time of this release for debounce checking
      lastKeyUpTime[switch1Key] = Date.now();

      // Handle hold actions on release
      if (scanMode === 'one-switch' && enableHoldActions) {
        // Clear timeouts
        if (shortHoldTimeout !== undefined) {
          clearTimeout(shortHoldTimeout);
          shortHoldTimeout = undefined;
        }
        if (longHoldTimeout !== undefined) {
          clearTimeout(longHoldTimeout);
          longHoldTimeout = undefined;
        }

        // Clear progress animation
        if (holdProgressIntervalRef.current !== undefined) {
          clearInterval(holdProgressIntervalRef.current);
          holdProgressIntervalRef.current = undefined;
        }

        // Determine which action to execute based on hold zone
        // Use ref instead of state to get the most up-to-date zone value
        const currentZone = holdZoneRef.current;
        console.log(`🔓 Key released in zone: ${currentZone}`);

        if (currentZone === 'red') {
          // Released in red zone - execute long hold action
          console.log(`🔴 Executing long hold action: ${longHoldAction}`);
          onHoldAction(longHoldAction);
        } else if (currentZone === 'green') {
          // Released in green zone - execute short hold action
          console.log(`🟢 Executing short hold action: ${shortHoldAction}`);
          onHoldAction(shortHoldAction);
        } else {
          // Released before entering any zone - normal switch behavior
          console.log('🖱️ Quick tap - executing normal switch action');
          onSwitch1();
        }

        // Reset states
        setIsHolding(false);
        setHoldProgress(0);
        setHoldZone('none');
        holdZoneRef.current = 'none';
      }

      if (scanMode === 'two-switch') {
        // Clear the hold interval when key is released
        if (holdInterval !== undefined) {
          clearInterval(holdInterval);
          holdInterval = undefined;
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === switch1Key) {
        event.preventDefault();
        triggerSwitch1Press(event.repeat);
      } else if (event.code === switch2Key && scanMode === 'two-switch') {
        event.preventDefault();

        // Check for debounce on switch2 key too
        if (!event.repeat && debounceTime > 0) {
          const now = Date.now();
          const lastUp = lastKeyUpTime[switch2Key] || 0;
          const timeSinceLastUp = now - lastUp;

          if (timeSinceLastUp < debounceTime) {
            // This is a bounce/double-press - ignore it
            console.log(`🚫 Ignored bounce: ${timeSinceLastUp}ms since last release`);
            return;
          }
        }

        // Prevent key repeat for switch2 to avoid repeated selection/speech
        if (event.repeat) {
          return;
        }
        onSwitch2();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === switch1Key) {
        triggerSwitch1Release();
      } else if (event.code === switch2Key) {
        // Record the time of this keyup for debounce checking
        lastKeyUpTime[switch2Key] = Date.now();
      }
    };

    // Global left-click handler - only active when switch1Input === 'click'.
    // Clicks on interactive UI elements (buttons, inputs, etc.) are ignored to
    // avoid double-firing with their existing onClick handlers.
    const handleMouseDown = (event: MouseEvent) => {
      if (switch1Input !== 'click') return;
      // Only react to the primary (left) mouse button
      if (event.button !== 0) return;
      // Ignore clicks that land on interactive controls
      const target = event.target as Element | null;
      if (target && target.closest('button, a, input, select, textarea, label, [role="button"]')) {
        return;
      }
      event.preventDefault();
      switch1Pressed = true;
      triggerSwitch1Press(false);
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (switch1Input !== 'click') return;
      if (event.button !== 0) return;
      if (!switch1Pressed) return;
      switch1Pressed = false;
      triggerSwitch1Release();
    };

    // Keyboard listeners are only attached when Space is the active switch 1 input.
    // This keeps Space from also triggering switch 1 when the user has chosen click instead.
    if (switch1Input === 'space') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    // Mouse listeners are attached whenever click is the active switch 1 input.
    if (switch1Input === 'click') {
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (holdInterval !== undefined) {
        clearInterval(holdInterval);
      }
      if (shortHoldTimeout !== undefined) {
        clearTimeout(shortHoldTimeout);
      }
      if (longHoldTimeout !== undefined) {
        clearTimeout(longHoldTimeout);
      }
      // Note: Don't clear holdProgressIntervalRef here - it should only be cleared on keyup
      // Clearing it here would stop the progress bar mid-hold when the effect re-runs
    };
  }, [
    switch1Key,
    switch2Key,
    switch1Input,
    onSwitch1,
    onSwitch2,
    onHoldAction,
    scanMode,
    holdSpeed,
    debounceTime,
    disabled,
    enableHoldActions,
    shortHoldDuration,
    longHoldDuration,
    shortHoldAction,
    longHoldAction,
    playSound,
    setIsHolding,
    setHoldProgress,
    setHoldZone,
  ]);
}
