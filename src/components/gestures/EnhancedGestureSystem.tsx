import React, { useRef, useEffect, useState, useCallback, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Tipos de gestos avançados
export type GestureType = 
  | 'swipe' 
  | 'pinch' 
  | 'rotate' 
  | 'longPress' 
  | 'doubleTap' 
  | 'threeFinger' 
  | 'custom';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type GesturePriority = 'low' | 'medium' | 'high' | 'critical';

// Interface para configuração de gestos
export interface GestureConfig {
  id: string;
  type: GestureType;
  priority: GesturePriority;
  enabled: boolean;
  customizable: boolean;
  accessibility: boolean;
  hapticFeedback: 'light' | 'medium' | 'heavy' | 'none';
  minDistance?: number;
  maxTime?: number;
  fingerCount?: number;
  direction?: SwipeDirection;
}

// Context para gerenciamento global de gestos
interface GestureContextType {
  gestures: Record<string, GestureConfig>;
  updateGesture: (id: string, config: Partial<GestureConfig>) => void;
  registerGesture: (config: GestureConfig) => void;
  isGestureEnabled: (id: string) => boolean;
  resolveConflict: (gestures: string[]) => string | null;
}

const GestureContext = createContext<GestureContextType | null>(null);

export const useGestureSystem = () => {
  const context = useContext(GestureContext);
  if (!context) {
    throw new Error('useGestureSystem must be used within GestureProvider');
  }
  return context;
};

// Provider para sistema de gestos
export const GestureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gestures, setGestures] = useState<Record<string, GestureConfig>>({
    swipeLeft: {
      id: 'swipeLeft',
      type: 'swipe',
      priority: 'medium',
      enabled: true,
      customizable: true,
      accessibility: true,
      hapticFeedback: 'light',
      direction: 'left',
      minDistance: 50,
      maxTime: 300,
      fingerCount: 1
    },
    swipeRight: {
      id: 'swipeRight',
      type: 'swipe',
      priority: 'medium',
      enabled: true,
      customizable: true,
      accessibility: true,
      hapticFeedback: 'light',
      direction: 'right',
      minDistance: 50,
      maxTime: 300,
      fingerCount: 1
    },
    pinchZoom: {
      id: 'pinchZoom',
      type: 'pinch',
      priority: 'high',
      enabled: true,
      customizable: false,
      accessibility: false,
      hapticFeedback: 'medium',
      fingerCount: 2
    },
    threeFingerSwipe: {
      id: 'threeFingerSwipe',
      type: 'threeFinger',
      priority: 'critical',
      enabled: true,
      customizable: true,
      accessibility: true,
      hapticFeedback: 'heavy',
      fingerCount: 3
    }
  });

  const updateGesture = useCallback((id: string, config: Partial<GestureConfig>) => {
    setGestures(prev => ({
      ...prev,
      [id]: { ...prev[id], ...config }
    }));
  }, []);

  const registerGesture = useCallback((config: GestureConfig) => {
    setGestures(prev => ({
      ...prev,
      [config.id]: config
    }));
  }, []);

  const isGestureEnabled = useCallback((id: string) => {
    return gestures[id]?.enabled ?? false;
  }, [gestures]);

  // Resolver conflitos de gestos baseado na prioridade
  const resolveConflict = useCallback((gestureIds: string[]) => {
    const priorities = { low: 1, medium: 2, high: 3, critical: 4 };
    
    const validGestures = gestureIds
      .filter(id => gestures[id]?.enabled)
      .sort((a, b) => priorities[gestures[b].priority] - priorities[gestures[a].priority]);

    return validGestures[0] || null;
  }, [gestures]);

  const value = {
    gestures,
    updateGesture,
    registerGesture,
    isGestureEnabled,
    resolveConflict
  };

  return (
    <GestureContext.Provider value={value}>
      {children}
    </GestureContext.Provider>
  );
};

// Hook para haptic feedback avançado
const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy', pattern?: number[]) => {
    if (!('vibrate' in navigator)) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30]
    };

    try {
      navigator.vibrate(pattern || patterns[type]);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, []);

  return { triggerHaptic };
};

// Interface para Enhanced Gesture Handler
interface EnhancedGestureHandlerProps {
  children: React.ReactNode;
  className?: string;
  onGesture?: (gestureType: string, data: any) => void;
  enabledGestures?: string[];
  accessibilityMode?: boolean;
}

export const EnhancedGestureHandler: React.FC<EnhancedGestureHandlerProps> = ({
  children,
  className,
  onGesture,
  enabledGestures,
  accessibilityMode = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gestures, isGestureEnabled, resolveConflict } = useGestureSystem();
  const { triggerHaptic } = useHapticFeedback();

  const [touchPoints, setTouchPoints] = useState<React.Touch[]>([]);
  const [gestureStartTime, setGestureStartTime] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Calcular distância entre dois pontos
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  // Detectar direção do swipe
  const getSwipeDirection = useCallback((start: React.Touch, end: React.Touch): SwipeDirection | null => {
    const deltaX = end.clientX - start.clientX;
    const deltaY = end.clientY - start.clientY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = Array.from(e.touches);
    setTouchPoints(touches);
    setGestureStartTime(Date.now());

    // Long press detection
    if (touches.length === 1 && isGestureEnabled('longPress')) {
      const timer = setTimeout(() => {
        triggerHaptic('medium');
        onGesture?.('longPress', { point: touches[0] });
      }, 500);
      setLongPressTimer(timer);
    }
  }, [isGestureEnabled, triggerHaptic, onGesture]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const touches = Array.from(e.touches);
    
    // Pinch gesture detection
    if (touches.length === 2 && touchPoints.length === 2) {
      const currentDistance = getDistance(touches[0], touches[1]);
      const initialDistance = getDistance(touchPoints[0], touchPoints[1]);
      const scale = currentDistance / initialDistance;
      
      if (isGestureEnabled('pinchZoom')) {
        onGesture?.('pinch', { scale, center: {
          x: (touches[0].clientX + touches[1].clientX) / 2,
          y: (touches[0].clientY + touches[1].clientY) / 2
        }});
      }
    }
  }, [longPressTimer, touchPoints, getDistance, isGestureEnabled, onGesture]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (touchPoints.length === 0) return;

    const endTouch = e.changedTouches[0];
    const startTouch = touchPoints[0];
    const duration = Date.now() - gestureStartTime;

    // Swipe detection
    if (touchPoints.length === 1) {
      const direction = getSwipeDirection(startTouch, endTouch);
      const distance = getDistance(startTouch, endTouch);
      
      if (direction && distance >= 50 && duration <= 300) {
        const gestureId = `swipe${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        if (isGestureEnabled(gestureId)) {
          triggerHaptic('light');
          onGesture?.('swipe', { direction, distance, duration });
        }
      }
    }

    // Three finger gesture
    if (touchPoints.length === 3 && isGestureEnabled('threeFingerSwipe')) {
      triggerHaptic('heavy');
      onGesture?.('threeFingerSwipe', { touchCount: 3 });
    }

    setTouchPoints([]);
  }, [
    longPressTimer, 
    touchPoints, 
    gestureStartTime, 
    getSwipeDirection, 
    getDistance, 
    triggerHaptic, 
    onGesture, 
    isGestureEnabled
  ]);

  // Accessibility: keyboard shortcuts para gestos
  useEffect(() => {
    if (!accessibilityMode) return;

    const handleKeydown = (e: KeyboardEvent) => {
      // Alt + Arrow keys para swipe
      if (e.altKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onGesture?.('swipe', { direction: 'left', accessibility: true });
            break;
          case 'ArrowRight':
            e.preventDefault();
            onGesture?.('swipe', { direction: 'right', accessibility: true });
            break;
          case 'ArrowUp':
            e.preventDefault();
            onGesture?.('swipe', { direction: 'up', accessibility: true });
            break;
          case 'ArrowDown':
            e.preventDefault();
            onGesture?.('swipe', { direction: 'down', accessibility: true });
            break;
        }
      }

      // Ctrl + Space para long press
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        onGesture?.('longPress', { accessibility: true });
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => { document.removeEventListener('keydown', handleKeydown); };
  }, [accessibilityMode, onGesture]);

  return (
    <motion.div
      ref={containerRef}
      className={cn("enhanced-gesture-handler", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente para customização de gestos
interface GestureCustomizerProps {
  gestureId: string;
  className?: string;
}

export const GestureCustomizer: React.FC<GestureCustomizerProps> = ({ 
  gestureId, 
  className 
}) => {
  const { gestures, updateGesture } = useGestureSystem();
  const gesture = gestures[gestureId];

  if (!gesture?.customizable) {
    return null;
  }

  return (
    <div className={cn("gesture-customizer p-4 border rounded-lg bg-gray-50 dark:bg-gray-900", className)}>
      <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
        Customizar {gesture.id}
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 dark:text-gray-300">Habilitado</label>
          <input
            type="checkbox"
            checked={gesture.enabled}
            onChange={(e) => { updateGesture(gestureId, { enabled: e.target.checked }); }}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 dark:text-gray-300">Feedback Háptico</label>
          <select
            value={gesture.hapticFeedback}
            onChange={(e) => { updateGesture(gestureId, { 
              hapticFeedback: e.target.value as any 
            }); }}
            className="text-sm rounded border px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <option value="none">Nenhum</option>
            <option value="light">Leve</option>
            <option value="medium">Médio</option>
            <option value="heavy">Forte</option>
          </select>
        </div>

        {gesture.type === 'swipe' && (
          <>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">Distância Mínima</label>
              <input
                type="number"
                value={gesture.minDistance || 50}
                onChange={(e) => { updateGesture(gestureId, { 
                  minDistance: parseInt(e.target.value) 
                }); }}
                className="text-sm rounded border px-2 py-1 w-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                min="10"
                max="200"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">Tempo Máximo (ms)</label>
              <input
                type="number"
                value={gesture.maxTime || 300}
                onChange={(e) => { updateGesture(gestureId, { 
                  maxTime: parseInt(e.target.value) 
                }); }}
                className="text-sm rounded border px-2 py-1 w-20 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                min="100"
                max="1000"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedGestureHandler; 