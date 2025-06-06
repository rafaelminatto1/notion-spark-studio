import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Chrome, Eye, EyeOff, AlertCircle, CheckCircle2, Shield, Sparkles } from 'lucide-react';

const Auth = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

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
      const error = validateEmail(signupEmail);
      setEmailError(error);
    }
  }, [signupEmail, emailTouched, activeTab]);

  // Real-time validation for signup password
  useEffect(() => {
    if (passwordTouched && activeTab === 'signup') {
      const error = validatePassword(signupPassword, true);
      setPasswordError(error);
    }
  }, [signupPassword, passwordTouched, activeTab]);

  // Real-time validation for confirm password
  useEffect(() => {
    if (confirmPasswordTouched && signupPassword && confirmPassword) {
      if (signupPassword !== confirmPassword) {
        setConfirmPasswordError('As senhas não coincidem');
      } else {
        setConfirmPasswordError('');
      }
    }
  }, [confirmPassword, signupPassword, confirmPasswordTouched]);

  // Real-time validation for name
  useEffect(() => {
    if (nameTouched) {
      const error = validateName(signupName);
      setNameError(error);
    }
  }, [signupName, nameTouched]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    const emailErr = validateEmail(loginEmail);
    const passwordErr = validatePassword(loginPassword);
    
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    
    if (emailErr || passwordErr) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await signInWithEmail(loginEmail, loginPassword);
      
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    const nameErr = validateName(signupName);
    const emailErr = validateEmail(signupEmail);
    const passwordErr = validatePassword(signupPassword, true);
    
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    
    if (nameErr || emailErr || passwordErr) return;
    
    if (signupPassword !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await signUpWithEmail(signupEmail, signupPassword, signupName);
      
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
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setConfirmPassword('');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const emailErr = validateEmail(resetEmail);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(resetEmail);
      
      if (result?.error) {
        setError('Erro ao enviar email de reset. Verifique o email e tente novamente.');
      } else {
        setSuccess('Email de reset enviado! Verifique sua caixa de entrada.');
        setShowResetDialog(false);
        setResetEmail('');
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthInfo = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Muito fraca', color: 'bg-red-500', textColor: 'text-red-600' };
      case 2: return { text: 'Fraca', color: 'bg-orange-500', textColor: 'text-orange-600' };
      case 3: return { text: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
      case 4: return { text: 'Forte', color: 'bg-green-500', textColor: 'text-green-600' };
      case 5: return { text: 'Muito forte', color: 'bg-green-600', textColor: 'text-green-700' };
      default: return { text: '', color: '', textColor: '' };
    }
  };

  const getPasswordRequirements = (password: string) => {
    return [
      { text: 'Pelo menos 8 caracteres', met: password.length >= 8 },
      { text: 'Uma letra minúscula', met: /[a-z]/.test(password) },
      { text: 'Uma letra maiúscula', met: /[A-Z]/.test(password) },
      { text: 'Um número', met: /\d/.test(password) },
      { text: 'Um caractere especial', met: /[^A-Za-z0-9]/.test(password) }
    ];
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

  const passwordStrength = getPasswordStrength(signupPassword);
  const strengthInfo = getPasswordStrengthInfo(passwordStrength);
  const requirements = getPasswordRequirements(signupPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <div className="relative">
                <span className="text-3xl">📚</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Notion Spark Studio
            </CardTitle>
            <CardDescription className="text-base mt-3 text-muted-foreground">
              {activeTab === 'login' ? 'Entre na sua conta e continue criando' : 'Crie sua conta e comece a inovar'}
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
                className="w-full h-12 text-base font-medium border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 group"
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
              <TabsContent value="login" className="space-y-5">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setEmailError('');
                        }}
                        className={`pl-10 h-12 transition-all duration-200 ${
                          emailError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                        }`}
                        required
                      />
                    </div>
                    {emailError && <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-semibold text-foreground">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setPasswordError('');
                        }}
                        className={`pl-10 pr-12 h-12 transition-all duration-200 ${
                          passwordError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {passwordError}
                    </p>}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm text-blue-600 hover:text-blue-700">
                          Esqueci minha senha
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Redefinir Senha</DialogTitle>
                          <DialogDescription>
                            Digite seu email para receber um link de redefinição de senha.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="reset-email"
                                type="email"
                                placeholder="seu@email.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setShowResetDialog(false)}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="flex-1"
                            >
                              {isSubmitting ? 'Enviando...' : 'Enviar Link'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Entrando...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-5">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-semibold text-foreground">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={signupName}
                        onChange={(e) => {
                          setSignupName(e.target.value);
                          if (!nameTouched) setNameTouched(true);
                        }}
                        onBlur={() => setNameTouched(true)}
                        className={`pl-10 h-12 transition-all duration-200 ${
                          nameError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                        }`}
                        required
                      />
                    </div>
                    {nameError && <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {nameError}
                    </p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-semibold text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => {
                          setSignupEmail(e.target.value);
                          if (!emailTouched) setEmailTouched(true);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        className={`pl-10 h-12 transition-all duration-200 ${
                          emailError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                        }`}
                        required
                      />
                    </div>
                    {emailError && <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-sm font-semibold text-foreground">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="Crie uma senha forte"
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          if (!passwordTouched) setPasswordTouched(true);
                        }}
                        onBlur={() => setPasswordTouched(true)}
                        className={`pl-10 pr-12 h-12 transition-all duration-200 ${
                          passwordError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                        }`}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {signupPassword && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Força da senha:</span>
                          <span className={`font-medium ${strengthInfo.textColor}`}>
                            {strengthInfo.text}
                          </span>
                        </div>
                        <Progress value={(passwordStrength / 5) * 100} className="h-2" />
                        
                        <div className="space-y-1">
                          {requirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {passwordError && <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {passwordError}
                    </p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
                        }}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        className={`pl-10 pr-12 h-12 transition-all duration-200 ${
                          confirmPasswordError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPasswordError && <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {confirmPasswordError}
                    </p>}
                    {confirmPassword && !confirmPasswordError && signupPassword === confirmPassword && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Senhas coincidem
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isSubmitting || signupPassword !== confirmPassword || !signupPassword || !confirmPassword}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Criar conta
                      </>
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
};

export default Auth;
