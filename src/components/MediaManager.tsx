
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Link, Image, Video, File, X, Play, Pause, Volume2, VolumeX, Crop, RotateCw, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  size?: number;
  duration?: number;
}

interface MediaManagerProps {
  onInsertMedia: (markdown: string) => void;
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];

export const MediaManager: React.FC<MediaManagerProps> = ({
  onInsertMedia,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    const isValidImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const isValidAudio = ALLOWED_AUDIO_TYPES.includes(file.type);

    if (!isValidImage && !isValidVideo && !isValidAudio) {
      return 'Tipo de arquivo não suportado';
    }

    return null;
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.size < 500000) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    setError('');
    
    for (const file of Array.from(files)) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        let processedFile = file;
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          let markdown = '';

          if (file.type.startsWith('image/')) {
            markdown = `![${file.name}](${result})`;
          } else if (file.type.startsWith('video/')) {
            markdown = `<video controls width="100%">\n  <source src="${result}" type="${file.type}">\n  Seu navegador não suporta vídeo.\n</video>`;
          } else if (file.type.startsWith('audio/')) {
            markdown = `<audio controls>\n  <source src="${result}" type="${file.type}">\n  Seu navegador não suporta áudio.\n</audio>`;
          }

          // Add to recent media
          const newMedia: MediaItem = {
            id: Date.now().toString(),
            type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
            url: result,
            name: file.name,
            size: file.size
          };

          setRecentMedia(prev => [newMedia, ...prev.slice(0, 9)]);
          onInsertMedia(markdown);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
            setIsOpen(false);
          }, 500);
        };

        reader.readAsDataURL(processedFile);
      } catch (err) {
        setError('Erro ao processar arquivo');
        setUploading(false);
        setUploadProgress(0);
      }
    }
  }, [onInsertMedia]);

  const handlePreview = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const insertFromUrl = useCallback(() => {
    if (!url) return;
    
    let markdown = '';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      markdown = `![${altText || 'Imagem'}](${url})`;
    } else if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
      markdown = `<video controls width="100%">\n  <source src="${url}">\n  Seu navegador não suporta vídeo.\n</video>`;
    } else if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      markdown = `<audio controls>\n  <source src="${url}">\n  Seu navegador não suporta áudio.\n</audio>`;
    } else {
      markdown = `[${altText || 'Link'}](${url})`;
    }
    
    onInsertMedia(markdown);
    setUrl('');
    setAltText('');
    setIsOpen(false);
  }, [url, altText, onInsertMedia]);

  const insertRecentMedia = useCallback((media: MediaItem) => {
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
  }, [onInsertMedia]);

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isOpen) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFileUpload(new DataTransfer().files);
          const dt = new DataTransfer();
          dt.items.add(file);
          handleFileUpload(dt.files);
        }
      }
    }
  }, [isOpen, handleFileUpload]);

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Image className="h-4 w-4" />
          Mídia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
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
              Recentes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Upload className="h-4 w-4 animate-pulse" />
                  Processando arquivo...
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
                dragOver 
                  ? "border-purple-400 bg-purple-50 dark:bg-purple-950/20 scale-105" 
                  : "border-gray-300 dark:border-gray-600 hover:border-purple-400"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Arraste arquivos aqui ou Ctrl+V para colar
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ou clique para selecionar
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
              <p>Formatos suportados: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MP3, WAV</p>
              <p>Tamanho máximo: 10MB (imagens são comprimidas automaticamente)</p>
            </div>

            {previewFile && previewUrl && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Preview</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewFile(null);
                      setPreviewUrl('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {previewFile.type.startsWith('image/') && (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-32 object-contain rounded"
                  />
                )}
                
                {previewFile.type.startsWith('video/') && (
                  <video 
                    src={previewUrl} 
                    className="max-w-full h-32 rounded"
                    controls
                  />
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{previewFile.name}</span>
                  <span>{(previewFile.size / 1024 / 1024).toFixed(2)}MB</span>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL da mídia
                </label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
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
                  onChange={(e) => setAltText(e.target.value)}
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
              <div className="text-center py-8 text-gray-500">
                <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mídia recente</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {recentMedia.map((media) => (
                  <div
                    key={media.id}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => insertRecentMedia(media)}
                  >
                    {media.type === 'image' && (
                      <img 
                        src={media.url} 
                        alt={media.name}
                        className="w-full h-16 object-cover rounded mb-2"
                      />
                    )}
                    
                    {media.type === 'video' && (
                      <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                        <Video className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    {media.type === 'audio' && (
                      <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                        <Volume2 className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    <p className="text-xs font-medium truncate">{media.name}</p>
                    <p className="text-xs text-gray-500">
                      {media.size ? `${(media.size / 1024 / 1024).toFixed(1)}MB` : ''}
                    </p>
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
