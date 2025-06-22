import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, User } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';

export const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmail, loading, error } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signInWithEmail(email, password);
      // Se chegou aqui, o login foi bem-sucedido  
      router.push('/dashboard');
    } catch (err) {
      console.error('Erro no login:', err);
      // O erro já está sendo tratado pelo hook
    }
  };

  const handleDemoLogin = () => {
    // Login de demonstração - pula a autenticação
    console.log('Entrando no modo demonstração...');
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error.message || 'Erro ao fazer login. Verifique suas credenciais.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
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
                disabled={loading}
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            type="submit" 
            className="w-full h-11" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-11" 
            onClick={handleDemoLogin}
            disabled={loading}
          >
            <User className="mr-2 h-4 w-4" />
            Entrar no Modo Demonstração
          </Button>

          <div className="text-center">
            <ForgotPasswordDialog>
              <Button 
                variant="link" 
                className="text-sm text-muted-foreground hover:text-primary"
                type="button"
              >
                Esqueceu sua senha?
              </Button>
            </ForgotPasswordDialog>
          </div>
        </div>
      </form>
    </div>
  );
};
