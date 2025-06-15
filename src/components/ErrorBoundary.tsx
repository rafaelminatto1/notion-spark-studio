import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para debugging
    console.error('[ErrorBoundary] Erro capturado:', error);
    console.error('[ErrorBoundary] Informações do erro:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Aqui você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Renderizar UI de fallback customizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Oops! Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada e está trabalhando para resolver o problema.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 p-3 rounded-md text-xs">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Detalhes técnicos (desenvolvimento)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Erro:</strong>
                      <pre className="mt-1 text-red-600 whitespace-pre-wrap">
                        {this.state.error.message}
                      </pre>
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-gray-600 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-gray-600 whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button onClick={this.handleReload} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
                
                <Button onClick={this.handleGoHome} variant="ghost" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Início
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                Se o problema persistir, entre em contato com o suporte.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar em componentes funcionais
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('[useErrorHandler] Erro capturado:', error);
    
    // Aqui você pode enviar para um serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error);
    }
  };

  return { handleError };
};
