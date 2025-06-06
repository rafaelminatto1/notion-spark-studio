
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Upload, Trash2, Camera } from 'lucide-react';

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string;
  userName: string;
  onAvatarChange?: (newAvatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatar,
  userName,
  onAvatarChange,
  size = 'md'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, deleteAvatar, isUploading } = useAvatarUpload();

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newAvatarUrl = await uploadAvatar(file, userId);
    if (newAvatarUrl && onAvatarChange) {
      onAvatarChange(newAvatarUrl);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    const success = await deleteAvatar(userId, currentAvatar);
    if (success && onAvatarChange) {
      onAvatarChange(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-4 border-background shadow-lg`}>
          <AvatarImage src={currentAvatar} alt={userName} />
          <AvatarFallback className="text-lg font-semibold">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Overlay de hover */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {currentAvatar ? 'Alterar' : 'Upload'}
        </Button>

        {currentAvatar && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={isUploading}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {isUploading && (
        <Badge variant="secondary" className="animate-pulse">
          Processando...
        </Badge>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
