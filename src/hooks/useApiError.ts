import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError, ValidationError, NetworkError } from '@/types/errors';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useApiError');

interface UseApiErrorOptions {
    /** Si es true, no muestra toasts automáticos. */
    silent?: boolean;
    /** Mensaje personalizado que reemplaza el mensaje del error. */
    customMessage?: string;
    /** Callback adicional que se ejecuta después del manejo estándar. */
    onError?: (error: unknown) => void;
}

export function useApiError() {
    const router = useRouter();

    const handleError = useCallback(
        (error: unknown, options: UseApiErrorOptions | string = {}) => {
            // Soporta llamada corta: handleError(error, 'Mensaje custom')
            const opts: UseApiErrorOptions =
                typeof options === 'string' ? { customMessage: options } : options;

            const { silent = false, customMessage, onError } = opts;

            // Siempre loguear, independientemente de silent
            logger.error('Error capturado', error as Error, {
                ...(customMessage && { customMessage }),
            });

            if (!silent) {
                if (error instanceof NetworkError) {
                    toast.error(customMessage || 'Error de conexión. Verificá tu internet.');
                } else if (error instanceof ValidationError) {
                    // Mostrar cada campo con error como toast separado
                    const entries = Object.entries(error.fieldErrors);
                    if (entries.length === 0) {
                        toast.error(customMessage || 'Datos inválidos.');
                    } else {
                        entries.forEach(([field, messages]) => {
                            toast.error(`${field}: ${messages.join(', ')}`);
                        });
                    }
                } else if (error instanceof ApiError) {
                    switch (error.status) {
                        case 401:
                            toast.error('Tu sesión expiró. Redirigiendo...');
                            localStorage.removeItem('access_token');
                            // Usar router en lugar de window.location para mantener el historial
                            setTimeout(() => router.push('/login'), 1000);
                            break;
                        case 403:
                            toast.error(
                                customMessage ||
                                    'No tenés permisos para realizar esta acción.',
                            );
                            break;
                        case 404:
                            toast.error(customMessage || 'El recurso no fue encontrado.');
                            break;
                        case 429:
                            toast.error(
                                customMessage ||
                                    'Demasiadas solicitudes. Esperá un momento.',
                            );
                            break;
                        default:
                            if (error.status >= 500) {
                                toast.error(
                                    customMessage ||
                                        'Error en el servidor. Intentá de nuevo más tarde.',
                                );
                            } else {
                                toast.error(customMessage || error.message);
                            }
                    }
                } else {
                    toast.error(customMessage || 'Ocurrió un error inesperado.');
                }
            }

            onError?.(error);
        },
        [router],
    );

    const handleSuccess = useCallback((message: string) => {
        toast.success(message);
        logger.info(message);
    }, []);

    return { handleError, handleSuccess };
}