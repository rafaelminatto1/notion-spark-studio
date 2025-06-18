
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoCloseToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  trigger?: boolean;
}

export const useAutoCloseToast = ({ 
  message, 
  type = 'success', 
  duration = 2000, 
  trigger = false 
}: UseAutoCloseToastProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (trigger) {
      const toastInstance = toast({
        title: type === 'success' ? '✅ Sucesso!' : '📢 Notificação',
        description: message,
        variant: type === 'error' ? 'destructive' : 'default',
        className: `toast-${type} toast-auto-close animate-success-bounce`,
      });

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        toastInstance.dismiss();
      }, duration);

      return () => { clearTimeout(timer); };
    }
  }, [trigger, message, type, duration, toast]);
};
