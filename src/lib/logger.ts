type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
};

class Logger {
    private level: LogLevel;
    private context?: string;

    constructor(level: LogLevel = 'info', context?: string) {
        this.level = process.env.NODE_ENV === 'production' ? 'warn' : level;
        this.context = context;
    }

    private isEnabled(level: LogLevel): boolean {
        return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
    }

    private formatMessage(message: string, data?: Record<string, unknown>) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            ...(this.context && { context: this.context }),
            message,
            ...(data && Object.keys(data).length > 0 && { data }),
        };
    }

    debug(message: string, data?: Record<string, unknown>) {
        if (this.isEnabled('debug')) {
            console.debug('[DEBUG]', this.formatMessage(message, data));
        }
    }

    info(message: string, data?: Record<string, unknown>) {
        if (this.isEnabled('info')) {
            console.info('[INFO]', this.formatMessage(message, data));
        }
    }

    warn(message: string, data?: Record<string, unknown>) {
        if (this.isEnabled('warn')) {
            console.warn('[WARN]', this.formatMessage(message, data));
        }
    }

    /**
     * Loguea un error con stack trace estructurado.
     * @param message  Descripción del error.
     * @param error    Instancia de Error (opcional). Extrae name, message y stack.
     * @param data     Contexto adicional arbitrario (opcional).
     */
    error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
        if (!this.isEnabled('error')) return;

        const errorInfo =
            error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : error !== undefined
                ? { raw: String(error) }
                : undefined;

        console.error(
            '[ERROR]',
            this.formatMessage(message, {
                ...(errorInfo && { error: errorInfo }),
                ...data,
            }),
        );
    }

    /**
     * Crea un logger hijo que hereda el nivel del padre
     * y concatena el contexto: "Parent > Child".
     */
    child(childContext: string): Logger {
        const composedContext = this.context
            ? `${this.context} > ${childContext}`
            : childContext;
        return new Logger(this.level, composedContext);
    }
}

export const logger = new Logger('debug');
export const createLogger = (context: string) => new Logger('debug', context);