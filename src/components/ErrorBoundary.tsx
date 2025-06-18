import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
  isRetrying: boolean;
}

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  sessionId: string;
  retryCount: number;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      isRetrying: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, maxRetries = 3 } = this.props;
    
    this.setState({ errorInfo });

    // Log estruturado do erro
    this.logError(error, errorInfo);

    // Callback personalizado
    if (onError) {
      onError(error, errorInfo);
    }

    // Retry automático para erros específicos
    if (this.shouldAutoRetry(error) && this.state.retryCount < maxRetries) {
      this.scheduleAutoRetry();
    }

    // Mostrar toast de erro
    this.showErrorToast(error);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport: ErrorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
      retryCount: this.state.retryCount
    };

    // Log local
    console.group(`🚨 Error Boundary - ${errorReport.errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Full Report:', errorReport);
    console.groupEnd();

    // Salvar no localStorage para debug
    this.saveErrorToStorage(errorReport);
  };

  private shouldAutoRetry = (error: Error): boolean => {
    const retryableErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'NetworkError',
      'Failed to fetch',
      'Connection timeout'
    ];

    return retryableErrors.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  };

  private scheduleAutoRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff
    
    this.setState({ isRetrying: true });

    const timeout = setTimeout(() => {
      this.handleRetry(true);
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private handleRetry = (isAutomatic = false) => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      toast({
        title: "Limite de tentativas excedido",
        description: "Por favor, recarregue a página ou entre em contato com o suporte.",
        variant: "destructive"
      });
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false
    }));

    toast({
      title: isAutomatic ? "Tentativa automática" : "Tentando novamente",
      description: `Tentativa ${this.state.retryCount + 1} de ${maxRetries}`,
      variant: "default"
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    const mailtoLink = `mailto:support@notionspark.com?subject=Bug Report - ${String(this.state.errorId)}&body=${encodeURIComponent(JSON.stringify(errorReport, null, 2))}`;
    window.open(mailtoLink);
  };

  private showErrorToast = (error: Error) => {
    try {
      toast({
        title: "Ops! Algo deu errado",
        description: this.props.showErrorDetails ? error.message : "Ocorreu um erro inesperado. Tentando resolver...",
        variant: "destructive",
        duration: 5000
      });
    } catch (toastError) {
      // Fallback se toast não estiver disponível (ex: em testes)
      console.warn('Toast not available:', toastError);
    }
  };

  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('error-boundary-session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('error-boundary-session', sessionId);
    }
    return sessionId;
  };

  private saveErrorToStorage = (errorReport: ErrorReport) => {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error-boundary-logs') || '[]');
      existingErrors.push(errorReport);
      
      // Manter apenas os últimos 10 erros
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('error-boundary-logs', JSON.stringify(recentErrors));
    } catch (storageError) {
      console.error('Failed to save error to storage:', storageError);
    }
  };

  componentWillUnmount() {
    // Limpar timeouts
    this.retryTimeouts.forEach(timeout => { clearTimeout(timeout); });
  }

  render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de erro padrão
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Oops! Algo deu errado</CardTitle>
              <CardDescription>
                {this.props.showErrorDetails && this.state.error ? (
                  <div className="mt-2 p-2 bg-muted rounded text-sm font-mono text-left">
                    {this.state.error.message}
                  </div>
                ) : (
                  "Encontramos um problema inesperado. Não se preocupe, estamos trabalhando para resolver."
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Informações do erro */}
              <div className="text-xs text-muted-foreground text-center">
                ID do Erro: {String(this.state.errorId)}
                {this.state.retryCount > 0 && (
                  <div>Tentativas: {String(this.state.retryCount)}</div>
                )}
              </div>

              {/* Ações */}
              <div className="space-y-2">
                {this.props.enableRetry !== false && (
                  <Button 
                    onClick={() => { this.handleRetry(); }} 
                    className="w-full"
                    disabled={this.state.isRetrying}
                  >
                    {this.state.isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Tentando novamente...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                      </>
                    )}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={this.handleGoHome}
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Início
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={this.handleReload}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recarregar
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  onClick={this.handleReportBug}
                  className="w-full text-xs"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Reportar Bug
                </Button>
              </div>

              {/* Detalhes técnicos (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Detalhes Técnicos
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

  // Hook para usar Error Boundary programaticamente
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: unknown) => {
    console.error('[useErrorHandler] Erro capturado:', error);
    
    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error);
    }
  };

  const reportError = async (error: Error, context?: unknown) => {
    const errorReport = {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href
    };

    console.log('Error Report:', errorReport);
    
    // Em produção, enviar para API
    if (process.env.NODE_ENV === 'production') {
      try {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport)
        });
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
  };

  return { handleError, reportError };
};

// Componente wrapper para facilitar uso
export const ErrorBoundary: React.FC<Props> = (props) => {
  return <EnhancedErrorBoundary {...props} />;
};

export default EnhancedErrorBoundary;
