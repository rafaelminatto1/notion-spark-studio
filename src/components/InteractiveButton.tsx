
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InteractiveButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  effect?: 'ripple' | 'lift' | 'glow' | 'bounce' | 'none';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  effect = 'ripple',
  className,
  onClick,
  disabled,
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (effect !== 'ripple' || disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const handleMouseDown = () => {
    if (effect === 'bounce' || effect === 'lift') {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.(e);
  };

  const getEffectClasses = () => {
    switch (effect) {
      case 'lift':
        return cn(
          'transition-all duration-200 ease-out',
          !disabled && 'hover:shadow-lg hover:-translate-y-0.5',
          isPressed && 'transform translate-y-0 shadow-md'
        );
      case 'glow':
        return cn(
          'transition-all duration-300 ease-out',
          !disabled && 'hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105'
        );
      case 'bounce':
        return cn(
          'transition-all duration-150 ease-out',
          isPressed && 'scale-95',
          !disabled && 'hover:scale-105 active:scale-95'
        );
      default:
        return 'transition-all duration-200 ease-out';
    }
  };

  return (
    <Button
      ref={buttonRef}
      variant={variant}
      size={size}
      className={cn(
        'relative overflow-hidden',
        getEffectClasses(),
        className
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
      {...props}
    >
      {children}
      
      {effect === 'ripple' && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animation: 'ripple 0.6s linear'
          }}
        />
      ))}
    </Button>
  );
};
