import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, NetworkError, ValidationError } from '@/types/errors';
import { createLogger } from './logger';

const logger = createLogger('ReactQuery');

function classifyAndToast(error: unknown, customMessage?: string) {
    if (error instanceof NetworkError) {
        toast.error('Error de conexión. Verificá tu internet.');
    } else if (error instanceof ValidationError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
            toast.error(`${field}: ${messages.join(', ')}`);
        });
    } else if (error instanceof ApiError) {
        if (error.status === 401) {
            // El redirect lo maneja useApiError / el middleware de Next.js
            toast.error('Tu sesión expiró. Iniciá sesión nuevamente.');
        } else if (error.status === 403) {
            toast.error('No tenés permisos para realizar esta acción.');
        } else if (error.status === 429) {
            toast.error('Demasiadas solicitudes. Esperá un momento.');
        } else if (error.status >= 500) {
            toast.error('Error en el servidor. Intentá de nuevo más tarde.');
        } else {
            toast.error(customMessage || error.message);
        }
    } else {
        toast.error(customMessage || 'Ocurrió un error inesperado.');
    }
}

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            const keyStr = JSON.stringify(query.queryKey);
            logger.error('Query failed', error as Error, { queryKey: keyStr });
            classifyAndToast(error);
        },
    }),

    mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) => {
            const mutationKey = mutation.options.mutationKey
                ? JSON.stringify(mutation.options.mutationKey)
                : '(sin key)';
            logger.error('Mutation failed', error as Error, { mutationKey });
            classifyAndToast(error);
        },
        onSuccess: (_data, _variables, _context, mutation) => {
            const mutationKey = mutation.options.mutationKey
                ? JSON.stringify(mutation.options.mutationKey)
                : '(sin key)';
            logger.debug('Mutation succeeded', { mutationKey });
        },
    }),

    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // No reintentar en errores del cliente (4xx)
                if (error instanceof ApiError && error.status < 500) return false;
                return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            staleTime: 30_000, // 30 segundos — evita refetches innecesarios en dev
        },
        mutations: {
            retry: (failureCount, error) => {
                // Las mutations sólo reintentan en errores de red, nunca en 4xx
                if (error instanceof ApiError) return false;
                return failureCount < 2;
            },
        },
    },
});