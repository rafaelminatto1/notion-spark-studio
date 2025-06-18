
import React, { useState } from 'react';
import { Moon, Sun, Monitor, Palette, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeEditor } from '@/components/ThemeEditor';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, customTheme, setCustomTheme, availableThemes } = useTheme();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);

  const handleEditTheme = (themeToEdit = null) => {
    setEditingTheme(themeToEdit);
    setIsEditorOpen(true);
  };

  const handleCreateNewTheme = () => {
    setEditingTheme(null);
    setIsEditorOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-9 w-9 p-0 rounded-full transition-all duration-200 hover:scale-110",
              "bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10",
              customTheme && "ring-2 ring-purple-400/50"
            )}
          >
            {customTheme ? (
              <Palette className="h-4 w-4 text-purple-400 transition-colors duration-200" />
            ) : theme === 'light' ? (
              <Sun className="h-4 w-4 text-yellow-500 transition-colors duration-200" />
            ) : theme === 'dark' ? (
              <Moon className="h-4 w-4 text-blue-400 transition-colors duration-200" />
            ) : (
              <Monitor className="h-4 w-4 text-purple-400 transition-colors duration-200" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-background/95 backdrop-blur-sm border-border/60 shadow-xl rounded-lg min-w-[200px]"
        >
          <DropdownMenuLabel>Temas do Sistema</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => { setCustomTheme(undefined); setTheme('light'); }}
            className={cn(
              "cursor-pointer transition-all duration-200 rounded-md",
              "hover:bg-yellow-500/10 focus:bg-yellow-500/10",
              theme === 'light' && !customTheme && "bg-yellow-500/20"
            )}
          >
            <Sun className="mr-2 h-4 w-4 text-yellow-500" />
            <span className="font-medium">Claro</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => { setCustomTheme(undefined); setTheme('dark'); }}
            className={cn(
              "cursor-pointer transition-all duration-200 rounded-md",
              "hover:bg-blue-500/10 focus:bg-blue-500/10",
              theme === 'dark' && !customTheme && "bg-blue-500/20"
            )}
          >
            <Moon className="mr-2 h-4 w-4 text-blue-400" />
            <span className="font-medium">Escuro</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => { setCustomTheme(undefined); setTheme('system'); }}
            className={cn(
              "cursor-pointer transition-all duration-200 rounded-md",
              "hover:bg-purple-500/10 focus:bg-purple-500/10",
              theme === 'system' && !customTheme && "bg-purple-500/20"
            )}
          >
            <Monitor className="mr-2 h-4 w-4 text-purple-400" />
            <span className="font-medium">Sistema</span>
          </DropdownMenuItem>

          {availableThemes.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Temas Personalizados</DropdownMenuLabel>
              {availableThemes.map((availableTheme) => (
                <DropdownMenuSub key={availableTheme.id}>
                  <DropdownMenuSubTrigger
                    className={cn(
                      "cursor-pointer transition-all duration-200 rounded-md",
                      "hover:bg-purple-500/10 focus:bg-purple-500/10",
                      customTheme?.id === availableTheme.id && "bg-purple-500/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: availableTheme.colors.primary }}
                      />
                      <span className="font-medium">{availableTheme.name}</span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => { setCustomTheme(availableTheme); }}>
                      <Palette className="mr-2 h-4 w-4" />
                      Aplicar Tema
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { handleEditTheme(availableTheme); }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Tema
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleCreateNewTheme}
            className="cursor-pointer transition-all duration-200 rounded-md hover:bg-green-500/10 focus:bg-green-500/10"
          >
            <Plus className="mr-2 h-4 w-4 text-green-500" />
            <span className="font-medium">Criar Novo Tema</span>
          </DropdownMenuItem>
          
          {customTheme && (
            <DropdownMenuItem 
              onClick={() => { handleEditTheme(customTheme); }}
              className="cursor-pointer transition-all duration-200 rounded-md hover:bg-purple-500/10 focus:bg-purple-500/10"
            >
              <Edit className="mr-2 h-4 w-4 text-purple-500" />
              <span className="font-medium">Editar Tema Atual</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ThemeEditor
        isOpen={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); }}
        selectedTheme={editingTheme}
      />
    </>
  );
};
