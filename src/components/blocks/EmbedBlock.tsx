
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Block } from '@/types';
import { Play, Twitter, Image, FileText, Figma, Code, ExternalLink, RefreshCw } from 'lucide-react';

interface EmbedBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
}

export const EmbedBlock: React.FC<EmbedBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus
}) => {
  const [url, setUrl] = useState(block.content || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlSubmit = () => {
    onUpdate({ content: url });
  };

  const extractVideoId = (youtubeUrl: string) => {
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const extractTweetId = (twitterUrl: string) => {
    const match = twitterUrl.match(/twitter\.com\/\w+\/status\/(\d+)|x\.com\/\w+\/status\/(\d+)/);
    return match ? (match[1] || match[2]) : null;
  };

  const renderEmbed = () => {
    if (!block.content) {
      return (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {getEmbedIcon()}
            <span className="text-gray-300">{getEmbedTitle()}</span>
          </div>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={getPlaceholder()}
              className="bg-notion-dark-hover border-gray-600"
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button onClick={handleUrlSubmit} size="sm">
              Adicionar
            </Button>
          </div>
        </div>
      );
    }

    switch (block.type) {
      case 'embed-youtube':
        const videoId = extractVideoId(block.content);
        if (!videoId) {
          return (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
              <p className="text-red-400">URL do YouTube inválida</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ content: '' })}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          );
        }
        return (
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
              <span>YouTube Video</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(block.content, '_blank')}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir
              </Button>
            </div>
          </div>
        );

      case 'embed-twitter':
        const tweetId = extractTweetId(block.content);
        if (!tweetId) {
          return (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
              <p className="text-red-400">URL do Twitter/X inválida</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ content: '' })}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          );
        }
        return (
          <div className="max-w-lg mx-auto">
            <div className="bg-notion-dark-hover border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Twitter className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">Tweet</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Tweet incorporado (ID: {tweetId})
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(block.content, '_blank')}
                className="text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no Twitter/X
              </Button>
            </div>
          </div>
        );

      case 'embed-image':
        return (
          <div className="text-center">
            <img
              src={block.content}
              alt="Imagem incorporada"
              className="max-w-full h-auto rounded-lg border border-gray-600"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">Erro ao carregar imagem</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ content: '' })}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
              <span>Imagem</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(block.content, '_blank')}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir
              </Button>
            </div>
          </div>
        );

      case 'embed-pdf':
        return (
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <iframe
              src={`${block.content}#toolbar=0`}
              title="PDF Document"
              className="w-full h-96"
              frameBorder="0"
            />
            <div className="flex items-center justify-between p-3 bg-notion-dark-hover text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Documento PDF</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(block.content, '_blank')}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir
              </Button>
            </div>
          </div>
        );

      case 'embed-figma':
        const figmaId = block.content.match(/figma\.com\/(?:file|proto)\/([a-zA-Z0-9]+)/)?.[1];
        if (!figmaId) {
          return (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
              <p className="text-red-400">URL do Figma inválida</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ content: '' })}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          );
        }
        return (
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <iframe
              src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(block.content)}`}
              title="Figma Design"
              className="w-full h-96"
              frameBorder="0"
              allowFullScreen
            />
            <div className="flex items-center justify-between p-3 bg-notion-dark-hover text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Figma className="h-4 w-4" />
                <span>Design do Figma</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(block.content, '_blank')}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir
              </Button>
            </div>
          </div>
        );

      case 'embed-codepen':
        const codepenId = block.content.match(/codepen\.io\/\w+\/pen\/([a-zA-Z0-9]+)/)?.[1];
        if (!codepenId) {
          return (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
              <p className="text-red-400">URL do CodePen inválida</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ content: '' })}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          );
        }
        return (
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <iframe
              src={`https://codepen.io/embed/${codepenId}?theme-id=dark&default-tab=result`}
              title="CodePen Embed"
              className="w-full h-96"
              frameBorder="0"
              allowFullScreen
            />
            <div className="flex items-center justify-between p-3 bg-notion-dark-hover text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>CodePen</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(block.content, '_blank')}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getEmbedIcon = () => {
    switch (block.type) {
      case 'embed-youtube':
        return <Play className="h-5 w-5 text-red-500" />;
      case 'embed-twitter':
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case 'embed-image':
        return <Image className="h-5 w-5 text-green-400" />;
      case 'embed-pdf':
        return <FileText className="h-5 w-5 text-orange-400" />;
      case 'embed-figma':
        return <Figma className="h-5 w-5 text-purple-400" />;
      case 'embed-codepen':
        return <Code className="h-5 w-5 text-yellow-400" />;
      default:
        return <ExternalLink className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEmbedTitle = () => {
    switch (block.type) {
      case 'embed-youtube':
        return 'Incorporar YouTube';
      case 'embed-twitter':
        return 'Incorporar Tweet';
      case 'embed-image':
        return 'Incorporar Imagem';
      case 'embed-pdf':
        return 'Incorporar PDF';
      case 'embed-figma':
        return 'Incorporar Figma';
      case 'embed-codepen':
        return 'Incorporar CodePen';
      default:
        return 'Incorporar Conteúdo';
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'embed-youtube':
        return 'Cole a URL do YouTube...';
      case 'embed-twitter':
        return 'Cole a URL do Tweet...';
      case 'embed-image':
        return 'Cole a URL da imagem...';
      case 'embed-pdf':
        return 'Cole a URL do PDF...';
      case 'embed-figma':
        return 'Cole a URL do Figma...';
      case 'embed-codepen':
        return 'Cole a URL do CodePen...';
      default:
        return 'Cole uma URL...';
    }
  };

  return (
    <div 
      className={`rounded-md transition-all ${
        isSelected ? 'ring-1 ring-notion-purple' : ''
      }`}
      onClick={onFocus}
    >
      {renderEmbed()}
    </div>
  );
};
