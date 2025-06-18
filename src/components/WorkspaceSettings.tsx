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
import { useTheme } from '@/components/ThemeProvider';
import { ThemeEditor } from '@/components/ThemeEditor';
import { Edit, Plus } from 'lucide-react';

export const WorkspaceSettings: React.FC = () => {
  const { 
    currentWorkspace, 
    customThemes, 
    updateWorkspaceSettings, 
    createCustomTheme,
    updatePanelVisibility 
  } = useWorkspaceContext();
  
  const { files, currentFileId, updateFile, createFile, getCurrentFile } = useFileSystem();
  const { customTheme, setCustomTheme, availableThemes } = useTheme();
  const currentFile = getCurrentFile();

  const [newThemeName, setNewThemeName] = useState('');
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);

  const handleSettingChange = (key: string, value: any) => {
    updateWorkspaceSettings({ [key]: value });
  };

  const handleCreateTheme = () => {
    if (newThemeName.trim()) {
      createCustomTheme(newThemeName);
      setNewThemeName('');
    }
  };

  const handleEditTheme = (theme = null) => {
    setEditingTheme(theme);
    setIsThemeEditorOpen(true);
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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Avançado
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
                    onValueChange={(value) => { handleSettingChange('fontSize', value[0]); }}
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
                    onValueChange={(value) => { handleSettingChange('lineHeight', value[0]); }}
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
                    onCheckedChange={(checked) => { handleSettingChange('autoSave', checked); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showLineNumbers">Números de Linha</Label>
                  <Switch
                    id="showLineNumbers"
                    checked={currentWorkspace.settings.showLineNumbers}
                    onCheckedChange={(checked) => { handleSettingChange('showLineNumbers', checked); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="wordWrap">Quebra de Linha</Label>
                  <Switch
                    id="wordWrap"
                    checked={currentWorkspace.settings.wordWrap}
                    onCheckedChange={(checked) => { handleSettingChange('wordWrap', checked); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="minimap">Minimap</Label>
                  <Switch
                    id="minimap"
                    checked={currentWorkspace.settings.minimap}
                    onCheckedChange={(checked) => { handleSettingChange('minimap', checked); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animações</Label>
                  <Switch
                    id="animations"
                    checked={currentWorkspace.settings.animations}
                    onCheckedChange={(checked) => { handleSettingChange('animations', checked); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compactMode">Modo Compacto</Label>
                  <Switch
                    id="compactMode"
                    checked={currentWorkspace.settings.compactMode}
                    onCheckedChange={(checked) => { handleSettingChange('compactMode', checked); }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sidebarPosition">Posição da Sidebar</Label>
                <Select
                  value={currentWorkspace.settings.sidebarPosition}
                  onValueChange={(value) => { handleSettingChange('sidebarPosition', value); }}
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
                      onCheckedChange={(checked) => { updatePanelVisibility(panel.id, checked); }}
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
              <CardTitle>Gerenciamento de Temas</CardTitle>
              <CardDescription>
                Crie, edite e aplique temas personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Tema Ativo</Label>
                  <div className="mt-2">
                    {customTheme ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-500/10">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded border-2 border-white shadow"
                            style={{ backgroundColor: customTheme.colors.primary }}
                          />
                          <div>
                            <div className="font-medium">{customTheme.name}</div>
                            <div className="text-sm text-muted-foreground">Tema personalizado ativo</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => { handleEditTheme(customTheme); }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 border rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">
                          Nenhum tema personalizado ativo. Usando tema do sistema.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Temas Disponíveis ({availableThemes.length})</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { handleEditTheme(); }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Tema
                    </Button>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    {availableThemes.map((theme) => (
                      <div key={theme.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
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
                          <div>
                            <div className="font-medium">{theme.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {theme.typography.fontFamily.split(',')[0]}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {customTheme?.id === theme.id ? (
                            <Badge variant="secondary">Ativo</Badge>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setCustomTheme(theme); }}
                            >
                              Aplicar
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { handleEditTheme(theme); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {availableThemes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum tema personalizado criado ainda.</p>
                      <p className="text-sm">Clique em "Novo Tema" para criar seu primeiro tema.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas de Tema</CardTitle>
              <CardDescription>
                Configurações experimentais e avançadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Transições Suaves</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativa animações ao trocar temas
                    </p>
                  </div>
                  <Switch
                    checked={currentWorkspace.settings.animations}
                    onCheckedChange={(checked) => { handleSettingChange('animations', checked); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CSS Personalizado</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicione CSS personalizado para ajustes finos
                  </p>
                  <textarea 
                    className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
                    placeholder={`/* Exemplo: */
.custom-element {
  background: var(--theme-primary);
  color: var(--theme-text);
}`}
                  />
                </div>
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

      <ThemeEditor
        isOpen={isThemeEditorOpen}
        onClose={() => { setIsThemeEditorOpen(false); }}
        selectedTheme={editingTheme}
      />
    </div>
  );
};
