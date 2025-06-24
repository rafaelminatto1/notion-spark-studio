import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/AvatarUpload';
import { 
  User, 
  Settings, 
  Palette, 
  Clock, 
  RotateCcw
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export const UserSettings: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { preferences, loadingPreferences, updateUserPreferences } = useUserPreferences();
  const { profile, loading: loadingProfile, updateProfile, loadProfile } = useSupabaseProfile();
  
  const { getRecentActivities } = useActivityHistory();

  if (loadingProfile || !user || !profile) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  const recentActivities = getRecentActivities ? getRecentActivities(5) : [];

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    updateProfile({ avatar: newAvatarUrl });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações do Usuário</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Perfil do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
            <CardDescription>Informações básicas do usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <AvatarUpload
                userId={user.id}
                currentAvatar={profile.avatar}
                userName={profile.name}
                onAvatarChange={handleAvatarChange}
                size="lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile({ email: e.target.value })}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Criado em: {new Date(profile.created_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Preferências de Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Interface
            </CardTitle>
            <CardDescription>Personalização da interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Tema</Label>
              <Select
                value={preferences?.theme ?? 'system'}
                onValueChange={(value: any) => updateUserPreferences({ theme: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="defaultView">Vista padrão</Label>
              <Select
                value={preferences?.default_view ?? 'editor'}
                onValueChange={(value: any) => updateUserPreferences({ default_view: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="graph">Grafo</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Modo compacto</Label>
              <Switch
                checked={preferences?.compact_mode || false}
                onCheckedChange={(checked) => updateUserPreferences({ compact_mode: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar números de linha</Label>
              <Switch
                checked={preferences?.show_line_numbers !== false}
                onCheckedChange={(checked) => updateUserPreferences({ show_line_numbers: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Animações</Label>
              <Switch
                checked={preferences?.enable_animations !== false}
                onCheckedChange={(checked) => updateUserPreferences({ enable_animations: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sistema
            </CardTitle>
            <CardDescription>Configurações de funcionamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Auto-save</Label>
              <Switch
                checked={preferences?.auto_save !== false}
                onCheckedChange={(checked) => updateUserPreferences({ auto_save: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="backupFreq">Backup (min)</Label>
              <Select
                value={(preferences?.backup_frequency ?? 30).toString()}
                onValueChange={(value) => updateUserPreferences({ backup_frequency: parseInt(value) })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={preferences?.language ?? 'pt'}
                onValueChange={(value: any) => updateUserPreferences({ language: value })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">PT</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <Button 
              variant="outline" 
              onClick={loadProfile}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recarregar configurações
            </Button>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas ações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="flex-1">{activity.description}</span>
                    <span className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
