export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
        // Fix: mantiene el prototipo correcto en subclases de Error en TS
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NetworkError extends Error {
    constructor(message = 'Error de conexión') {
        super(message);
        this.name = 'NetworkError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ValidationError extends Error {
    constructor(public fieldErrors: Record<string, string[]>) {
        super('Errores de validación');
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// Helpers de tipado
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
}

export function isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Ocurrió un error inesperado';
}

/**
 * Procesa una Response de fetch y lanza el error tipado correcto.
 * - 401 → ApiError (UNAUTHORIZED)
 * - 403 → ApiError (FORBIDDEN)
 * - 404 → ApiError (NOT_FOUND)
 * - 422 → ValidationError con fieldErrors
 * - 204 → undefined (no content)
 * - 2xx → JSON parseado
 */
export async function handleResponse<T>(response: Response): Promise<T> {
    // 204 No Content — respuesta válida sin cuerpo
    if (response.status === 204) return undefined as T;

    if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        try {
            errorData = await response.json();
        } catch {
            // El cuerpo no era JSON — usamos fallback
        }

        switch (response.status) {
            case 401:
                throw new ApiError('No autorizado', 401, 'UNAUTHORIZED', errorData);
            case 403:
                throw new ApiError(
                    'No tenés permisos para realizar esta acción',
                    403,
                    'FORBIDDEN',
                    errorData,
                );
            case 404:
                throw new ApiError('Recurso no encontrado', 404, 'NOT_FOUND', errorData);
            case 422: {
                // FastAPI devuelve { detail: [{ loc, msg, type }] }
                const rawDetail = errorData.detail;
                if (Array.isArray(rawDetail)) {
                    const fieldErrors: Record<string, string[]> = {};
                    for (const item of rawDetail) {
                        const field = Array.isArray(item.loc)
                            ? item.loc[item.loc.length - 1]
                            : 'general';
                        if (!fieldErrors[field]) fieldErrors[field] = [];
                        fieldErrors[field].push(item.msg ?? 'Campo inválido');
                    }
                    throw new ValidationError(fieldErrors);
                }
                throw new ValidationError({ general: ['Datos inválidos'] });
            }
            case 429:
                throw new ApiError('Demasiadas solicitudes. Esperá un momento.', 429, 'RATE_LIMITED');
            case 500:
            case 502:
            case 503:
                throw new ApiError(
                    'Error en el servidor. Intentá de nuevo más tarde.',
                    response.status,
                    'SERVER_ERROR',
                    errorData,
                );
            default:
                throw new ApiError(
                    (errorData.detail as string) ||
                        (errorData.message as string) ||
                        `Error ${response.status}`,
                    response.status,
                    undefined,
                    errorData,
                );
        }
    }

    return response.json();
}