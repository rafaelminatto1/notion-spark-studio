
import { useState, useCallback } from 'react';

export const useNavigation = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const navigateTo = useCallback((fileId: string) => {
    setHistory(prev => {
      const newHistory = [...prev.slice(0, currentIndex + 1), fileId];
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [canGoBack, history, currentIndex]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [canGoForward, history, currentIndex]);

  return {
    navigateTo,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    history,
    currentIndex
  };
};
