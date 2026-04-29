// src/hooks/useApiError.ts
/**
 * Hook personalizado para manejo consistente de errores en la UI
 * 
 * Características:
 * - Muestra toasts automáticos según el tipo de error
 * - Maneja redirección en caso de errores de autenticación
 * - Proporciona mensajes amigables al usuario
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { 
  ApiError, 
  NetworkError, 
  ValidationError, 
  AuthenticationError,
  getErrorMessage 
} from '@/types/errors';
import { logger } from '@/lib/logger';

interface UseApiErrorOptions {
  /** Mostrar toast por defecto (true) o solo loguear (false) */
  showToast?: boolean;
  /** Mensaje personalizado para sobreescribir el default */
  customMessage?: string;
  /** Acción adicional a ejecutar después de manejar el error */
  onError?: (error: unknown) => void;
  /** No mostrar toast para ciertos tipos de error */
  silentErrors?: string[];
}

export function useApiError(options: UseApiErrorOptions = {}) {
  const { 
    showToast = true, 
    customMessage, 
    onError,
    silentErrors = [] 
  } = options;

  const handleError = useCallback((error: unknown, overrideOptions?: UseApiErrorOptions) => {
    const mergedOptions = { ...options, ...overrideOptions };
    const shouldShowToast = mergedOptions.showToast !== false;
    
    // Loguear siempre el error para debugging
    logger.error('API Error', error as Error, { 
      customMessage: mergedOptions.customMessage,
      errorType: error instanceof Error ? error.name : 'unknown'
    });

    // Ejecutar callback adicional si existe
    if (mergedOptions.onError) {
      mergedOptions.onError(error);
    }

    // Verificar si es un error silencioso
    const errorName = error instanceof Error ? error.name : '';
    if (mergedOptions.silentErrors?.includes(errorName)) {
      return;
    }

    if (!shouldShowToast) {
      return;
    }

    // Manejar según tipo de error
    if (error instanceof NetworkError) {
      toast.error(mergedOptions.customMessage || error.message);
      return;
    }

    if (error instanceof ValidationError) {
      // Mostrar errores de validación campo por campo
      Object.entries(error.fieldErrors).forEach(([field, messages]) => {
        toast.error(`${field}: ${messages.join(', ')}`);
      });
      return;
    }

    if (error instanceof AuthenticationError || (error instanceof ApiError && error.status === 401)) {
      // Limpiar sesión y redirigir al login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      toast.error(mergedOptions.customMessage || 'Tu sesión expiró. Por favor iniciá sesión nuevamente.');
      
      // Redirigir al login después de un pequeño delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    if (error instanceof ApiError) {
      toast.error(mergedOptions.customMessage || error.message);
      return;
    }

    // Error genérico no tipado
    const message = getErrorMessage(error, mergedOptions.customMessage || 'Ocurrió un error inesperado');
    toast.error(message);
  }, [showToast, customMessage, onError, silentErrors]);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  return { 
    handleError, 
    handleSuccess,
    toast 
  };
}

/**
 * Helper para usar fuera de componentes React
 */
export const apiErrorHandler = {
  handle: (error: unknown, options?: UseApiErrorOptions) => {
    const errorHandler = { handleError: () => {} };
    // En hooks reales se usaría useApiError, esto es solo para casos edge
    logger.error('Global error handler', error as Error);
  }
};

export type { UseApiErrorOptions };
