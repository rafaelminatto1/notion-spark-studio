'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Palette, 
  Download,
  Trash2,
  Save,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, signOut, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    avatar_url: profile?.avatar_url || ''
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      mentions: true,
      comments: true
    },
    privacy: {
      profile_public: false,
      activity_visible: true
    }
  });

  // Redirecionar se não autenticado
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.full_name.trim()) {
      setMessage({
        type: 'error',
        text: 'Nome completo é obrigatório'
      });
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      const { error } = await updateProfile({
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || 'Erro ao atualizar perfil'
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Perfil atualizado com sucesso!'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao atualizar perfil'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simular upload de avatar
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileData(prev => ({
            ...prev,
            avatar_url: event.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportData = () => {
    // Simular exportação de dados
    const data = {
      profile: profile,
      preferences: preferences,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notion-spark-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    if (confirm('ATENÇÃO: Esta ação é irreversível. Tem certeza que deseja excluir sua conta permanentemente?')) {
      if (confirm('Digite "EXCLUIR" para confirmar:') === 'EXCLUIR') {
        // Implementar exclusão de conta
        console.log('Excluir conta');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informações do Perfil
                </CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais e foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {profileData.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Alterar Foto
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        PNG, JPG até 5MB
                      </p>
                    </div>
                  </div>

                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Seu nome completo"
                      disabled={isUpdating}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">
                      Para alterar seu email, entre em contato com o suporte
                    </p>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <div>
                      <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                        {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Salvando...' : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Aparência e Preferências
                </CardTitle>
                <CardDescription>
                  Personalize sua experiência no Notion Spark Studio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tema */}
                <div className="space-y-3">
                  <Label>Tema</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={preferences.theme === 'light'}
                        onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                      />
                      <span>Claro</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={preferences.theme === 'dark'}
                        onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                      />
                      <span>Escuro</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="auto"
                        checked={preferences.theme === 'auto'}
                        onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                      />
                      <span>Automático</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure como e quando você deseja ser notificado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  email: 'Notificações por email',
                  push: 'Notificações push',
                  mentions: 'Quando mencionado',
                  comments: 'Comentários em documentos'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [key]: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacidade e Segurança
                </CardTitle>
                <CardDescription>
                  Controle quem pode ver suas informações e atividades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  profile_public: 'Perfil público',
                  activity_visible: 'Atividade visível para outros'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <input
                      type="checkbox"
                      checked={preferences.privacy[key as keyof typeof preferences.privacy]}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        privacy: {
                          ...prev.privacy,
                          [key]: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Conta</CardTitle>
                <CardDescription>
                  Exportar dados, sair da conta ou excluir permanentemente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Exportar Dados</h4>
                    <p className="text-sm text-gray-600">
                      Baixe uma cópia de todos os seus dados
                    </p>
                  </div>
                  <Button variant="outline" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Sair da Conta</h4>
                    <p className="text-sm text-gray-600">
                      Desconectar de todos os dispositivos
                    </p>
                  </div>
                  <Button variant="outline" onClick={signOut}>
                    Sair
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-900">Excluir Conta</h4>
                    <p className="text-sm text-red-700">
                      Ação permanente e irreversível
                    </p>
                  </div>
                  <Button variant="destructive" onClick={deleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SettingsPage; 