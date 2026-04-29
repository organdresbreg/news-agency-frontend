import { handleResponse } from '@/types/errors';
import { NetworkError } from '@/types/errors';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ApiClient');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Devuelve el header Authorization si hay un token en localStorage.
 * Exportado para usarse en casos donde se necesita fetch nativo (ej: SSE streams).
 */
export function getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private getAuthHeaders(): HeadersInit {
        return getAuthHeaders();
    }

    private async request<T>(
        endpoint: string,
        init: RequestInit = {},
    ): Promise<T> {
        const method = (init.method ?? 'GET').toUpperCase();
        const url = `${this.baseURL}${endpoint}`;
        const start = performance.now();

        logger.debug(`→ ${method} ${endpoint}`);

        try {
            const response = await fetch(url, {
                ...init,
                headers: {
                    ...this.getAuthHeaders(),
                    ...init.headers,
                },
            });

            const elapsed = Math.round(performance.now() - start);

            if (!response.ok) {
                logger.warn(`← ${method} ${endpoint} ${response.status}`, { elapsed: `${elapsed}ms` });
            } else {
                logger.debug(`← ${method} ${endpoint} ${response.status}`, { elapsed: `${elapsed}ms` });
            }

            return handleResponse<T>(response);
        } catch (error) {
            const elapsed = Math.round(performance.now() - start);
            // Re-lanzar errores tipados que vienen de handleResponse
            if (error instanceof Error && ['ApiError', 'ValidationError', 'NetworkError'].includes(error.name)) {
                throw error;
            }
            // Errores de red puros (sin conexión, CORS, timeout del browser, etc.)
            const networkErr = new NetworkError(
                error instanceof Error ? error.message : 'Network error',
            );
            logger.error(`✗ ${method} ${endpoint}`, networkErr, { elapsed: `${elapsed}ms` });
            throw networkErr;
        }
    }

    get<T>(endpoint: string) {
        return this.request<T>(endpoint);
    }

    post<T>(endpoint: string, data?: unknown) {
        return this.request<T>(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    put<T>(endpoint: string, data?: unknown) {
        return this.request<T>(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    patch<T>(endpoint: string, data?: unknown) {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    delete<T>(endpoint: string, data?: unknown) {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            headers: data ? { 'Content-Type': 'application/json' } : {},
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }
}

export const api = new ApiClient(API_BASE_URL);