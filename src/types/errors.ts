// src/types/errors.ts
/**
 * Sistema de errores tipados para la aplicación
 */

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Error de conexión. Verificá tu internet e intentá de nuevo.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  public fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    super('Errores de validación');
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'No autorizado. Por favor iniciá sesión nuevamente.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'No tenés permisos para realizar esta acción.') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Recurso no encontrado.') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message = 'Error en el servidor. Intentá de nuevo más tarde.') {
    super(message, 500, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

export class WebSocketError extends Error {
  constructor(message = 'Error en la conexión WebSocket.') {
    super(message);
    this.name = 'WebSocketError';
  }
}

/**
 * Helper para verificar si un error es de red
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError || 
    (error instanceof TypeError && error.message.includes('fetch'));
}

/**
 * Helper para verificar si un error es de API
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Helper para obtener mensaje de error amigable
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Ocurrió un error inesperado'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}
