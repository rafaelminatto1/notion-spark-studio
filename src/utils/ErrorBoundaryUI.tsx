import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, Home, Mail } from 'lucide-react';
import { EnhancedErrorBoundary, type ErrorReportData, type ErrorContext } from './ErrorBoundaryCore';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
  isolateError?: boolean;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return (
    <EnhancedErrorBoundaryWithUI {...props} />
  );
};

class EnhancedErrorBoundaryWithUI extends EnhancedErrorBoundary {
  private showErrorToast = (error: Error) => {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showErrorDetails = false, enableRetry = true } = this.props;

      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Algo deu errado
              </CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Nosso time foi notificado automaticamente.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {showErrorDetails && this.state.error && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Detalhes do erro:
                  </p>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ID: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                {enableRetry && (
                  <Button
                    onClick={() => this.handleRetry()}
                    disabled={this.state.isRetrying}
                    className="w-full"
                  >
                    {this.state.isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Tentando novamente...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar novamente
                      </>
                    )}
                  </Button>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Início
                  </Button>

                  <Button
                    variant="outline"
                    onClick={this.handleReload}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recarregar
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={this.handleReportBug}
                  className="w-full text-gray-600"
                  size="sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reportar problema
                </Button>
              </div>

              {this.state.retryCount > 0 && (
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Tentativas: {this.state.retryCount}/{this.props.maxRetries || 3}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    this.showErrorToast(error);
  }
}

export { useErrorHandler } from './ErrorBoundaryCore';
export type { ErrorReportData, ErrorContext } from './ErrorBoundaryCore'; 