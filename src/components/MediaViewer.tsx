
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Play, Pause, Volume2, VolumeX, Maximize2, Download, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaViewerProps {
  src: string;
  alt?: string;
  type: 'image' | 'video';
  className?: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  src,
  alt = '',
  type,
  className
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const downloadMedia = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, alt]);

  const rotateImage = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  if (type === 'image') {
    return (
      <>
        <div className={cn("relative group inline-block", className)}>
          <img
            src={src}
            alt={alt}
            className="max-w-full h-auto rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
            style={{ transform: `rotate(${rotation}deg)` }}
            onClick={() => setIsFullscreen(true)}
            loading="lazy"
          />
          
          {/* Overlay com controles */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(true);
              }}
              className="bg-white/90 text-black hover:bg-white"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                rotateImage();
              }}
              className="bg-white/90 text-black hover:bg-white"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                downloadMedia();
              }}
              className="bg-white/90 text-black hover:bg-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modal de tela cheia */}
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent className="max-w-7xl w-full h-full max-h-screen p-0 bg-black">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain"
                style={{ 
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: 'transform 0.2s ease'
                }}
              />
              
              {/* Controles em tela cheia */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={rotateImage}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadMedia}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Controles de zoom */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  -
                </Button>
                <span className="bg-white/20 text-white px-3 py-1 rounded text-sm">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  +
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <video
        ref={videoRef}
        src={src}
        className="w-full rounded-lg shadow-lg"
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
      >
        Seu navegador não suporta vídeo.
      </video>
      
      {/* Controles customizados overlay */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={togglePlay}
            className="bg-white/90 text-black hover:bg-white"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMute}
            className="bg-white/90 text-black hover:bg-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={downloadMedia}
            className="bg-white/90 text-black hover:bg-white"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
