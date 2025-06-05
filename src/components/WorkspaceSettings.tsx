import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SystemManager } from '@/components/SystemManager';
import { useWorkspaceContext } from '@/hooks/useWorkspace';
import { useFileSystem } from '@/hooks/useFileSystem';
import { Palette, Layout, Cog, Database } from 'lucide-react';

export const WorkspaceSettings: React.FC = () => {
  const { 
    currentWorkspace, 
    customThemes, 
    updateWorkspaceSettings, 
    createCustomTheme,
    updatePanelVisibility 
  } = useWorkspaceContext();
  
  const { files, currentFileId, updateFile, createFile, getCurrentFile } = useFileSystem();
  const currentFile = getCurrentFile();

  const [newThemeName, setNewThemeName] = useState('');

  const handleSettingChange = (key: string, value: any) => {
    updateWorkspaceSettings({ [key]: value });
  };

  const handleCreateTheme = () => {
    if (newThemeName.trim()) {
      createCustomTheme(newThemeName);
      setNewThemeName('');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Configurações do Workspace</h1>
        <p className="text-muted-foreground">
          Personalize seu ambiente de trabalho
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Temas
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Ajuste as configurações básicas do editor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Tamanho da Fonte</Label>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={24}
                    step={1}
                    value={[currentWorkspace.settings.fontSize]}
                    onValueChange={(value) => handleSettingChange('fontSize', value[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground">
                    {currentWorkspace.settings.fontSize}px
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineHeight">Altura da Linha</Label>
                  <Slider
                    id="lineHeight"
                    min={1.2}
                    max={2.0}
                    step={0.1}
                    value={[currentWorkspace.settings.lineHeight]}
                    onValueChange={(value) => handleSettingChange('lineHeight', value[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground">
                    {currentWorkspace.settings.lineHeight}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSave">Auto-save</Label>
                  <Switch
                    id="autoSave"
                    checked={currentWorkspace.settings.autoSave}
                    onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showLineNumbers">Números de Linha</Label>
                  <Switch
                    id="showLineNumbers"
                    checked={currentWorkspace.settings.showLineNumbers}
                    onCheckedChange={(checked) => handleSettingChange('showLineNumbers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="wordWrap">Quebra de Linha</Label>
                  <Switch
                    id="wordWrap"
                    checked={currentWorkspace.settings.wordWrap}
                    onCheckedChange={(checked) => handleSettingChange('wordWrap', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="minimap">Minimap</Label>
                  <Switch
                    id="minimap"
                    checked={currentWorkspace.settings.minimap}
                    onCheckedChange={(checked) => handleSettingChange('minimap', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animações</Label>
                  <Switch
                    id="animations"
                    checked={currentWorkspace.settings.animations}
                    onCheckedChange={(checked) => handleSettingChange('animations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compactMode">Modo Compacto</Label>
                  <Switch
                    id="compactMode"
                    checked={currentWorkspace.settings.compactMode}
                    onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sidebarPosition">Posição da Sidebar</Label>
                <Select
                  value={currentWorkspace.settings.sidebarPosition}
                  onValueChange={(value) => handleSettingChange('sidebarPosition', value)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Painéis do Layout</CardTitle>
              <CardDescription>
                Configure a visibilidade e posição dos painéis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {currentWorkspace.panels.map((panel) => (
                  <div key={panel.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{panel.title || panel.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {panel.position} • {panel.size}%
                      </div>
                    </div>
                    <Switch
                      checked={panel.isVisible}
                      onCheckedChange={(checked) => updatePanelVisibility(panel.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temas Personalizados</CardTitle>
              <CardDescription>
                Crie e gerencie seus temas personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do novo tema"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                />
                <Button onClick={handleCreateTheme} disabled={!newThemeName.trim()}>
                  Criar Tema
                </Button>
              </div>

              <div className="grid gap-2">
                {customThemes.map((theme) => (
                  <div key={theme.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{theme.name}</div>
                      <div className="flex gap-2 mt-1">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: theme.colors.background }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>
                    </div>
                    <Badge variant="secondary">Personalizado</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <SystemManager
            files={files}
            currentFile={currentFile}
            onUpdateFile={updateFile}
            onCreateFile={async (name: string, parentId?: string, type?: 'file' | 'folder') => {
              return await createFile(name, parentId, type);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
