// Re-export everything from the modularized components
export { ErrorBoundary, useErrorHandler } from './ErrorBoundaryUI';
export type { ErrorReportData, ErrorContext } from './ErrorBoundaryCore';

// Default export for compatibility
export { ErrorBoundary as default } from './ErrorBoundaryUI'; 