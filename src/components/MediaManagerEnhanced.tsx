import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LazyMedia } from './LazyMedia';
import { 
  Upload, 
  Link, 
  Image, 
  Video, 
  File, 
  X, 
  AlertCircle, 
  CheckCircle,
  Compass,
  FileText,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIndexedDB } from '@/hooks/useIndexedDB';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
  originalSize?: number;
  duration?: number;
  createdAt: Date;
  compressed?: boolean;
}

interface MediaManagerEnhancedProps {
  onInsertMedia: (markdown: string) => void;
  className?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_DIMENSION = 2048;

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac']
};

export const MediaManagerEnhanced: React.FC<MediaManagerEnhancedProps> = ({
  onInsertMedia,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [compressionStats, setCompressionStats] = useState<{
    original: number;
    compressed: number;
    savings: number;
  } | null>(null);

  const { isReady, getAll, set } = useIndexedDB();

  // Load recent media from IndexedDB
  React.useEffect(() => {
    const loadRecentMedia = async () => {
      if (!isReady) return;
      
      try {
        const media = await getAll<MediaItem>('media');
        setRecentMedia(media.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      } catch (error) {
        console.error('Error loading media:', error);
      }
    };

    loadRecentMedia();
  }, [isReady, getAll]);

  const validateFile = (file: File): { isValid: boolean; error?: string; type?: 'image' | 'video' | 'audio' } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    const isImage = ALLOWED_TYPES.image.includes(file.type);
    const isVideo = ALLOWED_TYPES.video.includes(file.type);
    const isAudio = ALLOWED_TYPES.audio.includes(file.type);

    if (!isImage && !isVideo && !isAudio) {
      return {
        isValid: false,
        error: `Tipo de arquivo não suportado: ${file.type}`
      };
    }

    const type = isImage ? 'image' : isVideo ? 'video' : 'audio';
    return { isValid: true, type };
  };

  const compressImage = async (file: File): Promise<{ file: File; compressed: boolean; originalSize: number }> => {
    const originalSize = file.size;
    
    if (!file.type.startsWith('image/') || file.size < COMPRESSION_THRESHOLD) {
      return { file, compressed: false, originalSize };
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      img.onload = () => {
        let { width, height } = img;
        let quality = 0.8;

        // Calculate new dimensions
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Adjust quality based on file size
        if (originalSize > 5 * 1024 * 1024) quality = 0.7;
        if (originalSize > 10 * 1024 * 1024) quality = 0.6;

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob && blob.size < originalSize * 0.95) {
            const compressedFile = new window.File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve({ file: compressedFile, compressed: true, originalSize });
          } else {
            resolve({ file, compressed: false, originalSize });
          }
        }, file.type, quality);
      };

      img.onerror = () => { resolve({ file, compressed: false, originalSize }); };
      img.src = URL.createObjectURL(file);
    });
  };

  const processFile = async (file: File): Promise<void> => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 85));
      }, 200);

      let processedFile = file;
      let compressed = false;
      let originalSize = file.size;

      if (validation.type === 'image') {
        const result = await compressImage(file);
        processedFile = result.file;
        compressed = result.compressed;
        originalSize = result.originalSize;

        if (compressed) {
          setCompressionStats({
            original: originalSize,
            compressed: processedFile.size,
            savings: Math.round((1 - processedFile.size / originalSize) * 100)
          });
        }
      }

      // Convert to data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          
          // Create media item
          const mediaItem: MediaItem = {
            id: Date.now().toString(),
            type: validation.type!,
            url: result,
            name: file.name,
            size: processedFile.size,
            originalSize: compressed ? originalSize : undefined,
            createdAt: new Date(),
            compressed
          };

          // Save to IndexedDB
          if (isReady) {
            await set('media', mediaItem);
          }

          // Update recent media
          setRecentMedia(prev => [mediaItem, ...prev.slice(0, 19)]);

          // Generate markdown
          let markdown = '';
          if (validation.type === 'image') {
            markdown = `![${altText || file.name}](${result})`;
          } else if (validation.type === 'video') {
            markdown = `<video controls width="100%">\n  <source src="${result}" type="${file.type}">\n  Seu navegador não suporta vídeo.\n</video>`;
          } else if (validation.type === 'audio') {
            markdown = `<audio controls>\n  <source src="${result}" type="${file.type}">\n  Seu navegador não suporta áudio.\n</audio>`;
          }

          onInsertMedia(markdown);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
            setIsOpen(false);
            setCompressionStats(null);
          }, 1000);
        } catch (error) {
          clearInterval(progressInterval);
          setError('Erro ao processar arquivo');
          setUploading(false);
        }
      };

      reader.readAsDataURL(processedFile);
    } catch (error) {
      setError('Erro ao processar arquivo');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      await processFile(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const insertFromUrl = useCallback(() => {
    if (!url) return;
    
    let markdown = '';
    const urlLower = url.toLowerCase();
    
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      markdown = `![${altText || 'Imagem'}](${url})`;
    } else if (urlLower.match(/\.(mp4|webm|ogg|mov)$/)) {
      markdown = `<video controls width="100%">\n  <source src="${url}">\n  Seu navegador não suporta vídeo.\n</video>`;
    } else if (urlLower.match(/\.(mp3|wav|ogg|m4a)$/)) {
      markdown = `<audio controls>\n  <source src="${url}">\n  Seu navegador não suporta áudio.\n</audio>`;
    } else {
      markdown = `[${altText || 'Link'}](${url})`;
    }
    
    onInsertMedia(markdown);
    setUrl('');
    setAltText('');
    setIsOpen(false);
  }, [url, altText, onInsertMedia]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Camera className="h-4 w-4" />
          Mídia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Gerenciar Mídia
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <File className="h-4 w-4" />
              Recentes ({recentMedia.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {compressionStats && (
              <Alert>
                <Compass className="h-4 w-4" />
                <AlertDescription>
                  Compressão aplicada: {formatFileSize(compressionStats.original)} → {formatFileSize(compressionStats.compressed)} 
                  <Badge variant="secondary" className="ml-2">
                    -{compressionStats.savings}%
                  </Badge>
                </AlertDescription>
              </Alert>
            )}

            {uploading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Upload className="h-4 w-4 animate-pulse" />
                  Processando arquivo...
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
                dragOver 
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20 scale-[1.02]" 
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Arraste arquivos aqui
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ou clique para selecionar
                  </p>
                </div>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Image className="h-6 w-6 mx-auto mb-1" />
                <p className="font-medium">Imagens</p>
                <p>JPG, PNG, GIF, WebP, SVG</p>
                <p>Auto-compressão ativa</p>
              </div>
              <div className="text-center">
                <Video className="h-6 w-6 mx-auto mb-1" />
                <p className="font-medium">Vídeos</p>
                <p>MP4, WebM, OGG, MOV</p>
                <p>Até {MAX_FILE_SIZE / 1024 / 1024}MB</p>
              </div>
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-1" />
                <p className="font-medium">Áudio</p>
                <p>MP3, WAV, OGG, M4A</p>
                <p>Até {MAX_FILE_SIZE / 1024 / 1024}MB</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL da mídia
                </label>
                <Input
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); }}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Texto alternativo (opcional)
                </label>
                <Input
                  value={altText}
                  onChange={(e) => { setAltText(e.target.value); }}
                  placeholder="Descrição da mídia"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Button onClick={insertFromUrl} disabled={!url} className="w-full">
              Inserir Mídia
            </Button>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {recentMedia.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">Nenhuma mídia recente</p>
                <p className="text-sm">Faça upload de arquivos para vê-los aqui</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {recentMedia.map((media) => (
                  <div
                    key={media.id}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-md"
                    onClick={() => {
                      let markdown = '';
                      if (media.type === 'image') {
                        markdown = `![${media.name}](${media.url})`;
                      } else if (media.type === 'video') {
                        markdown = `<video controls width="100%">\n  <source src="${media.url}">\n  Seu navegador não suporta vídeo.\n</video>`;
                      } else if (media.type === 'audio') {
                        markdown = `<audio controls>\n  <source src="${media.url}">\n  Seu navegador não suporta áudio.\n</audio>`;
                      }
                      onInsertMedia(markdown);
                      setIsOpen(false);
                    }}
                  >
                    <LazyMedia
                      src={media.url}
                      alt={media.name}
                      type={media.type}
                      className="w-full h-20 mb-2"
                    />
                    
                    <div className="space-y-1">
                      <p className="text-xs font-medium truncate">{media.name}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(media.size)}</span>
                        {media.compressed && (
                          <Badge variant="secondary" className="text-xs">
                            Comprimida
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
