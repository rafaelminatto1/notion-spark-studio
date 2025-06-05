
import React from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-9 w-9 p-0 rounded-full transition-all duration-200 hover:scale-110",
            "bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10"
          )}
        >
          {theme === 'light' && <Sun className="h-4 w-4 text-yellow-500 transition-colors duration-200" />}
          {theme === 'dark' && <Moon className="h-4 w-4 text-blue-400 transition-colors duration-200" />}
          {theme === 'system' && <Monitor className="h-4 w-4 text-purple-400 transition-colors duration-200" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-background/95 backdrop-blur-sm border-border/60 shadow-xl rounded-lg min-w-[160px]"
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn(
            "cursor-pointer transition-all duration-200 rounded-md",
            "hover:bg-yellow-500/10 focus:bg-yellow-500/10",
            theme === 'light' && "bg-yellow-500/20"
          )}
        >
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="font-medium">Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn(
            "cursor-pointer transition-all duration-200 rounded-md",
            "hover:bg-blue-500/10 focus:bg-blue-500/10",
            theme === 'dark' && "bg-blue-500/20"
          )}
        >
          <Moon className="mr-2 h-4 w-4 text-blue-400" />
          <span className="font-medium">Escuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn(
            "cursor-pointer transition-all duration-200 rounded-md",
            "hover:bg-purple-500/10 focus:bg-purple-500/10",
            theme === 'system' && "bg-purple-500/20"
          )}
        >
          <Monitor className="mr-2 h-4 w-4 text-purple-400" />
          <span className="font-medium">Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
