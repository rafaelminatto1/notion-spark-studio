
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, UserPlus } from 'lucide-react';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

interface SignupFormProps {
  onSubmit: (email: string, password: string, name: string) => Promise<void>;
  isSubmitting: boolean;
  nameError: string;
  emailError: string;
  passwordError: string;
  confirmPasswordError: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
}

const SignupForm = ({ 
  onSubmit, 
  isSubmitting, 
  nameError, 
  emailError, 
  passwordError, 
  confirmPasswordError,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange
}: SignupFormProps) => {
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(signupEmail, signupPassword, signupName);
  };

  const handleNameChange = (name: string) => {
    setSignupName(name);
    onNameChange(name);
  };

  const handleEmailChange = (email: string) => {
    setSignupEmail(email);
    onEmailChange(email);
  };

  const handlePasswordChange = (password: string) => {
    setSignupPassword(password);
    onPasswordChange(password);
  };

  const handleConfirmPasswordChange = (password: string) => {
    setConfirmPassword(password);
    onConfirmPasswordChange(password);
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

  const isFormValid = signupName && signupEmail && signupPassword && 
                     confirmPassword && signupPassword === confirmPassword &&
                     getPasswordStrength(signupPassword) >= 3;

  return (
    <div className="space-y-5 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="signup-name" className="text-sm font-semibold text-foreground">Nome completo</Label>
          <div className="relative group">
            <User className={`absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200 ${
              isFormFocused ? 'text-green-500' : 'text-muted-foreground'
            }`} />
            <Input
              id="signup-name"
              type="text"
              placeholder="Seu nome completo"
              value={signupName}
              onChange={(e) => { handleNameChange(e.target.value); }}
              onFocus={() => { setIsFormFocused(true); }}
              onBlur={() => { setIsFormFocused(false); }}
              className={`pl-10 h-12 transition-all duration-200 ${
                nameError ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500 hover:border-green-300'
              }`}
              required
              disabled={isSubmitting}
            />
          </div>
          {nameError && (
            <p className="text-sm text-red-500 flex items-center gap-1 animate-fade-in">
              <AlertCircle className="h-3 w-3" />
              {nameError}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-sm font-semibold text-foreground">Email</Label>
          <div className="relative group">
            <Mail className={`absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200 ${
              isFormFocused ? 'text-green-500' : 'text-muted-foreground'
            }`} />
            <Input
              id="signup-email"
              type="email"
              placeholder="seu@email.com"
              value={signupEmail}
              onChange={(e) => { handleEmailChange(e.target.value); }}
              onFocus={() => { setIsFormFocused(true); }}
              onBlur={() => { setIsFormFocused(false); }}
              className={`pl-10 h-12 transition-all duration-200 ${
                emailError ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500 hover:border-green-300'
              }`}
              required
              disabled={isSubmitting}
            />
          </div>
          {emailError && (
            <p className="text-sm text-red-500 flex items-center gap-1 animate-fade-in">
              <AlertCircle className="h-3 w-3" />
              {emailError}
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="signup-password" className="text-sm font-semibold text-foreground">Senha</Label>
          <div className="relative group">
            <Lock className={`absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200 ${
              isFormFocused ? 'text-green-500' : 'text-muted-foreground'
            }`} />
            <Input
              id="signup-password"
              type={showSignupPassword ? 'text' : 'password'}
              placeholder="Crie uma senha forte"
              value={signupPassword}
              onChange={(e) => { handlePasswordChange(e.target.value); }}
              onFocus={() => { setIsFormFocused(true); }}
              onBlur={() => { setIsFormFocused(false); }}
              className={`pl-10 pr-12 h-12 transition-all duration-200 ${
                passwordError ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500 hover:border-green-300'
              }`}
              required
              minLength={8}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => { setShowSignupPassword(!showSignupPassword); }}
              className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
              disabled={isSubmitting}
            >
              {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          <PasswordStrengthIndicator password={signupPassword} />
          
          {passwordError && (
            <p className="text-sm text-red-500 flex items-center gap-1 animate-fade-in">
              <AlertCircle className="h-3 w-3" />
              {passwordError}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirmar senha</Label>
          <div className="relative group">
            <Lock className={`absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200 ${
              isFormFocused ? 'text-green-500' : 'text-muted-foreground'
            }`} />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => { handleConfirmPasswordChange(e.target.value); }}
              onFocus={() => { setIsFormFocused(true); }}
              onBlur={() => { setIsFormFocused(false); }}
              className={`pl-10 pr-12 h-12 transition-all duration-200 ${
                confirmPasswordError ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500 hover:border-green-300'
              }`}
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => { setShowConfirmPassword(!showConfirmPassword); }}
              className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPasswordError && (
            <p className="text-sm text-red-500 flex items-center gap-1 animate-fade-in">
              <AlertCircle className="h-3 w-3" />
              {confirmPasswordError}
            </p>
          )}
          {confirmPassword && !confirmPasswordError && signupPassword === confirmPassword && (
            <p className="text-sm text-green-600 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="h-3 w-3" />
              Senhas coincidem
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Criando conta...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar conta
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default SignupForm;
