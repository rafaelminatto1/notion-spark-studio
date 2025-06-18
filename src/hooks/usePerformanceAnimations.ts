
import { useState, useEffect, useCallback } from 'react';

interface PerformanceSettings {
  reduceMotion: boolean;
  highPerformance: boolean;
  animationsEnabled: boolean;
}

export const usePerformanceAnimations = () => {
  const [settings, setSettings] = useState<PerformanceSettings>({
    reduceMotion: false,
    highPerformance: true,
    animationsEnabled: true
  });

  useEffect(() => {
    // Check for user's motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSettings(prev => ({
      ...prev,
      reduceMotion: mediaQuery.matches,
      animationsEnabled: !mediaQuery.matches
    }));

    const handleChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({
        ...prev,
        reduceMotion: e.matches,
        animationsEnabled: !e.matches
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => { mediaQuery.removeEventListener('change', handleChange); };
  }, []);

  useEffect(() => {
    // Basic performance detection
    const connection = (navigator as any).connection;
    if (connection) {
      const isSlowConnection = connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
      setSettings(prev => ({
        ...prev,
        highPerformance: !isSlowConnection && !prev.reduceMotion
      }));
    }

    // Memory-based performance detection
    const memory = (performance as any).memory;
    if (memory) {
      const isLowMemory = memory.usedJSHeapSize > memory.totalJSHeapSize * 0.8;
      setSettings(prev => ({
        ...prev,
        highPerformance: prev.highPerformance && !isLowMemory
      }));
    }
  }, []);

  const getAnimationClass = useCallback((
    defaultClass: string,
    reducedClass?: string
  ) => {
    if (!settings.animationsEnabled) {
      return reducedClass || '';
    }
    return settings.highPerformance ? defaultClass : (reducedClass || defaultClass);
  }, [settings]);

  const shouldAnimate = useCallback((complexity: 'low' | 'medium' | 'high' = 'medium') => {
    if (!settings.animationsEnabled) return false;
    
    switch (complexity) {
      case 'low':
        return true;
      case 'medium':
        return settings.highPerformance;
      case 'high':
        return settings.highPerformance && !settings.reduceMotion;
      default:
        return settings.animationsEnabled;
    }
  }, [settings]);

  const toggleAnimations = useCallback((enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      animationsEnabled: enabled
    }));
  }, []);

  return {
    settings,
    getAnimationClass,
    shouldAnimate,
    toggleAnimations
  };
};
