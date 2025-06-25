'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase-unified';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // em MB
  acceptedTypes?: string[];
  documentId?: string;
  className?: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  public_url: string;
  storage_path: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSize = 50, // 50MB
  acceptedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx'],
  documentId,
  className = ''
}) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-600" />;
    if (mimeType.startsWith('text/')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo permitido: ${maxSize}MB`;
    }

    // Verificar tipo
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `Tipo de arquivo não suportado. Tipos aceitos: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${user.id}/${fileName}`;

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // Salvar informações no banco
    const fileData = {
      user_id: user.id,
      document_id: documentId || null,
      filename: fileName,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: filePath,
      public_url: publicUrl
    };

    const { data: dbData, error: dbError } = await supabase
      .from('file_uploads')
      .insert(fileData)
      .select()
      .single();

    if (dbError) {
      // Se falhar ao salvar no banco, remover arquivo do storage
      await supabase.storage.from('uploads').remove([filePath]);
      throw new Error(`Erro ao salvar informações: ${dbError.message}`);
    }

    return dbData as UploadedFile;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (!user) {
      onUploadError?.('Usuário não autenticado');
      return;
    }

    const fileArray = Array.from(files);
    
    // Verificar limite de arquivos
    if (fileArray.length > maxFiles) {
      onUploadError?.(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    // Validar arquivos
    const validationErrors: string[] = [];
    fileArray.forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      }
    });

    if (validationErrors.length > 0) {
      onUploadError?.(validationErrors.join('\n'));
      return;
    }

    // Inicializar progresso
    const initialUploads: UploadProgress[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(initialUploads);
    setIsUploading(true);

    const uploadedFiles: UploadedFile[] = [];

    // Upload sequencial para evitar sobrecarga
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      try {
        // Simular progresso
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map((upload, index) => 
            index === i && upload.status === 'uploading'
              ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
              : upload
          ));
        }, 200);

        const uploadedFile = await uploadFile(file);
        
        clearInterval(progressInterval);
        
        setUploads(prev => prev.map((upload, index) => 
          index === i 
            ? { 
                ...upload, 
                progress: 100, 
                status: 'completed', 
                uploadedFile 
              }
            : upload
        ));

        uploadedFiles.push(uploadedFile);
      } catch (error) {
        setUploads(prev => prev.map((upload, index) => 
          index === i 
            ? { 
                ...upload, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Erro desconhecido'
              }
            : upload
        ));
      }
    }

    setIsUploading(false);
    
    if (uploadedFiles.length > 0) {
      onUploadComplete?.(uploadedFiles);
    }
  }, [user, maxFiles, maxSize, acceptedTypes, documentId, onUploadComplete, onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Limpar input para permitir re-upload do mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploads([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'Solte os arquivos aqui' : 'Upload de Arquivos'}
        </h3>
        <p className="text-gray-600 mb-4">
          Arraste e solte arquivos aqui ou clique para selecionar
        </p>
        <div className="text-sm text-gray-500">
          <p>Máximo: {maxFiles} arquivos, {maxSize}MB cada</p>
          <p>Tipos aceitos: {acceptedTypes.join(', ')}</p>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Selecionar Arquivos
        </Button>
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lista de uploads */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Uploads ({uploads.length})</h4>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
              >
                Limpar Tudo
              </Button>
            )}
          </div>

          {uploads.map((upload, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getFileIcon(upload.file.type)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {upload.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {upload.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {upload.status === 'uploading' && (
                <Progress value={upload.progress} className="h-2" />
              )}

              {upload.status === 'error' && upload.error && (
                <Alert className="mt-2 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {upload.error}
                  </AlertDescription>
                </Alert>
              )}

              {upload.status === 'completed' && upload.uploadedFile && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-green-800">
                    ✅ Upload concluído com sucesso!
                  </p>
                  <a
                    href={upload.uploadedFile.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver arquivo
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 