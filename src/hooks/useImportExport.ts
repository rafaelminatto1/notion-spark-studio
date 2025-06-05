
import { useCallback } from 'react';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useImportExport = (
  files: FileItem[],
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>,
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void
) => {
  const { toast } = useToast();

  const exportFiles = useCallback((selectedFiles?: string[]) => {
    const filesToExport = selectedFiles 
      ? files.filter(f => selectedFiles.includes(f.id))
      : files;

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      files: filesToExport.map(file => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export concluído",
      description: `${filesToExport.length} arquivo(s) exportado(s) com sucesso`
    });
  }, [files, toast]);

  const exportAsMarkdown = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || file.type !== 'file') return;

    const content = `# ${file.name}\n\n${file.content || ''}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Markdown exportado",
      description: `${file.name} foi exportado como Markdown`
    });
  }, [files, toast]);

  const importFiles = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        if (!importData.files || !Array.isArray(importData.files)) {
          throw new Error('Formato de arquivo inválido');
        }

        let importedCount = 0;
        for (const importedFile of importData.files) {
          // Verificar se já existe um arquivo com o mesmo nome
          const existingFile = files.find(f => f.name === importedFile.name);
          
          if (existingFile) {
            // Atualizar arquivo existente
            onUpdateFile(existingFile.id, {
              content: importedFile.content,
              tags: importedFile.tags,
              emoji: importedFile.emoji,
              description: importedFile.description
            });
          } else {
            // Criar novo arquivo
            const newFileId = await onCreateFile(importedFile.name, importedFile.parentId, importedFile.type);
            onUpdateFile(newFileId, {
              content: importedFile.content,
              tags: importedFile.tags,
              emoji: importedFile.emoji,
              description: importedFile.description,
              isPublic: importedFile.isPublic,
              isProtected: importedFile.isProtected
            });
          }
          importedCount++;
        }

        toast({
          title: "Import concluído",
          description: `${importedCount} arquivo(s) importado(s) com sucesso`
        });
      } catch (error) {
        toast({
          title: "Erro no import",
          description: "Falha ao importar arquivo. Verifique o formato.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  }, [files, onCreateFile, onUpdateFile, toast]);

  return {
    exportFiles,
    exportAsMarkdown,
    importFiles
  };
};
