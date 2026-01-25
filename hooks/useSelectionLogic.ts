import { useCallback } from 'react';
import confetti from 'canvas-confetti';

import type { Dispatch, SetStateAction } from 'react';

interface UseSelectionLogicProps {
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  settings: any; // Type as needed, or partial settings
  predictedWords: string[];
  currentGameTarget: string;
  predictor: any;
  playSound: (sound: 'click' | 'beep' | 'select') => void;
  speak: (text: string) => void;
  setLearnedWordsCount: Dispatch<SetStateAction<number>>;
  setScanIndex: (index: number) => void;
}

export function useSelectionLogic({
  message,
  setMessage,
  settings,
  predictedWords,
  currentGameTarget,
  predictor,
  // playSound, // Not used in this hook currently? Ah wait, App.tsx calls playSound before.
  // Actually, the hook does not call playSound, App.tsx does.
  // Removing it from destructuring to avoid unused var warning, but keeping in props for future or if I missed a usage.
  // Wait, I should check if I used it.
  speak,
  setLearnedWordsCount,
  setScanIndex,
}: UseSelectionLogicProps) {

  const handleClear = useCallback(() => {
    setMessage('');
    // settings.setIsScanning(false); // Can't control scanning state here easily without props
    // We assume App.tsx handles scanning state reset if needed or we pass a callback
    setScanIndex(0);
    if (predictor) predictor.resetContext();
  }, [setMessage, setScanIndex, predictor]);

  const handleUndo = useCallback(() => {
    setMessage((prev) => {
      const newMessage = prev.slice(0, -1);
      if (predictor) {
        predictor.resetContext();
        if (newMessage) predictor.addToContext(newMessage.toLowerCase());
      }
      return newMessage;
    });
    setScanIndex(0);
  }, [setMessage, setScanIndex, predictor]);

  const handleSelect = useCallback(
    (item: string) => {
      // Game Mode
      if (settings.gameMode && currentGameTarget) {
        if (item === 'SPEAK' && message.length === currentGameTarget.length) {
          speak(message);
          settings.setCurrentGameWordIndex((prev: number) => (prev + 1) % settings.gameWordList.length);
          setMessage('');
          return;
        } else if (settings.showWordPrediction && predictedWords.includes(item)) {
          const remainingTarget = currentGameTarget.substring(message.length);
          if (item.toLowerCase() === currentGameTarget.toLowerCase()) {
            setMessage(item);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            speak(item);
            setTimeout(() => {
              settings.setCurrentGameWordIndex((prev: number) => (prev + 1) % settings.gameWordList.length);
              setMessage('');
            }, 1500);
          } else if (remainingTarget.toLowerCase().startsWith(item.toLowerCase())) {
            setMessage(message + item);
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          }
          return;
        } else if (item.length === 1 || item === '_') {
          const expectedChar = currentGameTarget[message.length];
          if (expectedChar === ' ' && item === '_') {
            setMessage((prev) => {
              confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
              return prev + ' ';
            });
          } else if (expectedChar && item.toLowerCase() === expectedChar.toLowerCase()) {
            setMessage((prev) => {
              const newMessage = prev + item;
              confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
              if (newMessage.length === currentGameTarget.length) {
                setTimeout(() => {
                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                  speak(newMessage);
                  setTimeout(() => {
                    settings.setCurrentGameWordIndex((prev: number) => (prev + 1) % settings.gameWordList.length);
                    setMessage('');
                  }, 1500);
                }, 300);
              }
              return newMessage;
            });
          }
          return;
        } else if (item === 'UNDO') {
          handleUndo();
          return;
        } else if (item === 'CLEAR') {
          handleClear();
          return;
        }
      }

      // Normal Mode
      if (settings.showWordPrediction && predictedWords.includes(item)) {
        const lastSpaceIndex = message.lastIndexOf(' ');
        const messageBase = lastSpaceIndex === -1 ? '' : message.substring(0, lastSpaceIndex + 1);
        const newMessage = messageBase + item;
        setMessage(newMessage);
        if (predictor) {
            predictor.resetContext();
            predictor.addToContext(newMessage.toLowerCase());
            const sessionKey = `ppm-session-${settings.selectedLanguage}`;
            const currentSession = localStorage.getItem(sessionKey) || '';
            localStorage.setItem(sessionKey, currentSession + item);
            setLearnedWordsCount((prev) => prev + 1);
        }
      } else if (item === '_') {
        const newMessage = message + ' ';
        setMessage(newMessage);
        if (predictor) {
            predictor.resetContext();
            predictor.addToContext(newMessage.toLowerCase());
        }
      } else if (item === 'UNDO') {
        handleUndo();
      } else if (item === 'CLEAR') {
        handleClear();
      } else if (item === 'SPEAK') {
        if (message) speak(message);
      } else {
        const newMessage = message + item;
        setMessage(newMessage);
        if (predictor) {
            predictor.resetContext();
            predictor.addToContext(newMessage.toLowerCase());
        }
      }
      setScanIndex(0);
    },
    [
      message,
      settings, // be careful with full settings object dependency
      predictedWords,
      currentGameTarget,
      predictor,
      speak,
      setMessage,
      setScanIndex,
      handleUndo,
      handleClear,
      setLearnedWordsCount,
    ]
  );

  return { handleSelect, handleUndo, handleClear };
}
