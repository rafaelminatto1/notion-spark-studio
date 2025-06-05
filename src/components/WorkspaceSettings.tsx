
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceContext } from '@/hooks/useWorkspace';
import { Settings, Palette, Layout, Save, Trash2, Download, Upload, Monitor } from 'lucide-react';
import { CustomTheme } from '@/types/workspace';

export const WorkspaceSettings: React.FC = () => {
  const {
    currentWorkspace,
    savedWorkspaces,
    customThemes,
    updatePanel,
    togglePanel,
    updateSettings,
    saveWorkspace,
    loadWorkspace,
    deleteWorkspace,
    createCustomTheme,
    resetToDefault
  } = useWorkspaceContext();

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newTheme, setNewTheme] = useState<Partial<CustomTheme>>({
    name: '',
    colors: {
      primary: '#7c3aed',
      secondary: '#4f46e5',
      background: '#191919',
      surface: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#a1a1a1',
      border: '#404040',
      accent: '#8b5cf6'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      fontWeight: 400
    }
  });

  const handleSaveWorkspace = () => {
    if (newWorkspaceName.trim()) {
      saveWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
    }
  };

  const handleCreateTheme = () => {
    if (newTheme.name && newTheme.colors && newTheme.typography) {
      createCustomTheme(newTheme as Omit<CustomTheme, 'id'>);
      setNewTheme({
        name: '',
        colors: newTheme.colors,
        typography: newTheme.typography
      });
    }
  };

  const exportWorkspace = () => {
    const data = {
      workspace: currentWorkspace,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-${currentWorkspace.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-notion-dark text-white max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações do Workspace
        </h1>
        <p className="text-gray-400">
          Personalize seu ambiente de trabalho para máxima produtividade
        </p>
      </div>

      <Tabs defaultValue="layout" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Comportamento
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Workspaces
          </TabsTrigger>
        </TabsList>

        {/* Layout Tab */}
        <TabsContent value="layout">
          <div className="grid gap-6">
            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle>Painéis Visíveis</CardTitle>
                <CardDescription>
                  Configure quais painéis são exibidos no seu workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentWorkspace.panels.map(panel => (
                  <div key={panel.id} className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">{panel.title || panel.type}</Label>
                      <p className="text-xs text-gray-400 mt-1">
                        Posição: {panel.position} • Tamanho: {panel.size}%
                      </p>
                    </div>
                    <Switch
                      checked={panel.isVisible}
                      onCheckedChange={() => togglePanel(panel.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle>Posicionamento</CardTitle>
                <CardDescription>
                  Configure a posição dos elementos principais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Posição da Sidebar</Label>
                    <Select
                      value={currentWorkspace.settings.sidebarPosition}
                      onValueChange={(value: 'left' | 'right') =>
                        updateSettings({ sidebarPosition: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Posição da Toolbar</Label>
                    <Select
                      value={currentWorkspace.settings.toolbarPosition}
                      onValueChange={(value: 'top' | 'bottom' | 'hidden') =>
                        updateSettings({ toolbarPosition: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Superior</SelectItem>
                        <SelectItem value="bottom">Inferior</SelectItem>
                        <SelectItem value="hidden">Oculta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="grid gap-6">
            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle>Tipografia</CardTitle>
                <CardDescription>
                  Configure as fontes e tamanhos de texto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tamanho da Fonte: {currentWorkspace.settings.fontSize}px</Label>
                  <Slider
                    value={[currentWorkspace.settings.fontSize]}
                    onValueChange={([fontSize]) => updateSettings({ fontSize })}
                    min={10}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Altura da Linha: {currentWorkspace.settings.lineHeight}</Label>
                  <Slider
                    value={[currentWorkspace.settings.lineHeight]}
                    onValueChange={([lineHeight]) => updateSettings({ lineHeight })}
                    min={1}
                    max={3}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle>Temas Personalizados</CardTitle>
                <CardDescription>
                  Crie seu próprio tema personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nome do tema"
                    value={newTheme.name}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Button onClick={handleCreateTheme} disabled={!newTheme.name}>
                    Criar Tema
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(newTheme.colors || {}).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key}</Label>
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => setNewTheme(prev => ({
                          ...prev,
                          colors: { ...prev.colors!, [key]: e.target.value }
                        }))}
                        className="h-8 p-1"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {customThemes.map(theme => (
                    <Badge key={theme.id} variant="outline" className="cursor-pointer">
                      {theme.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior">
          <Card className="bg-notion-dark-hover border-notion-dark-border">
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure o comportamento do editor e interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto Save</Label>
                    <Switch
                      checked={currentWorkspace.settings.autoSave}
                      onCheckedChange={(autoSave) => updateSettings({ autoSave })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Números de Linha</Label>
                    <Switch
                      checked={currentWorkspace.settings.showLineNumbers}
                      onCheckedChange={(showLineNumbers) => updateSettings({ showLineNumbers })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Quebra de Linha</Label>
                    <Switch
                      checked={currentWorkspace.settings.wordWrap}
                      onCheckedChange={(wordWrap) => updateSettings({ wordWrap })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Minimapa</Label>
                    <Switch
                      checked={currentWorkspace.settings.minimap}
                      onCheckedChange={(minimap) => updateSettings({ minimap })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Animações</Label>
                    <Switch
                      checked={currentWorkspace.settings.animations}
                      onCheckedChange={(animations) => updateSettings({ animations })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Modo Compacto</Label>
                    <Switch
                      checked={currentWorkspace.settings.compactMode}
                      onCheckedChange={(compactMode) => updateSettings({ compactMode })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Breadcrumbs</Label>
                    <Switch
                      checked={currentWorkspace.settings.showBreadcrumbs}
                      onCheckedChange={(showBreadcrumbs) => updateSettings({ showBreadcrumbs })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces">
          <div className="grid gap-6">
            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle>Salvar Workspace Atual</CardTitle>
                <CardDescription>
                  Salve a configuração atual para usar posteriormente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do workspace"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                  />
                  <Button onClick={handleSaveWorkspace} disabled={!newWorkspaceName.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle>Workspaces Salvos</CardTitle>
                <CardDescription>
                  Gerencie seus workspaces salvos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedWorkspaces.map(workspace => (
                    <div key={workspace.id} className="flex items-center justify-between p-3 bg-notion-dark rounded-lg">
                      <div>
                        <h4 className="font-medium">{workspace.name}</h4>
                        <p className="text-xs text-gray-400">
                          {workspace.panels.filter(p => p.isVisible).length} painéis visíveis
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadWorkspace(workspace.id)}
                        >
                          Carregar
                        </Button>
                        {workspace.id !== 'default' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteWorkspace(workspace.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle>Importar/Exportar</CardTitle>
                <CardDescription>
                  Faça backup ou compartilhe suas configurações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={exportWorkspace} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <Button onClick={resetToDefault} variant="destructive">
                    Resetar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
