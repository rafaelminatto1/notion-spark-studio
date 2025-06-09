import { useCallback } from 'react';

export const useHapticFeedback = () => {
  const triggerAction = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Vibração curta para ações
    }
  }, []);

  const triggerSuccess = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10]); // Padrão de vibração para sucesso
    }
  }, []);

  const triggerError = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]); // Padrão de vibração para erro
    }
  }, []);

  return {
    triggerAction,
    triggerSuccess,
    triggerError
  };
}; 