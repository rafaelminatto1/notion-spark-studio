
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'blur';
  duration?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => { clearTimeout(timer); };
  }, []);

  const getTransitionClasses = () => {
    const baseClasses = `transition-all duration-${duration} ease-out`;
    
    switch (type) {
      case 'fade':
        return cn(
          baseClasses,
          isVisible ? 'opacity-100' : 'opacity-0'
        );
      case 'slide':
        return cn(
          baseClasses,
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
        );
      case 'scale':
        return cn(
          baseClasses,
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        );
      case 'blur':
        return cn(
          baseClasses,
          isVisible ? 'blur-0 opacity-100' : 'blur-sm opacity-0'
        );
      default:
        return baseClasses;
    }
  };

  return (
    <div className={cn(getTransitionClasses(), className)}>
      {children}
    </div>
  );
};
