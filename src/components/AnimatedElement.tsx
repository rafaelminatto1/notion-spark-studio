
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAnimations, AnimationType, AnimationConfig } from '@/hooks/useAnimations';

interface AnimatedElementProps {
  children: React.ReactNode;
  animation?: AnimationType;
  config?: AnimationConfig;
  trigger?: 'mount' | 'hover' | 'click' | 'inView' | 'manual';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation = 'fadeIn',
  config = {},
  trigger = 'mount',
  className,
  as: Component = 'div',
  onAnimationStart,
  onAnimationEnd,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<any>(null);
  const { startAnimation, getAnimationClass } = useAnimations();
  const elementId = useRef(`animated-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (trigger === 'mount' && !hasAnimated) {
      setIsVisible(true);
      setHasAnimated(true);
      startAnimation(elementId.current, animation, config);
      onAnimationStart?.();
      
      const timeout = setTimeout(() => {
        onAnimationEnd?.();
      }, (config.duration || 300) + (config.delay || 0));

      return () => clearTimeout(timeout);
    }
  }, [trigger, animation, config, hasAnimated, startAnimation, onAnimationStart, onAnimationEnd]);

  useEffect(() => {
    if (trigger === 'inView') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true);
            setHasAnimated(true);
            startAnimation(elementId.current, animation, config);
            onAnimationStart?.();
          }
        },
        { threshold: 0.1 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }
  }, [trigger, animation, config, hasAnimated, startAnimation, onAnimationStart]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
      startAnimation(elementId.current, animation, config);
      onAnimationStart?.();
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(true);
      startAnimation(elementId.current, animation, config);
      onAnimationStart?.();
    }
  };

  const animationClass = isVisible ? getAnimationClass(animation, config) : '';

  const componentProps = {
    ref: elementRef,
    className: cn(
      animationClass,
      trigger === 'mount' && !isVisible && 'opacity-0',
      trigger === 'inView' && !isVisible && 'opacity-0',
      className
    ),
    onMouseEnter: handleMouseEnter,
    onClick: handleClick,
    ...props
  };

  return React.createElement(Component, componentProps, children);
};
