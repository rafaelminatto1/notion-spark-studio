'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase-unified';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  Star, 
  Users, 
  Calendar, 
  BookOpen, 
  BarChart3,
  Plus,
  Eye,
  Loader2
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onClose,
  isOpen = false
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Carregar templates
  useEffect(() => {
    if (user && isOpen) {
      loadTemplates();
    }
  }, [user, isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error loading templates:', error);
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'project': return <BarChart3 className="h-4 w-4" />;
      case 'study': return <BookOpen className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'meeting': return 'Reuniões';
      case 'project': return 'Projetos';
      case 'study': return 'Estudos';
      case 'report': return 'Relatórios';
      case 'general': return 'Geral';
      default: return 'Outros';
    }
  };

  const getCategories = () => {
    const categories = [...new Set(templates.map(t => t.category))];
    return categories.map(cat => ({
      id: cat,
      name: getCategoryName(cat),
      icon: getCategoryIcon(cat),
      count: templates.filter(t => t.category === cat).length
    }));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = async (template: Template) => {
    try {
      // Incrementar contador de uso
      await supabase
        .from('document_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id);

      onSelectTemplate(template);
      onClose?.();
    } catch (error) {
      console.error('Error updating template usage:', error);
      // Continuar mesmo com erro
      onSelectTemplate(template);
      onClose?.();
    }
  };

  const previewContent = (content: string) => {
    // Remover markdown e limitar texto
    const plainText = content
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/```[\s\S]*?```/g, '[código]') // Code blocks
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/^\s*[-*+]\s/gm, '• ') // List items
      .replace(/^\s*\d+\.\s/gm, '1. '); // Numbered lists

    return plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando templates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Escolher Template</h2>
        <p className="text-gray-600">
          Comece com um template profissional ou crie do zero
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs por categoria */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            Todos ({templates.length})
          </TabsTrigger>
          {getCategories().map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              <div className="flex items-center space-x-1">
                {category.icon}
                <span>{category.name} ({category.count})</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Template em branco */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-blue-300 bg-blue-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 p-3 bg-blue-100 rounded-full w-fit">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Documento em Branco</CardTitle>
            <CardDescription>
              Comece do zero com um documento vazio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => handleSelectTemplate({
                id: 'blank',
                name: 'Documento em Branco',
                description: 'Documento vazio para começar do zero',
                content: '# [Título do Documento]\n\nComece a escrever aqui...',
                category: 'general',
                is_public: true,
                created_by: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                usage_count: 0
              })}
            >
              Criar Documento
            </Button>
          </CardContent>
        </Card>

        {/* Templates */}
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(template.category)}
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(template.category)}
                      </Badge>
                      {template.is_public && (
                        <Badge variant="secondary" className="text-xs">
                          Público
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Star className="h-3 w-3 mr-1" />
                  {template.usage_count}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600 max-h-20 overflow-hidden">
                {previewContent(template.content)}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => handleSelectTemplate(template)}
                >
                  Usar Template
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        {getCategoryIcon(template.category)}
                        <span>{template.name}</span>
                      </DialogTitle>
                      <DialogDescription>
                        {template.description}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                      <div className="prose max-w-none">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: template.content
                              .replace(/\n/g, '<br>')
                              .replace(/#{6}\s(.*)/g, '<h6>$1</h6>')
                              .replace(/#{5}\s(.*)/g, '<h5>$1</h5>')
                              .replace(/#{4}\s(.*)/g, '<h4>$1</h4>')
                              .replace(/#{3}\s(.*)/g, '<h3>$1</h3>')
                              .replace(/#{2}\s(.*)/g, '<h2>$1</h2>')
                              .replace(/#{1}\s(.*)/g, '<h1>$1</h1>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          }}
                          className="whitespace-pre-wrap"
                        />
                      </div>
                      
                      <div className="mt-6 pt-4 border-t flex justify-end space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => setPreviewTemplate(null)}
                        >
                          Fechar
                        </Button>
                        <Button onClick={() => handleSelectTemplate(template)}>
                          Usar Este Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente buscar por outros termos ou escolha uma categoria diferente.'
              : 'Não há templates disponíveis nesta categoria.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector; 