
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Download, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Info,
  Filter,
  ArrowLeft,
  ArrowRight,
  Home
} from 'lucide-react';
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
  const [volume, setVolume] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100
  });
  const [loaded, setLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isFullscreen) return;

    switch (e.key) {
      case 'Escape':
        setIsFullscreen(false);
        break;
      case ' ':
        e.preventDefault();
        if (type === 'video') togglePlay();
        break;
      case 'ArrowLeft':
        if (type === 'image') setRotation(prev => (prev - 90) % 360);
        break;
      case 'ArrowRight':
        if (type === 'image') setRotation(prev => (prev + 90) % 360);
        break;
      case '+':
      case '=':
        setZoom(prev => Math.min(3, prev + 0.25));
        break;
      case '-':
        setZoom(prev => Math.max(0.5, prev - 0.25));
        break;
      case '0':
        resetView();
        break;
      case 'm':
        if (type === 'video') toggleMute();
        break;
    }
  }, [isFullscreen, type]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-hide controls
  useEffect(() => {
    if (!isFullscreen) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isFullscreen, showControls]);

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

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  }, []);

  const downloadMedia = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || `media-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, alt]);

  const rotateImage = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setFilters({ brightness: 100, contrast: 100, saturate: 100 });
  }, []);

  // Mouse drag for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      e.preventDefault();
    }
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Get image metadata
  const getImageMetadata = useCallback(() => {
    if (type !== 'image' || !imageRef.current) return null;
    
    const img = imageRef.current;
    return {
      dimensions: `${img.naturalWidth} × ${img.naturalHeight}`,
      displaySize: `${Math.round(img.width)} × ${Math.round(img.height)}`,
      aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
    };
  }, [type]);

  const getVideoMetadata = useCallback(() => {
    if (type !== 'video' || !videoRef.current) return null;
    
    const video = videoRef.current;
    return {
      dimensions: `${video.videoWidth} × ${video.videoHeight}`,
      duration: video.duration ? `${Math.round(video.duration)}s` : 'N/A',
      currentTime: video.currentTime ? `${Math.round(video.currentTime)}s` : '0s'
    };
  }, [type]);

  if (type === 'image') {
    return (
      <>
        <div className={cn("relative group inline-block", className)}>
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className={cn(
              "max-w-full h-auto rounded-lg shadow-lg cursor-pointer transition-all duration-300",
              loaded ? "opacity-100" : "opacity-0",
              "hover:scale-[1.02]"
            )}
            style={{ 
              transform: `rotate(${rotation}deg)`,
              filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`
            }}
            onClick={() => setIsFullscreen(true)}
            onLoad={() => setLoaded(true)}
            loading="lazy"
          />
          
          {!loaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
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
              title="Tela cheia (ou clique na imagem)"
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
              title="Rotacionar (seta direita em tela cheia)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowMetadata(!showMetadata);
              }}
              className="bg-white/90 text-black hover:bg-white"
              title="Informações"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                downloadMedia();
              }}
              className="bg-white/90 text-black hover:bg-white"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Metadata overlay */}
          {showMetadata && getImageMetadata() && (
            <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded space-y-1">
              <div>Dimensões: {getImageMetadata()?.dimensions}</div>
              <div>Exibindo: {getImageMetadata()?.displaySize}</div>
              <div>Aspect: {getImageMetadata()?.aspectRatio}</div>
            </div>
          )}
        </div>

        {/* Modal de tela cheia */}
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent className="max-w-7xl w-full h-full max-h-screen p-0 bg-black">
            <div 
              ref={containerRef}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={src}
                alt={alt}
                className={cn(
                  "max-w-full max-h-full object-contain select-none",
                  zoom > 1 ? "cursor-move" : "cursor-zoom-in"
                )}
                style={{ 
                  transform: `rotate(${rotation}deg) scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`
                }}
                draggable={false}
              />
              
              {/* Controles em tela cheia */}
              {showControls && (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={rotateImage}
                      className="bg-white/20 text-white hover:bg-white/30"
                      title="Rotacionar (→)"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowMetadata(!showMetadata)}
                      className={cn(
                        "bg-white/20 text-white hover:bg-white/30",
                        showMetadata && "bg-white/40"
                      )}
                      title="Informações"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={downloadMedia}
                      className="bg-white/20 text-white hover:bg-white/30"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Controles de zoom */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/60 rounded-lg p-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                      className="bg-white/20 text-white hover:bg-white/30"
                      title="Zoom out (-)"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {Math.round(zoom * 100)}%
                    </Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                      className="bg-white/20 text-white hover:bg-white/30"
                      title="Zoom in (+)"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetView}
                      className="bg-white/20 text-white hover:bg-white/30"
                      title="Reset (0)"
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filtros */}
                  <div className="absolute bottom-4 right-4 space-y-2">
                    <div className="bg-black/60 rounded-lg p-3 space-y-2 min-w-48">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-white" />
                        <span className="text-white text-sm">Filtros</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-white text-xs">Brilho: {filters.brightness}%</label>
                          <Slider
                            value={[filters.brightness]}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, brightness: value[0] }))}
                            min={50}
                            max={150}
                            step={5}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs">Contraste: {filters.contrast}%</label>
                          <Slider
                            value={[filters.contrast]}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, contrast: value[0] }))}
                            min={50}
                            max={150}
                            step={5}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs">Saturação: {filters.saturate}%</label>
                          <Slider
                            value={[filters.saturate]}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, saturate: value[0] }))}
                            min={0}
                            max={200}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Metadata overlay */}
              {showMetadata && getImageMetadata() && showControls && (
                <div className="absolute top-4 left-4 bg-black/80 text-white text-sm p-3 rounded space-y-1">
                  <div><strong>Dimensões:</strong> {getImageMetadata()?.dimensions}</div>
                  <div><strong>Exibindo:</strong> {getImageMetadata()?.displaySize}</div>
                  <div><strong>Proporção:</strong> {getImageMetadata()?.aspectRatio}</div>
                  <div><strong>Zoom:</strong> {Math.round(zoom * 100)}%</div>
                  <div><strong>Rotação:</strong> {rotation}°</div>
                </div>
              )}

              {/* Keyboard shortcuts help */}
              <div className="absolute bottom-4 left-4 text-white text-xs bg-black/60 rounded p-2 opacity-50 hover:opacity-100 transition-opacity">
                <div className="font-semibold mb-1">Atalhos:</div>
                <div>ESC: Fechar • +/-: Zoom • ←→: Rotacionar • 0: Reset</div>
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
        onVolumeChange={(e) => {
          const video = e.target as HTMLVideoElement;
          setIsMuted(video.muted);
          setVolume(video.volume * 100);
        }}
        onLoadedData={() => setLoaded(true)}
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
            title="Play/Pause (espaço em tela cheia)"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMute}
            className="bg-white/90 text-black hover:bg-white"
            title="Mute/Unmute (M em tela cheia)"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMetadata(!showMetadata)}
            className="bg-white/90 text-black hover:bg-white"
            title="Informações"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={downloadMedia}
            className="bg-white/90 text-black hover:bg-white"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video metadata overlay */}
      {showMetadata && getVideoMetadata() && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded space-y-1">
          <div>Dimensões: {getVideoMetadata()?.dimensions}</div>
          <div>Duração: {getVideoMetadata()?.duration}</div>
          <div>Tempo atual: {getVideoMetadata()?.currentTime}</div>
        </div>
      )}
    </div>
  );
};
