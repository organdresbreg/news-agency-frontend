// src/components/ErrorBoundary.tsx
/**
 * Error Boundary para capturar errores en componentes React
 * 
 * Características:
 * - Captura errores de renderizado, lifecycle methods y constructors
 * - Muestra UI de fallback amigable al usuario
 * - Loguea errores para debugging
 * - Permite reintentar el componente
 */

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Loguear el error con contexto completo
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Llamar callback opcional para manejo adicional
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Actualizar estado
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Algo salió mal
          </h2>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4 text-center max-w-md">
            {this.state.error?.message || 'Ocurrió un error inesperado al cargar este componente.'}
          </p>
          
          {/* Mostrar detalles solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="w-full max-w-lg mb-4 text-xs">
              <summary className="cursor-pointer text-red-500 hover:text-red-700">
                Ver detalles técnicos
              </summary>
              <pre className="mt-2 p-3 bg-red-100 dark:bg-red-950 rounded overflow-auto max-h-60 text-red-800 dark:text-red-200">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <Button 
            onClick={this.handleRetry}
            variant="outline"
            className="border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher Order Component para envolver componentes con ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { fallback?: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={options?.fallback} onError={options?.onError}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
