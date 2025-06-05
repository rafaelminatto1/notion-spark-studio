
import { useCallback } from 'react';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useDataService } from './useDataService';
import { useActivityHistory } from './useActivityHistory';

export interface ExportOptions {
  includeMetadata: boolean;
  format: 'json' | 'markdown' | 'zip';
  selectedFiles?: string[];
  includeMedia: boolean;
}

export const useImportExport = (
  files: FileItem[],
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>,
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void
) => {
  const { toast } = useToast();
  const dataService = useDataService();
  const { logImport, logExport } = useActivityHistory();

  const exportFiles = useCallback(async (options: ExportOptions) => {
    const filesToExport = options.selectedFiles 
      ? files.filter(f => options.selectedFiles!.includes(f.id))
      : files;

    try {
      if (options.format === 'json') {
        const exportData = {
          version: '2.0',
          exportedAt: new Date().toISOString(),
          metadata: options.includeMetadata ? {
            totalFiles: filesToExport.length,
            exportOptions: options
          } : undefined,
          files: filesToExport.map(file => ({
            ...file,
            createdAt: file.createdAt.toISOString(),
            updatedAt: file.updatedAt.toISOString()
          }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });

        downloadBlob(blob, `workspace-export-${new Date().toISOString().split('T')[0]}.json`);
      } else if (options.format === 'markdown') {
        await exportAsMarkdownBundle(filesToExport);
      }

      logExport(filesToExport.length);
      
      toast({
        title: "Export concluído",
        description: `${filesToExport.length} arquivo(s) exportado(s) como ${options.format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Falha ao exportar arquivos",
        variant: "destructive"
      });
    }
  }, [files, toast, logExport]);

  const exportAsMarkdown = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || file.type !== 'file') return;

    const content = generateMarkdownContent(file);
    const blob = new Blob([content], { type: 'text/markdown' });
    
    downloadBlob(blob, `${sanitizeFileName(file.name)}.md`);

    toast({
      title: "Markdown exportado",
      description: `${file.name} foi exportado como Markdown`
    });
  }, [files, toast]);

  const exportAsMarkdownBundle = useCallback(async (filesToExport: FileItem[]) => {
    const fileFiles = filesToExport.filter(f => f.type === 'file');
    
    if (fileFiles.length === 1) {
      exportAsMarkdown(fileFiles[0].id);
      return;
    }

    // Criar um ZIP com múltiplos arquivos Markdown
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    fileFiles.forEach(file => {
      const content = generateMarkdownContent(file);
      const fileName = `${sanitizeFileName(file.name)}.md`;
      zip.file(fileName, content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `markdown-export-${new Date().toISOString().split('T')[0]}.zip`);
  }, [exportAsMarkdown]);

  const importFiles = useCallback(async (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          await importFromJSON(content);
        } else if (file.name.endsWith('.md')) {
          await importFromMarkdown(content, file.name);
        } else {
          throw new Error('Formato de arquivo não suportado');
        }
      } catch (error) {
        toast({
          title: "Erro no import",
          description: "Falha ao importar arquivo. Verifique o formato.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  }, [toast]);

  const importFromJSON = useCallback(async (content: string) => {
    const importData = JSON.parse(content);
    
    if (!importData.files || !Array.isArray(importData.files)) {
      throw new Error('Formato de arquivo inválido');
    }

    let importedCount = 0;
    const conflicts: string[] = [];

    for (const importedFile of importData.files) {
      const existingFile = files.find(f => f.name === importedFile.name && f.parentId === importedFile.parentId);
      
      if (existingFile) {
        conflicts.push(importedFile.name);
        // Criar versão duplicada com sufixo
        const newName = `${importedFile.name} (importado)`;
        const newFileId = await onCreateFile(newName, importedFile.parentId, importedFile.type);
        onUpdateFile(newFileId, {
          content: importedFile.content,
          tags: importedFile.tags,
          emoji: importedFile.emoji,
          description: importedFile.description
        });
      } else {
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

    logImport(importedCount);

    toast({
      title: "Import concluído",
      description: `${importedCount} arquivo(s) importado(s)${conflicts.length > 0 ? `. ${conflicts.length} conflitos resolvidos` : ''}`
    });
  }, [files, onCreateFile, onUpdateFile, toast, logImport]);

  const importFromMarkdown = useCallback(async (content: string, fileName: string) => {
    const name = fileName.replace('.md', '');
    const newFileId = await onCreateFile(name, undefined, 'file');
    onUpdateFile(newFileId, { content });

    logImport(1);
    
    toast({
      title: "Markdown importado",
      description: `Arquivo "${name}" foi importado com sucesso`
    });
  }, [onCreateFile, onUpdateFile, toast, logImport]);

  // Funções auxiliares
  const generateMarkdownContent = (file: FileItem): string => {
    let content = `# ${file.name}\n\n`;
    
    if (file.description) {
      content += `> ${file.description}\n\n`;
    }
    
    if (file.tags && file.tags.length > 0) {
      content += `**Tags:** ${file.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
    }
    
    content += file.content || '';
    
    content += `\n\n---\n*Criado em: ${file.createdAt.toLocaleDateString()}*\n`;
    content += `*Última modificação: ${file.updatedAt.toLocaleDateString()}*`;
    
    return content;
  };

  const sanitizeFileName = (name: string): string => {
    return name.replace(/[<>:"/\\|?*]/g, '_');
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    exportFiles,
    exportAsMarkdown,
    importFiles
  };
};
