import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResizeIndicatorProps {
  isResizing: boolean;
  currentHeight: number;
  minHeight: number;
  maxHeight: number;
  className?: string;
}

export const ResizeIndicator: React.FC<ResizeIndicatorProps> = ({
  isResizing,
  currentHeight,
  minHeight,
  maxHeight,
  className
}) => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isResizing) {
      setShowIndicator(true);
      const timer = setTimeout(() => setShowIndicator(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isResizing]);

  const heightPercentage = ((currentHeight - minHeight) / (maxHeight - minHeight)) * 100;
  const isNearMax = heightPercentage > 80;
  const isAtMin = heightPercentage < 10;

  if (!showIndicator) return null;

  return (
    <div className={cn(
      "absolute right-2 bottom-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white/80 transition-all duration-300 border border-white/10",
      isNearMax && "border-orange-400/50 text-orange-200",
      className
    )}>
      <Maximize2 className="h-3 w-3" />
      
      {isAtMin && (
        <>
          <ChevronDown className="h-3 w-3 animate-bounce" />
          <span>Expandindo...</span>
        </>
      )}
      
      {isNearMax && (
        <>
          <ChevronUp className="h-3 w-3 animate-pulse" />
          <span>Altura máxima</span>
        </>
      )}
      
      {!isAtMin && !isNearMax && (
        <>
          <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300"
              style={{ width: `${Math.min(100, heightPercentage)}%` }}
            />
          </div>
          <span>{Math.round(heightPercentage)}%</span>
        </>
      )}
    </div>
  );
}; 