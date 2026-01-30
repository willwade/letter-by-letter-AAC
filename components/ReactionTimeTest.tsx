import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactionTimeStats } from '../types';

interface ReactionTimeTestProps {
  playSound: (sound: 'click' | 'beep' | 'select') => void;
  onComplete: (result: ReactionTimeStats, switchType: 'one-switch' | 'two-switch') => void;
  onCancel: () => void;
  theme: any; // Use the theme type from the app
}

type TestStage = 'intro' | 'one-switch' | 'two-switch' | 'complete';

// For two-switch test: 3 positions, one is the target
type TwoSwitchPosition = 0 | 1 | 2;

export function ReactionTimeTest({ playSound, onComplete, onCancel, theme }: ReactionTimeTestProps) {
  const [stage, setStage] = useState<TestStage>('intro');
  const [showStimulus, setShowStimulus] = useState<boolean>(false);
  const [stimulusStartTime, setStimulusStartTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentTrial, setCurrentTrial] = useState<number>(0);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Two-switch specific state
  const [twoSwitchPositions, setTwoSwitchPositions] = useState<TwoSwitchPosition[]>([0, 1, 2]);
  const [targetPosition, setTargetPosition] = useState<TwoSwitchPosition>(1);
  const [currentTwoSwitchIndex, setCurrentTwoSwitchIndex] = useState<number>(0);
  const [showTwoSwitchTarget, setShowTwoSwitchTarget] = useState<boolean>(false);

  const speakRef = useRef<SpeechSynthesisUtterance | null>(null);

  const TOTAL_TRIALS = 3;
  const MIN_DELAY = 1000; // 1 second
  const MAX_DELAY = 3000; // 3 seconds

  // Calculate statistics
  const calculateStats = useCallback((samples: number[], switchType: 'one-switch' | 'two-switch'): ReactionTimeStats => {
    if (samples.length === 0) {
      return {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        samples: [],
        testDate: Date.now(),
        switchType,
      };
    }

    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...samples);
    const max = Math.max(...samples);

    return {
      mean,
      stdDev,
      min,
      max,
      samples,
      testDate: Date.now(),
      switchType,
    };
  }, []);

  // Auditory feedback using speech synthesis
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Play a pleasant "ding" sound using Web Audio API (always works)
  const playDing = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Create a pleasant ding sound (high pitch that fades)
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1); // Quick rise to A6

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Clean up
      setTimeout(() => {
        audioContext.close();
      }, 600);
    } catch (error) {
      console.error('Failed to play ding:', error);
    }
  }, []);

  // Start a one-switch trial
  const startOneSwitchTrial = useCallback(() => {
    console.log('🎯 Starting one-switch trial', currentTrial + 1);
    setShowStimulus(false);
    const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;

    console.log(`⏰ Waiting ${delay}ms before showing stimulus...`);

    const id = setTimeout(() => {
      console.log('✨ Showing stimulus!');
      setShowStimulus(true);
      setStimulusStartTime(performance.now());
      playDing(); // Play the ding sound
      playSound('beep'); // Also try the beep sound
      speak('Select now!');
    }, delay);

    setTimeoutId(id);
  }, [playDing, playSound, speak, currentTrial]);

  // Start a two-switch trial
  const startTwoSwitchTrial = useCallback(() => {
    console.log('🎯 Starting two-switch trial', currentTrial + 1);
    setShowTwoSwitchTarget(false);
    setCurrentTwoSwitchIndex(0);

    // Randomize target position
    const newTarget = Math.floor(Math.random() * 3) as TwoSwitchPosition;
    setTargetPosition(newTarget);

    const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;

    console.log(`⏰ Waiting ${delay}ms before showing stimulus...`);

    const id = setTimeout(() => {
      console.log('✨ Showing two-switch target!');
      setShowTwoSwitchTarget(true);
      setStimulusStartTime(performance.now());
      playDing(); // Play the ding sound
      playSound('beep'); // Also try the beep sound
      speak('Target appeared');
    }, delay);

    setTimeoutId(id);
  }, [playDing, playSound, speak, currentTrial]);

  // Handle one-switch response
  const handleOneSwitchResponse = useCallback(() => {
    if (!showStimulus) return;

    const reactionTime = performance.now() - stimulusStartTime;
    const newReactionTimes = [...reactionTimes, reactionTime];
    setReactionTimes(newReactionTimes);

    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    const nextTrial = currentTrial + 1;

    if (nextTrial >= TOTAL_TRIALS) {
      // One-switch test complete, move to two-switch
      setStage('two-switch');
      setCurrentTrial(0);
      setReactionTimes([]);
      speak('One switch test complete. Starting two switch test.');
      setTimeout(() => startTwoSwitchTrial(), 2000);
    } else {
      // Next trial
      setCurrentTrial(nextTrial);
      setTimeout(() => startOneSwitchTrial(), 1000);
    }
  }, [showStimulus, stimulusStartTime, reactionTimes, currentTrial, timeoutId, startOneSwitchTrial, startTwoSwitchTrial, speak]);

  // Handle two-switch advance (space bar)
  const handleTwoSwitchAdvance = useCallback(() => {
    if (!showTwoSwitchTarget) return;

    playSound('click');
    setCurrentTwoSwitchIndex((prev) => (prev + 1) % 3);
  }, [showTwoSwitchTarget, playSound]);

  // Handle two-switch select (enter key)
  const handleTwoSwitchSelect = useCallback(() => {
    if (!showTwoSwitchTarget) return;

    const currentPosition = twoSwitchPositions[currentTwoSwitchIndex];
    const reactionTime = performance.now() - stimulusStartTime;
    const newReactionTimes = [...reactionTimes, reactionTime];

    // Check if they selected the correct position
    if (currentPosition === targetPosition) {
      setReactionTimes(newReactionTimes);

      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }

      const nextTrial = currentTrial + 1;

      if (nextTrial >= TOTAL_TRIALS) {
        // All tests complete
        const finalStats = calculateStats(newReactionTimes, 'two-switch');
        speak('Test complete!');
        onComplete(finalStats, 'two-switch');
      } else {
        // Next trial
        setCurrentTrial(nextTrial);
        setTimeout(() => startTwoSwitchTrial(), 1000);
      }
    } else {
      // Wrong position selected
      speak('Wrong position. Try again.');
      playDing(); // Ding to indicate selection
      playSound('beep'); // Also try beep
      playSound('click'); // Click for feedback
    }
  }, [showTwoSwitchTarget, currentTwoSwitchIndex, twoSwitchPositions, targetPosition, stimulusStartTime, reactionTimes, currentTrial, timeoutId, calculateStats, onComplete, startTwoSwitchTrial, speak, playSound, playDing]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage === 'one-switch' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleOneSwitchResponse();
      } else if (stage === 'two-switch') {
        if (e.key === ' ') {
          e.preventDefault();
          handleTwoSwitchAdvance();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleTwoSwitchSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, handleOneSwitchResponse, handleTwoSwitchAdvance, handleTwoSwitchSelect]);

  // Start one-switch test
  const startOneSwitchTest = useCallback(() => {
    console.log('🚀 Starting one-switch test');
    setStage('one-switch');
    setCurrentTrial(0);
    setReactionTimes([]);
    const message = 'Starting one switch test. Press your switch when you see the smiley face.';
    speak(message);
    console.log('📢 Speaking:', message);

    setTimeout(() => {
      console.log('⏰ 2 seconds passed, calling startOneSwitchTrial');
      startOneSwitchTrial();
    }, 2000);
  }, [startOneSwitchTrial, speak]);

  // Skip two-switch test (for users who only use one-switch)
  const skipTwoSwitchTest = useCallback(() => {
    if (reactionTimes.length > 0) {
      const stats = calculateStats(reactionTimes, 'one-switch');
      onComplete(stats, 'one-switch');
    } else {
      onCancel();
    }
  }, [reactionTimes, calculateStats, onComplete, onCancel]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [timeoutId]);

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.modalBg,
    color: theme.colors.modalText,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '600px',
    textAlign: 'center',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: theme.colors.buttonBg,
    color: theme.colors.buttonText,
    border: `2px solid ${theme.colors.border}`,
    padding: '1rem 2rem',
    margin: '0.5rem',
    fontSize: '1.2rem',
    cursor: 'pointer',
    borderRadius: '0.5rem',
  };

  const stimulusStyle: React.CSSProperties = {
    fontSize: '10rem',
    marginBottom: '2rem',
  };

  const infoStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  };

  const renderIntro = () => (
    <div style={contentStyle}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Reaction Time Test</h1>
      <p style={infoStyle}>
        This test measures your reaction time to help improve selection accuracy.
      </p>
      <p style={infoStyle}>
        You will see a smiley face appear at random intervals.
      </p>
      <p style={infoStyle}>
        Press your switch as quickly as possible when you see it.
      </p>
      <p style={infoStyle}>
        The test consists of 3 trials for one-switch mode and 3 trials for two-switch mode.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <button style={buttonStyle} onClick={startOneSwitchTest}>
          Start Test
        </button>
        <button style={buttonStyle} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderTest = () => {
    const isOneSwitch = stage === 'one-switch';

    console.log('🎨 Rendering test:', { stage, isOneSwitch, showStimulus, showTwoSwitchTarget, currentTrial });

    return (
      <div style={contentStyle}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          {isOneSwitch ? 'One-Switch Test' : 'Two-Switch Test'}
        </h2>
        <p style={infoStyle}>
          Trial {currentTrial + 1} of {TOTAL_TRIALS}
        </p>

        {isOneSwitch ? (
          // One-switch mode: show smiley face
          showStimulus ? (
            <>
              <div style={stimulusStyle}>😊</div>
              <button style={buttonStyle} onClick={handleOneSwitchResponse}>
                Press Now! (Space or Enter)
              </button>
            </>
          ) : (
            <div style={{ fontSize: '3rem', marginTop: '4rem' }}>Wait for it...</div>
          )
        ) : (
          // Two-switch mode: show 3 positions
          <div style={{ marginTop: '2rem' }}>
            {showTwoSwitchTarget ? (
              <>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                  {[0, 1, 2].map((position) => {
                    const isTarget = position === targetPosition;
                    const isCurrent = position === twoSwitchPositions[currentTwoSwitchIndex];

                    return (
                      <div
                        key={position}
                        style={{
                          ...buttonStyle,
                          padding: '2rem',
                          fontSize: '3rem',
                          backgroundColor: isCurrent ? theme.colors.buttonHover : theme.colors.buttonBg,
                          border: `4px solid ${isTarget ? '#22c55e' : theme.colors.border}`,
                          opacity: isTarget ? 1 : 0.3,
                          transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isTarget ? '😊' : '⚫'}
                      </div>
                    );
                  })}
                </div>
                <p style={infoStyle}>
                  Press Space to scan, Enter to select when smiley is highlighted
                </p>
              </>
            ) : (
              <div style={{ fontSize: '3rem', marginTop: '4rem' }}>Wait for it...</div>
            )}
          </div>
        )}

        <div style={{ marginTop: '2rem', fontSize: '1rem', opacity: 0.7 }}>
          {isOneSwitch
            ? 'Press Space or Enter when you see the smiley face'
            : 'Press Space to move between buttons, Enter to select the smiley'}
        </div>
      </div>
    );
  };

  const renderComplete = () => {
    const oneSwitchStats = reactionTimes.length > 0 ? calculateStats(reactionTimes, 'one-switch') : null;

    return (
      <div style={contentStyle}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Test Complete!</h1>

        {oneSwitchStats && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>One-Switch Results</h2>
            <p style={infoStyle}>Mean: {oneSwitchStats.mean.toFixed(0)} ms</p>
            <p style={infoStyle}>Std Dev: {oneSwitchStats.stdDev.toFixed(0)} ms</p>
            <p style={infoStyle}>Min: {oneSwitchStats.min.toFixed(0)} ms</p>
            <p style={infoStyle}>Max: {oneSwitchStats.max.toFixed(0)} ms</p>
          </div>
        )}

        <p style={infoStyle}>Your reaction times have been saved.</p>
        <p style={infoStyle}>This will help improve selection accuracy.</p>

        <div style={{ marginTop: '2rem' }}>
          <button
            style={buttonStyle}
            onClick={() => {
              if (oneSwitchStats) {
                onComplete(oneSwitchStats, 'one-switch');
              }
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  return <div style={containerStyle}>{stage === 'intro' ? renderIntro() : stage === 'complete' ? renderComplete() : renderTest()}</div>;
}
