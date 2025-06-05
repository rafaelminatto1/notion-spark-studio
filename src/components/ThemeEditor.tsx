
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, Eye, Save, RotateCcw, Download, Upload } from 'lucide-react';
import { CustomTheme } from '@/types/workspace';
import { useWorkspaceThemes } from '@/hooks/useWorkspaceThemes';
import { useToast } from '@/hooks/use-toast';

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTheme?: CustomTheme;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ 
  isOpen, 
  onClose, 
  selectedTheme 
}) => {
  const { customThemes, setCustomThemes } = useWorkspaceThemes();
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  
  const [editingTheme, setEditingTheme] = useState<CustomTheme>({
    id: selectedTheme?.id || Date.now().toString(),
    name: selectedTheme?.name || 'Novo Tema',
    colors: selectedTheme?.colors || {
      primary: '#7c3aed',
      secondary: '#4f46e5',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      accent: '#8b5cf6'
    },
    typography: selectedTheme?.typography || {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      fontWeight: 400
    }
  });

  const fontFamilies = [
    { name: 'System', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { name: 'Inter', value: '"Inter", sans-serif' },
    { name: 'Mono', value: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Menlo, monospace' },
    { name: 'Serif', value: '"Times New Roman", Times, serif' },
    { name: 'Playfair', value: '"Playfair Display", serif' }
  ];

  // Apply theme preview
  useEffect(() => {
    if (previewMode && isOpen) {
      const root = document.documentElement;
      Object.entries(editingTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--preview-${key}`, value);
      });
      root.style.setProperty('--preview-font-family', editingTheme.typography.fontFamily);
      root.style.setProperty('--preview-font-size', `${editingTheme.typography.fontSize}px`);
      root.style.setProperty('--preview-font-weight', editingTheme.typography.fontWeight.toString());
    }
    
    return () => {
      if (previewMode) {
        const root = document.documentElement;
        Object.keys(editingTheme.colors).forEach(key => {
          root.style.removeProperty(`--preview-${key}`);
        });
        root.style.removeProperty('--preview-font-family');
        root.style.removeProperty('--preview-font-size');
        root.style.removeProperty('--preview-font-weight');
      }
    };
  }, [editingTheme, previewMode, isOpen]);

  const handleColorChange = (colorKey: string, value: string) => {
    setEditingTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const handleTypographyChange = (key: string, value: any) => {
    setEditingTheme(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    const existingIndex = customThemes.findIndex(t => t.id === editingTheme.id);
    
    if (existingIndex >= 0) {
      const updatedThemes = [...customThemes];
      updatedThemes[existingIndex] = editingTheme;
      setCustomThemes(updatedThemes);
    } else {
      setCustomThemes(prev => [...prev, editingTheme]);
    }

    toast({
      title: "Tema salvo",
      description: `${editingTheme.name} foi salvo com sucesso`
    });
    
    onClose();
  };

  const handleReset = () => {
    if (selectedTheme) {
      setEditingTheme(selectedTheme);
    } else {
      setEditingTheme({
        id: Date.now().toString(),
        name: 'Novo Tema',
        colors: {
          primary: '#7c3aed',
          secondary: '#4f46e5',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: '#1f2937',
          textSecondary: '#6b7280',
          border: '#e5e7eb',
          accent: '#8b5cf6'
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 14,
          fontWeight: 400
        }
      });
    }
  };

  const exportTheme = () => {
    const blob = new Blob([JSON.stringify(editingTheme, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editingTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Editor de Temas
            </CardTitle>
            <CardDescription>
              Personalize cores, tipografia e espaçamentos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="preview">Preview</Label>
              <Switch
                id="preview"
                checked={previewMode}
                onCheckedChange={setPreviewMode}
              />
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="themeName">Nome do Tema</Label>
              <Input
                id="themeName"
                value={editingTheme.name}
                onChange={(e) => setEditingTheme(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do seu tema"
              />
            </div>
            <Badge variant="secondary">
              ID: {editingTheme.id}
            </Badge>
          </div>

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Cores</TabsTrigger>
              <TabsTrigger value="typography">Tipografia</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(editingTheme.colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-12 h-10 p-1 border-2"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Família da Fonte</Label>
                  <Select
                    value={editingTheme.typography.fontFamily}
                    onValueChange={(value) => handleTypographyChange('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tamanho da Fonte: {editingTheme.typography.fontSize}px</Label>
                  <Slider
                    min={10}
                    max={24}
                    step={1}
                    value={[editingTheme.typography.fontSize]}
                    onValueChange={(value) => handleTypographyChange('fontSize', value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Peso da Fonte: {editingTheme.typography.fontWeight}</Label>
                  <Slider
                    min={100}
                    max={900}
                    step={100}
                    value={[editingTheme.typography.fontWeight]}
                    onValueChange={(value) => handleTypographyChange('fontWeight', value[0])}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div 
                className="p-6 rounded-lg border-2 space-y-4"
                style={{
                  backgroundColor: editingTheme.colors.background,
                  color: editingTheme.colors.text,
                  borderColor: editingTheme.colors.border,
                  fontFamily: editingTheme.typography.fontFamily,
                  fontSize: `${editingTheme.typography.fontSize}px`,
                  fontWeight: editingTheme.typography.fontWeight
                }}
              >
                <h3 
                  className="text-xl font-bold"
                  style={{ color: editingTheme.colors.primary }}
                >
                  Preview do Tema: {editingTheme.name}
                </h3>
                
                <div 
                  className="p-4 rounded"
                  style={{ backgroundColor: editingTheme.colors.surface }}
                >
                  <p style={{ color: editingTheme.colors.text }}>
                    Este é um exemplo de texto com o tema aplicado.
                  </p>
                  <p style={{ color: editingTheme.colors.textSecondary }}>
                    Texto secundário com cor mais suave.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: editingTheme.colors.primary }}
                  >
                    Botão Primary
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: editingTheme.colors.secondary }}
                  >
                    Botão Secondary
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: editingTheme.colors.accent }}
                  >
                    Botão Accent
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={exportTheme}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Tema
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
