'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  Sparkles,
  Chrome,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | 'magic' | 'demo' | null>(null);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const { signInWithEmail, signInWithGoogle, resetPassword, loading, error, user } = useSupabaseAuth();

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setIsEmailValid(isValid);
    
    if (!email) {
      setEmailError('');
    } else if (!isValid) {
      setEmailError('Digite um email válido');
    } else {
      setEmailError('');
    }
    
    return isValid;
  };

  // Password validation
  const validatePassword = (password: string) => {
    const isValid = password.length >= 6;
    setIsPasswordValid(isValid);
    
    if (!password) {
      setPasswordError('');
    } else if (!isValid) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (user) {
      setSuccessMessage('Login realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        onSuccess?.() || router.push('/dashboard');
      }, 1000);
    }
  }, [user, router, onSuccess]);

  // Handle form submission
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoginMethod('email');
    setIsLoading(true);

    // Validate inputs
    const isEmailOk = validateEmail(email);
    const isPasswordOk = validatePassword(password);

    if (!isEmailOk || !isPasswordOk) {
      setIsLoading(false);
      setLoginMethod(null);
      return;
    }

    try {
      // Special handling for admin user
      if (email === 'rafael.minatto@yahoo.com.br') {
        setSuccessMessage('Bem-vindo, Administrador! Validando credenciais...');
      }

      await signInWithEmail(email, password);
      
      setSuccessMessage('Login realizado com sucesso!');
      
    } catch (err) {
      console.error('Erro no login:', err);
      setLocalError('Email ou senha incorretos. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
      setLoginMethod(null);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLocalError(null);
    setLoginMethod('google');
    setIsLoading(true);
    
    try {
      setSuccessMessage('Redirecionando para Google...');
      await signInWithGoogle();
    } catch (err) {
      console.error('Erro no login com Google:', err);
      setLocalError('Erro ao conectar com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
      setLoginMethod(null);
    }
  };

  // Handle Magic Link
  const handleMagicLink = async () => {
    if (!validateEmail(email)) {
      setLocalError('Digite um email válido para receber o link mágico');
      return;
    }

    setLocalError(null);
    setLoginMethod('magic');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccessMessage(`Link mágico enviado para ${email}! Verifique sua caixa de entrada.`);
    } catch (err) {
      console.error('Erro ao enviar link mágico:', err);
      setLocalError('Erro ao enviar link mágico. Tente novamente.');
    } finally {
      setIsLoading(false);
      setLoginMethod(null);
    }
  };

  // Handle demo login
  const handleDemoLogin = () => {
    setLocalError(null);
    setLoginMethod('demo');
    setIsLoading(true);
    
    setSuccessMessage('Entrando no modo demonstração...');
    
    setTimeout(() => {
      setIsLoading(false);
      setLoginMethod(null);
      onSuccess?.() || router.push('/dashboard');
    }, 1500);
  };

  // Quick admin login
  const handleQuickAdminLogin = () => {
    setEmail('rafael.minatto@yahoo.com.br');
    setPassword('');
    validateEmail('rafael.minatto@yahoo.com.br');
  };

  const displayError = localError || error?.message;
  const isFormValid = isEmailValid && isPasswordValid;
  const showLoading = loading || isLoading;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Notion Spark Studio
            </CardTitle>
          </div>
          <CardDescription className="text-center text-gray-600">
            Entre na sua conta para acessar a plataforma
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {displayError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {displayError}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Admin Access */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Acesso Administrativo</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleQuickAdminLogin}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                Preencher
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-1">rafael.minatto@yahoo.com.br</p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  className={`pl-10 h-12 ${emailError ? 'border-red-300 focus:border-red-500' : 
                    isEmailValid ? 'border-green-300 focus:border-green-500' : ''
                  }`}
                  disabled={showLoading}
                  required
                />
                {isEmailValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {emailError && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  className={`pl-10 pr-10 h-12 ${passwordError ? 'border-red-300 focus:border-red-500' : 
                    isPasswordValid ? 'border-green-300 focus:border-green-500' : ''
                  }`}
                  disabled={showLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={showLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200"
              disabled={showLoading || !isFormValid}
            >
              {showLoading && loginMethod === 'email' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Alternative Login Methods */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-500 font-medium">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
              onClick={handleGoogleLogin}
              disabled={showLoading}
            >
              {showLoading && loginMethod === 'google' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4 text-red-500" />
                  Continuar com Google
                </>
              )}
            </Button>

            {/* Magic Link */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
              onClick={handleMagicLink}
              disabled={showLoading || !isEmailValid}
            >
              {showLoading && loginMethod === 'magic' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4 text-blue-500" />
                  Enviar Link Mágico
                </>
              )}
            </Button>

            {/* Demo Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-dashed border-gray-300 hover:bg-gray-50 text-gray-600"
              onClick={handleDemoLogin}
              disabled={showLoading}
            >
              {showLoading && loginMethod === 'demo' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Modo Demonstração
                </>
              )}
            </Button>
          </div>

          {/* Forgot Password */}
          <div className="text-center pt-2">
            <ForgotPasswordDialog>
              <Button 
                variant="link" 
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                type="button"
              >
                Esqueceu sua senha?
              </Button>
            </ForgotPasswordDialog>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-6 text-xs text-gray-500">
        <p>© 2024 Notion Spark Studio. Todos os direitos reservados.</p>
        <p className="mt-1">Versão Enterprise 2.0 • Seguro & Confiável</p>
      </div>
    </div>
  );
};
