// src/lib/api-client.ts
/**
 * Cliente HTTP centralizado para llamadas a la API
 * 
 * Características:
 * - Manejo consistente de errores
 * - Auto-inyección de tokens de autenticación
 * - Timeouts configurables
 * - Retry logic para errores de red
 */

import { 
  ApiError, 
  NetworkError, 
  ValidationError, 
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError 
} from '@/types/errors';
import { createLogger } from './logger';

const logger = createLogger('API');

// Configuración desde variables de entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '30000', 10);
const MAX_RETRIES = parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '3', 10);

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
}

/**
 * Helper para obtener token de autenticación
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Helper para manejar timeouts en fetch
 */
function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) => 
      setTimeout(() => reject(new NetworkError('Tiempo de espera agotado')), timeout)
    ),
  ]);
}

/**
 * Procesa la respuesta de la API y lanza errores tipados
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  let data: any;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const status = response.status;
    const message = data?.detail || data?.message || 'Error en la petición';
    const code = data?.code;

    logger.warn(`API Error ${status}`, { url: response.url, message, code });

    switch (status) {
      case 401:
        throw new AuthenticationError(message);
      case 403:
        throw new AuthorizationError(message);
      case 404:
        throw new NotFoundError(message);
      case 422:
        // Errores de validación de Pydantic/FastAPI
        if (Array.isArray(data?.detail)) {
          const fieldErrors: Record<string, string[]> = {};
          data.detail.forEach((err: any) => {
            const field = err.path?.join('.') || 'unknown';
            fieldErrors[field] = fieldErrors[field] || [];
            fieldErrors[field].push(err.msg);
          });
          throw new ValidationError(fieldErrors);
        }
        throw new ValidationError({ form: [message] });
      case 500:
        throw new ServerError(message);
      default:
        throw new ApiError(message, status, code, data);
    }
  }

  return data as T;
}

/**
 * Clase principal del cliente API
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Obtiene headers comunes para todas las peticiones
   */
  private getHeaders(options: RequestOptions): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Agregar token de autenticación si no se especificó skipAuth
    if (!options.skipAuth) {
      const token = getAuthToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Realiza una petición HTTP con retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { 
      timeout = REQUEST_TIMEOUT, 
      retries = MAX_RETRIES,
      skipAuth,
      ...fetchOptions 
    } = options;

    const headers = this.getHeaders({ ...options, skipAuth });
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logger.debug(`Request ${endpoint}`, { 
          method: options.method || 'GET', 
          attempt: attempt + 1,
          url 
        });

        const response = await fetchWithTimeout(url, { ...fetchOptions, headers }, timeout);
        return await handleResponse<T>(response);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // No reintentar para errores de cliente (4xx) o errores específicos
        if (error instanceof ApiError && error.status < 500) {
          throw error;
        }

        // No reintentar si no es error de red
        if (!(error instanceof NetworkError) && attempt < retries) {
          throw error;
        }

        // Espera exponencial antes de reintentar
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          logger.warn(`Reintentando en ${delay}ms...`, { attempt: attempt + 1, endpoint });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`Petición fallida después de ${retries + 1} intentos`, lastError, { endpoint });
    throw lastError || new NetworkError('No se pudo completar la petición');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Instancia singleton del cliente API
export const api = new ApiClient(API_BASE_URL);

// Exportar tipos útiles
export type { RequestOptions };
