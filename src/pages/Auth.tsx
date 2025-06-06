import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate } from 'react-router-dom';
import { Chrome, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import AuthHeader from '@/components/auth/AuthHeader';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

const Auth = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Real-time validation flags
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Current form values for validation
  const [currentSignupEmail, setCurrentSignupEmail] = useState('');
  const [currentSignupPassword, setCurrentSignupPassword] = useState('');
  const [currentSignupName, setCurrentSignupName] = useState('');
  const [currentConfirmPassword, setCurrentConfirmPassword] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Clear errors when switching tabs
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setEmailError('');
    setPasswordError('');
    setNameError('');
    setConfirmPasswordError('');
    setEmailTouched(false);
    setPasswordTouched(false);
    setNameTouched(false);
    setConfirmPasswordTouched(false);
  }, [activeTab]);

  // Real-time validation for signup email
  useEffect(() => {
    if (emailTouched && activeTab === 'signup') {
      const error = validateEmail(currentSignupEmail);
      setEmailError(error);
    }
  }, [currentSignupEmail, emailTouched, activeTab]);

  // Real-time validation for signup password
  useEffect(() => {
    if (passwordTouched && activeTab === 'signup') {
      const error = validatePassword(currentSignupPassword, true);
      setPasswordError(error);
    }
  }, [currentSignupPassword, passwordTouched, activeTab]);

  // Real-time validation for confirm password
  useEffect(() => {
    if (confirmPasswordTouched && currentSignupPassword && currentConfirmPassword) {
      if (currentSignupPassword !== currentConfirmPassword) {
        setConfirmPasswordError('As senhas não coincidem');
      } else {
        setConfirmPasswordError('');
      }
    }
  }, [currentConfirmPassword, currentSignupPassword, confirmPasswordTouched]);

  // Real-time validation for name
  useEffect(() => {
    if (nameTouched) {
      const error = validateName(currentSignupName);
      setNameError(error);
    }
  }, [currentSignupName, nameTouched]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email é obrigatório';
    if (!emailRegex.test(email)) return 'Formato de email inválido';
    return '';
  };

  // Password validation
  const validatePassword = (password: string, isSignup = false) => {
    if (!password) return 'Senha é obrigatória';
    if (isSignup && password.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
    if (isSignup && !/(?=.*[a-z])/.test(password)) return 'Senha deve conter pelo menos uma letra minúscula';
    if (isSignup && !/(?=.*[A-Z])/.test(password)) return 'Senha deve conter pelo menos uma letra maiúscula';
    if (isSignup && !/(?=.*\d)/.test(password)) return 'Senha deve conter pelo menos um número';
    return '';
  };

  // Name validation
  const validateName = (name: string) => {
    if (!name.trim()) return 'Nome é obrigatório';
    if (name.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
    if (name.trim().length > 50) return 'Nome deve ter no máximo 50 caracteres';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) return 'Nome deve conter apenas letras e espaços';
    return '';
  };

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    
    if (emailErr || passwordErr) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result?.error) {
        if (result.error.message?.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else if (result.error.message?.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada e confirme seu email.');
        } else {
          setError('Erro ao fazer login. Tente novamente em alguns instantes.');
        }
      } else {
        setSuccess('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password, true);
    
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    
    if (nameErr || emailErr || passwordErr) return;
    
    if (password !== currentConfirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await signUpWithEmail(email, password, name);
      
      if (result?.error) {
        if (result.error.message?.includes('User already registered')) {
          setError('Este email já está cadastrado. Tente fazer login ou use outro email.');
        } else if (result.error.message?.includes('Password should be at least')) {
          setError('Senha muito fraca. Use uma senha mais forte.');
        } else {
          setError('Erro ao criar conta. Verifique os dados e tente novamente.');
        }
      } else {
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
        // Clear form
        setCurrentSignupName('');
        setCurrentSignupEmail('');
        setCurrentSignupPassword('');
        setCurrentConfirmPassword('');
        // Switch to login tab after 3 seconds
        setTimeout(() => setActiveTab('login'), 3000);
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

  const handleResetPassword = async (email: string) => {
    setError(null);
    setSuccess(null);
    
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(email);
      
      if (result?.error) {
        setError('Erro ao enviar email de reset. Verifique o email e tente novamente.');
      } else {
        setSuccess('Email de reset enviado! Verifique sua caixa de entrada.');
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  // Handlers for form field changes
  const handleLoginEmailChange = (email: string) => {
    setEmailError('');
  };

  const handleLoginPasswordChange = (password: string) => {
    setPasswordError('');
  };

  const handleSignupNameChange = (name: string) => {
    setCurrentSignupName(name);
    if (!nameTouched) setNameTouched(true);
  };

  const handleSignupEmailChange = (email: string) => {
    setCurrentSignupEmail(email);
    if (!emailTouched) setEmailTouched(true);
  };

  const handleSignupPasswordChange = (password: string) => {
    setCurrentSignupPassword(password);
    if (!passwordTouched) setPasswordTouched(true);
  };

  const handleConfirmPasswordChange = (password: string) => {
    setCurrentConfirmPassword(password);
    if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg backdrop-saturate-150">
          <AuthHeader activeTab={activeTab} />
          
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
                disabled={isSubmitting}
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
                <LoginForm
                  onSubmit={handleLogin}
                  onResetPassword={handleResetPassword}
                  isSubmitting={isSubmitting}
                  emailError={emailError}
                  passwordError={passwordError}
                  onEmailChange={handleLoginEmailChange}
                  onPasswordChange={handleLoginPasswordChange}
                />
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-5 mt-0">
                <SignupForm
                  onSubmit={handleSignup}
                  isSubmitting={isSubmitting}
                  nameError={nameError}
                  emailError={emailError}
                  passwordError={passwordError}
                  confirmPasswordError={confirmPasswordError}
                  onNameChange={handleSignupNameChange}
                  onEmailChange={handleSignupEmailChange}
                  onPasswordChange={handleSignupPasswordChange}
                  onConfirmPasswordChange={handleConfirmPasswordChange}
                />
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
};

export default Auth;
