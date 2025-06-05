
import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyMediaProps {
  src: string;
  alt?: string;
  type: 'image' | 'video' | 'audio';
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyMedia: React.FC<LazyMediaProps> = ({
  src,
  alt = '',
  type,
  className,
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const renderSkeleton = () => (
    <Skeleton className={cn("w-full", className)}>
      <div className="flex items-center justify-center h-32 bg-gray-200 dark:bg-gray-700">
        <div className="text-gray-400 text-center">
          {type === 'image' && '🖼️'}
          {type === 'video' && <Play className="h-8 w-8" />}
          {type === 'audio' && '🎵'}
        </div>
      </div>
    </Skeleton>
  );

  const renderError = () => (
    <div className={cn("w-full h-32 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center", className)}>
      <div className="text-center text-gray-500">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Erro ao carregar mídia</p>
        <p className="text-xs text-gray-400">{type}</p>
      </div>
    </div>
  );

  if (hasError) {
    return renderError();
  }

  return (
    <div ref={elementRef} className={cn("relative", className)}>
      {!isInView && renderSkeleton()}
      
      {isInView && (
        <>
          {!isLoaded && renderSkeleton()}
          
          {type === 'image' && (
            <img
              src={src}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                "w-full h-auto object-contain rounded transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
              )}
              loading="lazy"
            />
          )}
          
          {type === 'video' && (
            <video
              src={src}
              onLoadedData={handleLoad}
              onError={handleError}
              controls
              preload="metadata"
              className={cn(
                "w-full h-auto rounded transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
              )}
            >
              Seu navegador não suporta vídeo.
            </video>
          )}
          
          {type === 'audio' && (
            <audio
              src={src}
              onLoadedData={handleLoad}
              onError={handleError}
              controls
              preload="metadata"
              className={cn(
                "w-full transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
              )}
            >
              Seu navegador não suporta áudio.
            </audio>
          )}
        </>
      )}
    </div>
  );
};
