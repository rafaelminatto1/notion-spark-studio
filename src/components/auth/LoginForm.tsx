
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import ForgotPasswordDialog from './ForgotPasswordDialog';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  isSubmitting: boolean;
  emailError: string;
  passwordError: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
}

const LoginForm = ({ 
  onSubmit, 
  onResetPassword, 
  isSubmitting, 
  emailError, 
  passwordError,
  onEmailChange,
  onPasswordChange
}: LoginFormProps) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(loginEmail, loginPassword);
  };

  const handleEmailChange = (email: string) => {
    setLoginEmail(email);
    onEmailChange(email);
  };

  const handlePasswordChange = (password: string) => {
    setLoginPassword(password);
    onPasswordChange(password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-sm font-semibold text-foreground">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="seu@email.com"
            value={loginEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
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
            onChange={(e) => handlePasswordChange(e.target.value)}
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

      <div className="text-right">
        <ForgotPasswordDialog
          open={showResetDialog}
          onOpenChange={setShowResetDialog}
          onSubmit={onResetPassword}
          isSubmitting={isSubmitting}
        />
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
  );
};

export default LoginForm;
