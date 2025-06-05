
import { useState, useCallback, useRef, useEffect } from 'react';

export type AnimationType = 
  | 'fadeIn' 
  | 'fadeOut' 
  | 'slideIn' 
  | 'slideOut' 
  | 'scaleIn' 
  | 'scaleOut' 
  | 'bounce' 
  | 'pulse' 
  | 'shake';

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  loop?: boolean;
}

export const useAnimations = () => {
  const [activeAnimations, setActiveAnimations] = useState<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startAnimation = useCallback((
    elementId: string, 
    animation: AnimationType, 
    config: AnimationConfig = {}
  ) => {
    const { duration = 300, delay = 0 } = config;
    
    // Clear existing timeout for this element
    const existingTimeout = timeoutRefs.current.get(elementId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    setActiveAnimations(prev => new Set(prev).add(`${elementId}-${animation}`));

    const timeout = setTimeout(() => {
      setActiveAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${elementId}-${animation}`);
        return newSet;
      });
      timeoutRefs.current.delete(elementId);
    }, duration + delay);

    timeoutRefs.current.set(elementId, timeout);
  }, []);

  const stopAnimation = useCallback((elementId: string, animation: AnimationType) => {
    const timeout = timeoutRefs.current.get(elementId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(elementId);
    }
    
    setActiveAnimations(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${elementId}-${animation}`);
      return newSet;
    });
  }, []);

  const isAnimating = useCallback((elementId: string, animation: AnimationType) => {
    return activeAnimations.has(`${elementId}-${animation}`);
  }, [activeAnimations]);

  const getAnimationClass = useCallback((animation: AnimationType, config: AnimationConfig = {}) => {
    const { duration = 300, easing = 'ease-out' } = config;
    
    const baseClasses = {
      fadeIn: 'animate-fade-in',
      fadeOut: 'animate-fade-out',
      slideIn: 'animate-slide-in',
      slideOut: 'animate-slide-out',
      scaleIn: 'animate-scale-in',
      scaleOut: 'animate-scale-out',
      bounce: 'animate-bounce',
      pulse: 'animate-pulse',
      shake: 'animate-shake'
    };

    return `${baseClasses[animation]} transition-all duration-${duration} ${easing}`;
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  return {
    startAnimation,
    stopAnimation,
    isAnimating,
    getAnimationClass,
    activeAnimations: Array.from(activeAnimations)
  };
};
