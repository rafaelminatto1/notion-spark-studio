'use client';

import React, { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Chrome, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { FileItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { PageLoader } from '@/components/LoadingSpinner';

// Mock data para demonstração
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Projeto Principal',
    type: 'file',
    emoji: '📋',
    tags: ['trabalho', 'importante'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    content: 'Conteúdo do projeto principal...'
  },
  {
    id: '2',
    name: 'Ideias Criativas',
    type: 'file',
    emoji: '💡',
    tags: ['criatividade', 'brainstorm'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    content: 'Lista de ideias criativas...'
  },
  {
    id: '3',
    name: 'Reuniões',
    type: 'folder',
    emoji: '📁',
    tags: ['reuniões', 'trabalho'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-19'),
    content: ''
  }
];

const mockFavorites = ['1', '2'];

export default function HomePage() {
  const { user, loading } = useAuth();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loading: authLoading } = useSupabaseAuth();
  
  // Login/Signup form states
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação simples de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    if (!password) {
      setError('Por favor, insira sua senha');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result?.error) {
        if (result.error.message?.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos. Verifique suas credenciais.');
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
      } else {
        setSuccess('Login realizado com sucesso!');
        // O useAuth vai redirecionar automaticamente quando user estiver disponível
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!name.trim()) {
      setError('Por favor, insira seu nome');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await signUpWithEmail(email, password, name);
      
      if (result?.error) {
        if (result.error.message?.includes('already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
      } else {
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar.');
        setActiveTab('login');
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      await signInWithGoogle();
    } catch (error) {
      setError('Erro ao conectar com Google. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Verificando autenticação...</p>
            <p className="text-sm text-muted-foreground">Aguarde um momento</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostrar tela de login bonita
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg backdrop-saturate-150">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-2">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Notion Spark Studio
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {activeTab === 'login' ? 'Entre na sua conta' : 'Crie sua conta gratuita'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive" className="animate-fade-in border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-sm font-medium">{success}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 dark:bg-slate-800/80 h-12 rounded-xl">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-lg font-medium transition-all duration-200"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-lg font-medium transition-all duration-200"
                  >
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                {/* Google Login Button */}
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 group hover:scale-[1.02]"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || authLoading}
                >
                  <Chrome className="h-5 w-5 mr-3 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
                  Continuar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-4 text-muted-foreground font-medium">
                      Ou continue com email
                    </span>
                  </div>
                </div>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-5 mt-0">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11" 
                      disabled={isSubmitting || authLoading}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup" className="space-y-5 mt-0">
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha (min. 6 caracteres)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          className="h-11 pr-10"
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11" 
                      disabled={isSubmitting || authLoading}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        'Criar conta'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              <div className="text-center pt-4 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ao continuar, você concorda com nossos{' '}
                  <a href="#" className="underline hover:text-foreground transition-colors duration-200 font-medium">
                    Termos de Serviço
                  </a>
                  {' '}e{' '}
                  <a href="#" className="underline hover:text-foreground transition-colors duration-200 font-medium">
                    Política de Privacidade
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleNavigateToFile = (fileId: string) => {
    console.log('Navegando para arquivo:', fileId);
    // Implementar navegação para arquivo específico
  };

  const handleCreateFile = (name: string) => {
    console.log('Criando arquivo:', name);
    // Implementar criação de arquivo
  };

  // Se estiver logado, ir direto para o dashboard
  return (
    <div className="pt-4">
      <Dashboard
        files={mockFiles}
        favorites={mockFavorites}
        onNavigateToFile={handleNavigateToFile}
        onCreateFile={handleCreateFile}
      />
    </div>
  );
}