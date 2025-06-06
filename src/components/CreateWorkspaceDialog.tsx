
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSharedWorkspaces } from '@/hooks/useSharedWorkspaces';
import { Globe, Lock } from 'lucide-react';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createWorkspace } = useSharedWorkspaces();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const workspace = await createWorkspace(name.trim(), description.trim() || undefined, isPublic);
    
    if (workspace) {
      setName('');
      setDescription('');
      setIsPublic(false);
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Workspace Compartilhado</DialogTitle>
          <DialogDescription>
            Crie um workspace para colaborar com outros usuários em tempo real.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Workspace</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Projeto Marketing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste workspace..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-gray-600" />
              )}
              <Label htmlFor="public" className="text-sm font-medium">
                {isPublic ? 'Workspace Público' : 'Workspace Privado'}
              </Label>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {isPublic 
              ? 'Qualquer pessoa pode ver e solicitar acesso a este workspace'
              : 'Apenas membros convidados podem acessar este workspace'
            }
          </p>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Criando...' : 'Criar Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
