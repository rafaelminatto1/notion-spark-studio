
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, Image, Video, File, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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

export const MediaManager: React.FC<MediaManagerProps> = ({
  onInsertMedia,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const markdown = `![${file.name}](${result})`;
          onInsertMedia(markdown);
          setIsOpen(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const markdown = `<video controls width="100%">\n  <source src="${result}" type="${file.type}">\n  Seu navegador não suporta vídeo.\n</video>`;
          onInsertMedia(markdown);
          setIsOpen(false);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [onInsertMedia]);

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
    
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      const markdown = `![${altText || 'Imagem'}](${url})`;
      onInsertMedia(markdown);
    } else if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
      const markdown = `<video controls width="100%">\n  <source src="${url}">\n  Seu navegador não suporta vídeo.\n</video>`;
      onInsertMedia(markdown);
    } else {
      const markdown = `[${altText || 'Link'}](${url})`;
      onInsertMedia(markdown);
    }
    
    setUrl('');
    setAltText('');
    setIsOpen(false);
  }, [url, altText, onInsertMedia]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Image className="h-4 w-4" />
          Mídia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Inserir Mídia
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragOver 
                  ? "border-purple-400 bg-purple-50 dark:bg-purple-950/20" 
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
                    Arraste arquivos aqui
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ou clique para selecionar
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Formatos suportados: JPG, PNG, GIF, MP4, WebM
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
                  placeholder="Descrição da imagem"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Button onClick={insertFromUrl} disabled={!url} className="w-full">
              Inserir Mídia
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
