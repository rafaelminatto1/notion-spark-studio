import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

// Tipos específicos para melhorar type safety
export type SanitizedProps = Record<string, unknown>;
export type SanitizedState = Record<string, unknown>;
export type ErrorContext = Record<string, unknown>;

export interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  retryCount: number;
  context: {
    component: string;
    props: SanitizedProps;
    state: SanitizedState;
  };
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
  isolateError?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
  isRetrying: boolean;
}

export interface ErrorReportData {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  retryCount: number;
  context: ErrorContext;
}

export class ErrorReportingService {
  private endpoint = '/api/errors';
  private queue: ErrorReportData[] = [];
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        void this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  async report(errorData: ErrorReportData): Promise<void> {
    if (this.isOnline) {
      try {
        await this.sendReport(errorData);
      } catch (error) {
        console.error('Failed to send error report:', error);
        this.queue.push(errorData);
      }
    } else {
      this.queue.push(errorData);
    }
  }

  private async sendReport(report: ErrorReportData): Promise<void> {
    const payload = {
      errorId: report.errorId,
      message: report.error.message,
      stack: report.error.stack,
      componentStack: report.errorInfo.componentStack,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      retryCount: report.retryCount,
      context: report.context
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async flushQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const report = this.queue.shift();
      if (report) {
        try {
          await this.sendReport(report);
        } catch (error) {
          console.error('Failed to flush error report:', error);
          this.queue.unshift(report);
          break;
        }
      }
    }
  }
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private errorReportingService: ErrorReportingService;

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

    this.errorReportingService = new ErrorReportingService();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now().toString()}_${Math.random().toString(36).substring(2, 11)}`;
    
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

    // Reportar erro para serviço de monitoramento
    void this.reportError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport: ErrorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      sessionId: this.getSessionId(),
      retryCount: this.state.retryCount,
      context: {
        component: this.getComponentName(),
        props: this.sanitizeProps(this.props),
        state: this.sanitizeState(this.state)
      }
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

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await this.errorReportingService.report({
        error,
        errorInfo,
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        context: {
          component: this.getComponentName(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: Date.now()
        }
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
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

  handleRetry = (isAutomatic = false) => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn("Limite de tentativas excedido");
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false
    }));

    console.log(`${isAutomatic ? "Tentativa automática" : "Tentando novamente"} - Tentativa ${(this.state.retryCount + 1).toString()} de ${maxRetries.toString()}`);
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message || 'Unknown'}
Timestamp: ${new Date().toISOString()}
User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}
URL: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}

Stack Trace:
${this.state.error?.stack || 'Not available'}

Component Stack:
${this.state.errorInfo?.componentStack || 'Not available'}
    `.trim());

    const mailtoLink = `mailto:support@example.com?subject=${subject}&body=${body}`;
    if (typeof window !== 'undefined') {
      window.open(mailtoLink);
    }
  };

  private getComponentName = (): string => {
    return this.constructor.name || 'Unknown Component';
  };

  private getSessionId = (): string => {
    if (typeof sessionStorage !== 'undefined') {
      let sessionId = sessionStorage.getItem('error-session-id');
      if (!sessionId) {
        sessionId = `session_${Date.now().toString()}_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem('error-session-id', sessionId);
      }
      return sessionId;
    }
    return 'unknown-session';
  };

  private sanitizeProps = (props: Props): SanitizedProps => {
    const { children, onError, ...safeProps } = props;
    return safeProps;
  };

  private sanitizeState = (state: State): SanitizedState => {
    return { ...state, error: state.error?.message || null };
  };

  private saveErrorToStorage = (errorReport: ErrorReport) => {
    if (typeof localStorage !== 'undefined') {
      try {
        const existingErrors = JSON.parse(localStorage.getItem('error-reports') || '[]') as ErrorReport[];
        existingErrors.push(errorReport);
        
        // Keep only last 10 errors
        const recentErrors = existingErrors.slice(-10);
        localStorage.setItem('error-reports', JSON.stringify(recentErrors));
      } catch (error) {
        console.warn('Failed to save error to localStorage:', error);
      }
    }
  };

  componentWillUnmount() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  // This method should be implemented by the UI component
  render() {
    if (this.state.hasError) {
      // This will be overridden by the UI component
      return null;
    }

    return this.props.children;
  }
}

export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Handled error:', error, errorInfo);
  };

  const reportError = async (error: Error, context?: ErrorContext) => {
    const errorReportingService = new ErrorReportingService();
    try {
      await errorReportingService.report({
        error,
        errorInfo: { componentStack: '' },
        errorId: `manual_${Date.now().toString()}`,
        retryCount: 0,
        context: context || {}
      });
    } catch (reportingError) {
      console.error('Failed to report error manually:', reportingError);
    }
  };

  return { handleError, reportError };
}; 