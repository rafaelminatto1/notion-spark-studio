
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

const ResetPassword = () => {
  const { updatePassword, user, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation states
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Check if user is authenticated and has access token
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Real-time validation for password
  useEffect(() => {
    if (passwordTouched) {
      const error = validatePassword(newPassword);
      setPasswordError(error);
    }
  }, [newPassword, passwordTouched]);

  // Real-time validation for confirm password
  useEffect(() => {
    if (confirmPasswordTouched && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('As senhas não coincidem');
      } else {
        setConfirmPasswordError('');
      }
    }
  }, [confirmPassword, newPassword, confirmPasswordTouched]);

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) return 'Senha é obrigatória';
    if (password.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
    if (!/(?=.*[a-z])/.test(password)) return 'Senha deve conter pelo menos uma letra minúscula';
    if (!/(?=.*[A-Z])/.test(password)) return 'Senha deve conter pelo menos uma letra maiúscula';
    if (!/(?=.*\d)/.test(password)) return 'Senha deve conter pelo menos um número';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    const passwordErr = validatePassword(newPassword);
    
    setPasswordError(passwordErr);
    
    if (passwordErr) return;
    
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await updatePassword(newPassword);
      
      if (result?.error) {
        setError('Erro ao atualizar senha. Tente novamente.');
      } else {
        setSuccess('Senha atualizada com sucesso! Redirecionando...');
        setTimeout(() => navigate('/'), 2000);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
          <p className="text-lg font-medium text-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getPasswordStrengthInfo(passwordStrength);
  const requirements = getPasswordRequirements(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-base mt-3 text-muted-foreground">
              Digite sua nova senha para atualizar sua conta
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-sm font-semibold text-foreground">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {newPassword && (
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
                <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua nova senha"
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
                {confirmPassword && !confirmPasswordError && newPassword === confirmPassword && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Senhas coincidem
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isSubmitting || newPassword !== confirmPassword || !newPassword || !confirmPassword}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Atualizando senha...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Atualizar Senha
                  </>
                )}
              </Button>
            </form>
            
            <div className="text-center pt-4 border-t border-gray-100 dark:border-slate-700">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Voltar para o login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
