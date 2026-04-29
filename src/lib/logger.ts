// src/lib/logger.ts
/**
 * Sistema de logging estructurado para la aplicación
 * 
 * Características:
 * - Niveles de log configurables (debug, info, warn, error)
 * - Logs estructurados con timestamp y contexto
 * - Control por ambiente (dev/production)
 * - Soporte para datos adicionales en cada log
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private level: LogLevel;
  private context?: string;
  private isProduction: boolean;

  constructor(level: LogLevel = 'debug', context?: string) {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // En producción, solo mostramos warnings y errores por defecto
    const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
    this.level = envLogLevel || (this.isProduction ? 'warn' : 'debug');
  }

  private getLogLevelValue(level: LogLevel): number {
    const values: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return values[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLogLevelValue(level) >= this.getLogLevelValue(this.level);
  }

  private formatEntry(message: string, data?: any, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: this.isProduction ? 'info' : (data ? 'debug' : 'info'),
      message,
    };

    if (this.context) {
      entry.context = this.context;
    }

    if (data !== undefined) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry, consoleMethod: 'log' | 'info' | 'warn' | 'error') {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const prefix = this.context ? `[${this.context}]` : '';
    const levelTag = `[${entry.level.toUpperCase()}]`;
    
    if (this.isProduction) {
      // En producción, formato más compacto
      console[consoleMethod](`${levelTag}${prefix}`, entry.message, entry.data || '');
    } else {
      // En desarrollo, formato detallado con colores
      const colorCodes: Record<LogLevel, string> = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      
      console[consoleMethod](
        `${colorCodes[entry.level]}${levelTag}${reset}${prefix}`,
        entry.message,
        entry.data || '',
        entry.error ? entry.error : ''
      );
    }
  }

  debug(message: string, data?: any) {
    const entry = this.formatEntry(message, data);
    this.output(entry, 'log');
  }

  info(message: string, data?: any) {
    const entry = this.formatEntry(message, data);
    this.output(entry, 'info');
  }

  warn(message: string, data?: any) {
    const entry = this.formatEntry(message, data);
    this.output(entry, 'warn');
  }

  error(message: string, error?: Error | unknown, data?: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    const entry = this.formatEntry(message, data, err);
    this.output(entry, 'error');
  }

  /**
   * Crea un logger hijo con contexto adicional
   */
  child(context: string): Logger {
    const newContext = this.context ? `${this.context}:${context}` : context;
    return new Logger(this.level, newContext);
  }
}

// Logger global con nivel configurable por variable de entorno
const DEFAULT_LOG_LEVEL: LogLevel = 
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

export const logger = new Logger(DEFAULT_LOG_LEVEL);

/**
 * Factory para crear loggers con contexto específico
 * @param context - Contexto del logger (ej: 'WebSocket', 'API', 'Auth')
 */
export const createLogger = (context: string): Logger => {
  return new Logger(DEFAULT_LOG_LEVEL, context);
};

/**
 * Hook para usar logger en componentes React (solo para debugging)
 * Nota: Para uso en componentes, preferir createLogger fuera del componente
 */
export const useLogger = (context: string) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loggerInstance = new Logger(DEFAULT_LOG_LEVEL, context);
  return loggerInstance;
};

export type { Logger, LogLevel };
