import React from 'react';
import type { FileItem } from '@/types';
import { TagInput } from '@/components/TagInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, User, Hash, Eye, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface PropertiesPanelProps {
  file: FileItem | null;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  file,
  onUpdateFile
}) => {
  if (!file) {
    return (
      <div className="p-4 text-center text-gray-400">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Selecione uma nota para ver suas propriedades</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<FileItem>) => {
    onUpdateFile(file.id, updates);
  };

  return (
    <div className="p-4 space-y-6 text-sm">
      {/* File Info */}
      <div>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Informações da Nota
        </h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="file-name" className="text-xs text-gray-400">Nome</Label>
            <Input
              id="file-name"
              value={file.name}
              onChange={(e) => { handleUpdate({ name: e.target.value }); }}
              className="h-7 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="file-emoji" className="text-xs text-gray-400">Emoji</Label>
            <Input
              id="file-emoji"
              value={file.emoji || ''}
              onChange={(e) => { handleUpdate({ emoji: e.target.value }); }}
              className="h-7 text-xs"
              placeholder="📄"
            />
          </div>

          <div>
            <Label htmlFor="file-description" className="text-xs text-gray-400">Descrição</Label>
            <Textarea
              id="file-description"
              value={file.description || ''}
              onChange={(e) => { handleUpdate({ description: e.target.value }); }}
              className="text-xs min-h-[60px]"
              placeholder="Adicione uma descrição..."
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Tags
        </h3>
        
        <TagInput
          tags={file.tags || []}
          onTagsChange={(tags) => { handleUpdate({ tags }); }}
          placeholder="Adicionar tags..."
        />
      </div>

      <Separator />

      {/* Settings */}
      <div>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Configurações
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="is-public" className="text-xs text-gray-400">Público</Label>
            <Switch
              id="is-public"
              checked={file.isPublic || false}
              onCheckedChange={(isPublic) => { handleUpdate({ isPublic }); }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-protected" className="text-xs text-gray-400">Protegido</Label>
            <Switch
              id="is-protected"
              checked={file.isProtected || false}
              onCheckedChange={(isProtected) => { handleUpdate({ isProtected }); }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-in-sidebar" className="text-xs text-gray-400">Mostrar na Sidebar</Label>
            <Switch
              id="show-in-sidebar"
              checked={file.showInSidebar !== false}
              onCheckedChange={(showInSidebar) => { handleUpdate({ showInSidebar }); }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Metadata */}
      <div>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Metadados
        </h3>
        
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Criado em:</span>
            <span>{file.createdAt ? format(new Date(file.createdAt), 'dd/MM/yyyy HH:mm') : 'Data não disponível'}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Modificado em:</span>
            <span>{file.updatedAt ? format(new Date(file.updatedAt), 'dd/MM/yyyy HH:mm') : 'Data não disponível'}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span className="capitalize">{file.type === 'file' ? 'nota' : file.type}</span>
          </div>
          {file.type === 'file' && (
            <div className="flex justify-between">
              <span>Tamanho:</span>
              <span>{file.content?.length ?? 0} caracteres</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => { handleUpdate({ updatedAt: new Date() }); }}
        >
          Atualizar Data de Modificação
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => {
            const template = {
              name: `Template: ${file.name}`,
              content: file.content || '',
              emoji: file.emoji,
              tags: ['template', ...(file.tags || [])]
            };
            console.log('Criar template:', template);
          }}
        >
          Criar Template
        </Button>
      </div>
    </div>
  );
};
