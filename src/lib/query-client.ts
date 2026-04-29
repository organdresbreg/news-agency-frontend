// src/lib/query-client.ts
/**
 * Configuración de React Query con manejo global de errores
 * 
 * Características:
 * - Error handling automático para queries y mutations
 * - Retry logic inteligente (no reintentar errores 4xx)
 * - Integración con sistema de toasts
 * - Logging de errores
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, NetworkError, AuthenticationError } from '@/types/errors';
import { logger } from './logger';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Loguear el error siempre
      logger.error(`Query failed: ${query.queryKey}`, error as Error);

      // Manejar según tipo de error
      if (error instanceof NetworkError) {
        toast.error('Error de conexión. Verificá tu internet e intentá de nuevo.');
      } else if (error instanceof AuthenticationError || (error instanceof ApiError && error.status === 401)) {
        toast.error('Tu sesión expiró. Por favor iniciá sesión nuevamente.');
        // Limpiar tokens y redirigir
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      } else if (error instanceof ApiError) {
        // No mostrar toast para errores 404 en queries (puede ser estado esperado)
        if (error.status !== 404) {
          toast.error(error.message);
        }
      } else {
        toast.error('Ocurrió un error al cargar los datos.');
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Loguear el error siempre
      logger.error(`Mutation failed: ${mutation.mutationKey}`, error as Error);

      // Manejar según tipo de error
      if (error instanceof NetworkError) {
        toast.error('Error de conexión. Verificá tu internet e intentá de nuevo.');
      } else if (error instanceof AuthenticationError || (error instanceof ApiError && error.status === 401)) {
        toast.error('Tu sesión expiró. Por favor iniciá sesión nuevamente.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Ocurrió un error al procesar tu solicitud.');
      }
    },
    onSuccess: (data, variables, context, mutation) => {
      // Log opcional para debugging
      logger.debug(`Mutation success: ${mutation.mutationKey}`);
    },
  }),
  defaultOptions: {
    queries: {
      // Reintentar solo errores de servidor (5xx) o de red
      retry: (failureCount, error) => {
        // No reintentar errores de autenticación/autorización
        if (error instanceof ApiError && error.status < 500) {
          return false;
        }
        // No reintentar errores de red después de 3 intentos
        if (error instanceof NetworkError) {
          return failureCount < 3;
        }
        // Reintentar errores de servidor hasta 2 veces
        return failureCount < 2;
      },
      // Delay exponencial entre reintentos
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
      },
      // Timeout por defecto para queries
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10,  // 10 minutos (antes cacheTime)
      // No hacer refetch al enfocar ventana por defecto
      refetchOnWindowFocus: false,
      // Lanzar errores para que sean capturados por error boundaries
      throwOnError: true,
    },
    mutations: {
      // No reintentar mutations por defecto (puede causar efectos secundarios)
      retry: false,
    },
  },
});
