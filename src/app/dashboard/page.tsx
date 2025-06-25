'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  FileText, 
  Folder, 
  Clock, 
  Users, 
  Search,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Share,
  Star,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_starred: boolean;
  type: 'document' | 'folder';
}

interface RecentActivity {
  id: string;
  type: 'created' | 'edited' | 'shared' | 'deleted';
  document_title: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('documents');
  const router = useRouter();

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Carregar dados do dashboard
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    // Simular dados para demonstração
    setDocuments([
      {
        id: '1',
        title: 'Projeto Notion Spark Studio',
        content: 'Documentação principal do projeto...',
        created_at: '2025-01-20T10:00:00Z',
        updated_at: '2025-01-25T15:30:00Z',
        is_public: false,
        is_starred: true,
        type: 'document'
      },
      {
        id: '2',
        title: 'Reunião de Planejamento',
        content: 'Notas da reunião sobre roadmap...',
        created_at: '2025-01-24T14:00:00Z',
        updated_at: '2025-01-24T16:45:00Z',
        is_public: true,
        is_starred: false,
        type: 'document'
      },
      {
        id: '3',
        title: 'Ideias e Brainstorming',
        content: '',
        created_at: '2025-01-23T09:00:00Z',
        updated_at: '2025-01-23T09:00:00Z',
        is_public: false,
        is_starred: false,
        type: 'folder'
      }
    ]);

    setRecentActivity([
      {
        id: '1',
        type: 'edited',
        document_title: 'Projeto Notion Spark Studio',
        timestamp: '2025-01-25T15:30:00Z'
      },
      {
        id: '2',
        type: 'created',
        document_title: 'Reunião de Planejamento',
        timestamp: '2025-01-24T14:00:00Z'
      },
      {
        id: '3',
        type: 'shared',
        document_title: 'Reunião de Planejamento',
        timestamp: '2025-01-24T16:45:00Z'
      }
    ]);
  };

  const createNewDocument = () => {
    router.push('/editor/new');
  };

  const openDocument = (documentId: string) => {
    router.push(`/editor/${documentId}`);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="h-4 w-4 text-green-600" />;
      case 'edited': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'shared': return <Share className="h-4 w-4 text-purple-600" />;
      case 'deleted': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'created': return `Criou "${activity.document_title}"`;
      case 'edited': return `Editou "${activity.document_title}"`;
      case 'shared': return `Compartilhou "${activity.document_title}"`;
      case 'deleted': return `Excluiu "${activity.document_title}"`;
      default: return `Ação em "${activity.document_title}"`;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Será redirecionado
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Notion Spark Studio</h1>
            <Badge variant="outline">Dashboard</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback>
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{profile?.full_name || user.email}</span>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            Bem-vindo, {profile?.full_name || 'Usuário'}! 👋
          </h2>
          <p className="text-gray-600">
            Organize suas ideias, crie documentos e colabore com sua equipe.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={createNewDocument}>
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium">Novo Documento</h3>
              <p className="text-sm text-gray-600">Comece a escrever</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Folder className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium">Nova Pasta</h3>
              <p className="text-sm text-gray-600">Organize seus arquivos</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium">Convidar Equipe</h3>
              <p className="text-sm text-gray-600">Colabore com outros</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="activity">Atividade Recente</TabsTrigger>
            <TabsTrigger value="shared">Compartilhados</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDocument(doc.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {doc.type === 'folder' ? (
                          <Folder className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-600" />
                        )}
                        <CardTitle className="text-sm font-medium truncate">{doc.title}</CardTitle>
                      </div>
                      {doc.is_starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {doc.content && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{doc.content}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Editado {new Date(doc.updated_at).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-1">
                        {doc.is_public && <Badge variant="outline" className="text-xs">Público</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Tente buscar por outros termos.' : 'Comece criando seu primeiro documento.'}
                </p>
                {!searchTerm && (
                  <Button onClick={createNewDocument}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Documento
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  Suas ações mais recentes no workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getActivityText(activity)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shared" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Documentos Compartilhados
                </CardTitle>
                <CardDescription>
                  Documentos compartilhados com você e sua equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento compartilhado</h3>
                  <p className="text-gray-600">
                    Quando alguém compartilhar documentos com você, eles aparecerão aqui.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard; 