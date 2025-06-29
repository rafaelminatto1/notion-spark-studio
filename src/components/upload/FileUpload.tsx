
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (files: any[]) => void;
  onUploadError: (error: string) => void;
  documentId?: string;
  maxFiles?: number;
  maxSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  documentId,
  maxFiles = 5,
  maxSize = 10
}) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const uploadedFiles = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        original_filename: file.name,
        mime_type: file.type,
        public_url: URL.createObjectURL(file),
        size: file.size
      }));
      
      onUploadComplete(uploadedFiles);
      setFiles([]);
    } catch (error) {
      onUploadError('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-300 mb-4">Arraste arquivos ou clique para selecionar</p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <Button variant="outline" asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            Selecionar Arquivos
          </label>
        </Button>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-slate-400" />
                <span className="text-slate-200">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Enviando...' : 'Fazer Upload'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
