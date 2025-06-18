import type { ReactNode } from 'react';
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppleDevice } from '@/hooks/useAppleDevice';

interface AppleGesturesProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onLongPress?: () => void;
  enableHapticFeedback?: boolean;
  className?: string;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const AppleGestures: React.FC<AppleGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onLongPress,
  enableHapticFeedback = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isTargetDevice, isIOS } = useAppleDevice();
  
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  // Haptic feedback simulation (real haptic feedback needs device API)
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !isIOS) return;
    
    // Vibration API para simulação de haptic feedback
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([10, 10, 20]);
          break;
      }
    }
  };

  const getDistance = (touch1: Touch, touch2: Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    });

    // Multi-touch para pinch
    if (e.touches.length === 2 && onPinch) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
    }

    // Long press detection
    if (onLongPress) {
      const timer = setTimeout(() => {
        triggerHapticFeedback('medium');
        onLongPress();
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press if moving
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch && initialDistance) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      onPinch(scale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const touchEndPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    setTouchEnd(touchEndPoint);

    const deltaX = touchEndPoint.x - touchStart.x;
    const deltaY = touchEndPoint.y - touchStart.y;
    const deltaTime = touchEndPoint.timestamp - touchStart.timestamp;

    // Minimum swipe distance and maximum time for valid swipe
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;

    if (deltaTime > maxSwipeTime) return;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      triggerHapticFeedback('light');
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > minSwipeDistance) {
      triggerHapticFeedback('light');
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset state
    setTouchStart(null);
    setTouchEnd(null);
    setInitialDistance(null);
  };

  // Prevent default touch behaviors that might interfere
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isTargetDevice) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      // Only prevent default for multi-touch or if we have gesture handlers
      if (e.touches.length > 1 || onPinch) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    container.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      container.removeEventListener('touchstart', preventDefaultTouch);
      container.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, [isTargetDevice, onPinch]);

  if (!isTargetDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("apple-swipeable", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: onPinch ? 'none' : 'pan-x pan-y',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
}; 