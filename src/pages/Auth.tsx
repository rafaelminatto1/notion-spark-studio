
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Chrome, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const Auth = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

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
  }, [activeTab]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email é obrigatório';
    if (!emailRegex.test(email)) return 'Email inválido';
    return '';
  };

  // Password validation
  const validatePassword = (password: string, isSignup = false) => {
    if (!password) return 'Senha é obrigatória';
    if (isSignup && password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
    if (isSignup && !/(?=.*[a-z])(?=.*[A-Z])/.test(password)) return 'Senha deve conter pelo menos uma letra maiúscula e minúscula';
    return '';
  };

  // Name validation
  const validateName = (name: string) => {
    if (!name.trim()) return 'Nome é obrigatório';
    if (name.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
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
    
    const result = await signInWithEmail(loginEmail, loginPassword);
    
    if (result?.error) {
      setError('Email ou senha incorretos. Tente novamente.');
    } else {
      setSuccess('Login realizado com sucesso! Redirecionando...');
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
      setPasswordError('Senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await signUpWithEmail(signupEmail, signupPassword, signupName);
    
    if (result?.error) {
      setError('Erro ao criar conta. Tente novamente ou use um email diferente.');
    } else {
      setSuccess('Conta criada com sucesso! Verifique seu email para confirmar.');
      setActiveTab('login');
    }
    
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    await signInWithGoogle();
    setIsSubmitting(false);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Muito fraca', color: 'text-red-500' };
      case 2: return { text: 'Fraca', color: 'text-orange-500' };
      case 3: return { text: 'Média', color: 'text-yellow-500' };
      case 4: return { text: 'Forte', color: 'text-green-500' };
      case 5: return { text: 'Muito forte', color: 'text-green-600' };
      default: return { text: '', color: '' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(signupPassword);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Notion Spark Studio
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {activeTab === 'login' ? 'Entre na sua conta' : 'Crie sua conta gratuitamente'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 animate-fade-in">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              {/* Google Login Button */}
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <Chrome className="h-5 w-5 mr-3 text-blue-500" />
                Continuar com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-muted-foreground font-medium">
                    Ou continue com email
                  </span>
                </div>
              </div>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
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
                        className={`pl-10 h-12 ${emailError ? 'border-red-500' : ''}`}
                        required
                      />
                    </div>
                    {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
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
                        className={`pl-10 pr-10 h-12 ${passwordError ? 'border-red-500' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={signupName}
                        onChange={(e) => {
                          setSignupName(e.target.value);
                          setNameError('');
                        }}
                        className={`pl-10 h-12 ${nameError ? 'border-red-500' : ''}`}
                        required
                      />
                    </div>
                    {nameError && <p className="text-sm text-red-500">{nameError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => {
                          setSignupEmail(e.target.value);
                          setEmailError('');
                        }}
                        className={`pl-10 h-12 ${emailError ? 'border-red-500' : ''}`}
                        required
                      />
                    </div>
                    {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="Crie uma senha forte"
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          setPasswordError('');
                        }}
                        className={`pl-10 pr-10 h-12 ${passwordError ? 'border-red-500' : ''}`}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupPassword && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Força da senha:</span>
                          <span className={strengthInfo.color}>{strengthInfo.text}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              passwordStrength <= 2 ? 'bg-red-500' : 
                              passwordStrength === 3 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                    {confirmPassword && signupPassword !== confirmPassword && (
                      <p className="text-sm text-red-500">Senhas não coincidem</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    disabled={isSubmitting || signupPassword !== confirmPassword}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando conta...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Ao continuar, você concorda com nossos{' '}
                <a href="#" className="underline hover:text-foreground">Termos de Serviço</a>
                {' '}e{' '}
                <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
