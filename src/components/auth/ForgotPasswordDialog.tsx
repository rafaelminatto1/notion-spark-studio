
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string) => Promise<void>;
  isSubmitting: boolean;
}

const ForgotPasswordDialog = ({ open, onOpenChange, onSubmit, isSubmitting }: ForgotPasswordDialogProps) => {
  const [resetEmail, setResetEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(resetEmail);
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
      setResetEmail('');
      onOpenChange(false);
    }, 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
          Esqueci minha senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Redefinir Senha
          </DialogTitle>
          <DialogDescription>
            Digite seu email para receber um link de redefinição de senha.
          </DialogDescription>
        </DialogHeader>
        
        {emailSent ? (
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto animate-bounce" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-700">Email enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada e siga as instruções no email.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 transition-all duration-200 focus:border-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !resetEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Link
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
