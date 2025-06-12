import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, ArrowLeft, ArrowRight, MoreHorizontal, Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para gestos
interface TouchGestureProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => Promise<void>;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  disabled?: boolean;
  className?: string;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: Array<{
    label: string;
    icon: React.ComponentType<any>;
    color: 'blue' | 'green' | 'red' | 'orange';
    onAction: () => void;
  }>;
  rightActions?: Array<{
    label: string;
    icon: React.ComponentType<any>;
    color: 'blue' | 'green' | 'red' | 'orange';
    onAction: () => void;
  }>;
  onSwipeComplete?: (direction: 'left' | 'right') => void;
  className?: string;
}

// Hook para detectar gestos
const useGestureDetection = () => {
  const [gestureState, setGestureState] = useState({
    isGesturing: false,
    gestureType: null as 'swipe' | 'pinch' | 'longPress' | 'doubleTap' | null,
    direction: null as 'up' | 'down' | 'left' | 'right' | null
  });

  const lastTapTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const detectSwipe = useCallback((deltaX: number, deltaY: number) => {
    const threshold = 50;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > threshold || absY > threshold) {
      if (absX > absY) {
        return deltaX > 0 ? 'right' : 'left';
      } else {
        return deltaY > 0 ? 'down' : 'up';
      }
    }
    return null;
  }, []);

  const handleTouchStart = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;

    // Detectar double tap
    if (timeDiff < 300) {
      setGestureState(prev => ({ ...prev, gestureType: 'doubleTap' }));
      return;
    }

    lastTapTime.current = now;

    // Iniciar timer para long press
    longPressTimer.current = setTimeout(() => {
      setGestureState(prev => ({ ...prev, gestureType: 'longPress' }));
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    setGestureState({
      isGesturing: false,
      gestureType: null,
      direction: null
    });
  }, []);

  return {
    gestureState,
    detectSwipe,
    handleTouchStart,
    handleTouchEnd,
    setGestureState
  };
};

// Componente de Pull to Refresh
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ children, onRefresh, disabled = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const y = useMotionValue(0);
  const refreshIconRotate = useTransform(y, [0, 100], [0, 360]);
  const refreshOpacity = useTransform(y, [0, 60, 100], [0, 0.5, 1]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    
    // Só permitir pull to refresh quando estiver no topo
    if (scrollTop === 0 && info.delta.y > 0) {
      const newDistance = Math.min(info.offset.y, 120);
      setPullDistance(newDistance);
      y.set(newDistance);
    }
  }, [disabled, isRefreshing, y]);

  const handlePanEnd = useCallback(async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    if (pullDistance > 80) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    y.set(0);
  }, [disabled, isRefreshing, pullDistance, onRefresh, y]);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull to refresh indicator */}
      <motion.div
        style={{ y, opacity: refreshOpacity }}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center py-4 bg-white/90 backdrop-blur-sm"
      >
        <motion.div
          style={{ rotate: isRefreshing ? undefined : refreshIconRotate }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <RefreshCw className={cn(
            "h-6 w-6 transition-colors",
            pullDistance > 80 ? "text-blue-500" : "text-gray-400"
          )} />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ y }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

// Componente para item com swipe actions
const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeComplete,
  className
}) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);

  const actionColors = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    orange: 'bg-orange-500 text-white'
  };

  const handlePan = useCallback((event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const maxOffset = 120;
    
    // Limitar o offset
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
    x.set(clampedOffset);

    // Determinar direção do swipe
    if (Math.abs(clampedOffset) > 20) {
      setSwipeDirection(clampedOffset > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  }, [x]);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const offset = Math.abs(info.offset.x);
    const velocity = Math.abs(info.velocity.x);

    // Se swipe foi suficiente para completar ação
    if (offset > 80 || velocity > 500) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipeComplete?.(direction);
    }

    // Voltar à posição original
    x.set(0);
    setSwipeDirection(null);
  }, [x, onSwipeComplete]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left actions */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center">
        {leftActions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.onAction}
            className={cn(
              "h-full px-4 flex items-center justify-center min-w-[80px]",
              actionColors[action.color]
            )}
            initial={{ x: -80 }}
            animate={{ 
              x: swipeDirection === 'right' ? 0 : -80,
              opacity: swipeDirection === 'right' ? 1 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-1">
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Right actions */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        {rightActions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.onAction}
            className={cn(
              "h-full px-4 flex items-center justify-center min-w-[80px]",
              actionColors[action.color]
            )}
            initial={{ x: 80 }}
            animate={{ 
              x: swipeDirection === 'left' ? 0 : 80,
              opacity: swipeDirection === 'left' ? 1 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-1">
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        style={{ x }}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="relative z-10 bg-white"
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.1}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Componente principal de gestos
export const TouchGestures: React.FC<TouchGestureProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  onLongPress,
  onDoubleTap,
  disabled = false,
  className
}) => {
  const { gestureState, detectSwipe, handleTouchStart, handleTouchEnd, setGestureState } = useGestureDetection();
  const [isPressing, setIsPressing] = useState(false);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (disabled) return;

    const direction = detectSwipe(info.offset.x, info.offset.y);
    
    if (direction) {
      setGestureState(prev => ({ 
        ...prev, 
        isGesturing: true, 
        gestureType: 'swipe', 
        direction 
      }));
    }
  }, [disabled, detectSwipe, setGestureState]);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    if (disabled) return;

    const direction = detectSwipe(info.offset.x, info.offset.y);
    
    if (direction) {
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }

    handleTouchEnd();
  }, [disabled, detectSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, handleTouchEnd]);

  const handleTapStart = useCallback(() => {
    if (disabled) return;
    setIsPressing(true);
    handleTouchStart();
  }, [disabled, handleTouchStart]);

  const handleTapEnd = useCallback(() => {
    setIsPressing(false);
    
    if (gestureState.gestureType === 'doubleTap') {
      onDoubleTap?.();
    } else if (gestureState.gestureType === 'longPress') {
      onLongPress?.();
    }
    
    handleTouchEnd();
  }, [gestureState.gestureType, onDoubleTap, onLongPress, handleTouchEnd]);

  // Componente com pull to refresh se disponível
  if (onPullToRefresh) {
    return (
      <PullToRefresh onRefresh={onPullToRefresh} disabled={disabled}>
        <motion.div
          className={cn("h-full", className)}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          onTapStart={handleTapStart}
          onTap={handleTapEnd}
          whileTap={{ scale: isPressing ? 0.98 : 1 }}
          transition={{ duration: 0.1 }}
        >
          {children}
        </motion.div>
      </PullToRefresh>
    );
  }

  return (
    <motion.div
      className={cn("h-full", className)}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      onTapStart={handleTapStart}
      onTap={handleTapEnd}
      whileTap={{ scale: isPressing ? 0.98 : 1 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

// Hook para usar gestos em qualquer componente
export const useSwipeGestures = (callbacks: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const startTouch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startTouch.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startTouch.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startTouch.current.x;
      const deltaY = touch.clientY - startTouch.current.y;

      const minSwipeDistance = 50;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > minSwipeDistance || absY > minSwipeDistance) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      }

      startTouch.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [callbacks]);

  return elementRef;
};

// Componente de exemplo para demonstração
export const GestureDemo: React.FC = () => {
  const [lastGesture, setLastGesture] = useState<string>('');
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefresh = async () => {
    setLastGesture('Pull to refresh');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshCount(prev => prev + 1);
  };

  return (
    <div className="h-screen bg-gray-50">
      <TouchGestures
        onSwipeLeft={() => setLastGesture('Swipe Left')}
        onSwipeRight={() => setLastGesture('Swipe Right')}
        onSwipeUp={() => setLastGesture('Swipe Up')}
        onSwipeDown={() => setLastGesture('Swipe Down')}
        onDoubleTap={() => setLastGesture('Double Tap')}
        onLongPress={() => setLastGesture('Long Press')}
        onPullToRefresh={handleRefresh}
        className="p-4"
      >
        <div className="bg-white rounded-lg p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">Gestos Touch</h2>
          <p className="text-gray-600 mb-4">
            Último gesto: <strong>{lastGesture || 'Nenhum'}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Refreshes: {refreshCount}
          </p>
        </div>

        {/* Lista de itens com swipe actions */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <SwipeableItem
              key={item}
              leftActions={[
                {
                  label: 'Curtir',
                  icon: Heart,
                  color: 'red',
                  onAction: () => setLastGesture(`Curtir item ${item}`)
                }
              ]}
              rightActions={[
                {
                  label: 'Compartilhar',
                  icon: Share2,
                  color: 'blue',
                  onAction: () => setLastGesture(`Compartilhar item ${item}`)
                },
                {
                  label: 'Mais',
                  icon: MoreHorizontal,
                  color: 'orange',
                  onAction: () => setLastGesture(`Mais opções item ${item}`)
                }
              ]}
              onSwipeComplete={(direction) => setLastGesture(`Swipe ${direction} completo`)}
              className="bg-white rounded-lg"
            >
              <div className="p-4">
                <h3 className="font-medium">Item {item}</h3>
                <p className="text-sm text-gray-600">
                  Deslize para ver as ações disponíveis
                </p>
              </div>
            </SwipeableItem>
          ))}
        </div>
      </TouchGestures>
    </div>
  );
};

export { SwipeableItem, PullToRefresh };
export default TouchGestures; 