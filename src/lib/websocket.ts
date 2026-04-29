// src/lib/websocket.ts

import { WsEvent, WsEventType } from "@/types/ws-events";
import { createLogger } from "./logger";
import { WebSocketError } from "@/types/errors";

const logger = createLogger('WebSocket');

type EventCallback = (event: WsEvent) => void;

class WebSocketClient {
    private socket: WebSocket | null = null;
    private url: string;
    private listeners: Map<WsEventType, Set<EventCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnected = false;

    constructor(url: string) {
        this.url = url;
    }

    connect() {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        logger.info('Iniciando conexión WebSocket', { url: this.url });
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            logger.info('Conexión WebSocket establecida');
            this.isConnected = true;
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                logger.debug('Mensaje recibido', { type: data.type });
                this.emit(data.type, data);
            } catch (error) {
                logger.error('Error al parsear evento WebSocket', error as Error, { 
                    rawData: event.data 
                });
            }
        };

        this.socket.onclose = (event) => {
            this.isConnected = false;
            logger.warn('Conexión WebSocket cerrada', { 
                code: event.code, 
                reason: event.reason,
                wasClean: event.wasClean 
            });
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            logger.error('Error de conexión WebSocket', error as Error);
        };
    }

    disconnect() {
        if (this.socket) {
            logger.info('Cerrando conexión WebSocket manualmente');
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
    }

    send(type: string, payload: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            logger.debug('Enviando mensaje', { type });
            this.socket.send(JSON.stringify({ type, ...payload }));
        } else {
            logger.warn('Intento de envío sin conexión activa', { type });
        }
    }

    subscribe(type: WsEventType, callback: EventCallback) {
        logger.debug('Suscripción a evento', { type });
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)?.add(callback);

        return () => {
            this.listeners.get(type)?.delete(callback);
            logger.debug('Cancelación de suscripción', { type });
        };
    }

    private emit(type: WsEventType, event: WsEvent) {
        const listenerCount = this.listeners.get(type)?.size || 0;
        logger.debug('Emitiendo evento', { type, listenerCount });
        this.listeners.get(type)?.forEach((callback) => callback(event));
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            logger.info(`Reintentando conexión en ${delay}ms`, { 
                attempt: this.reconnectAttempts, 
                maxAttempts: this.maxReconnectAttempts 
            });
            setTimeout(() => this.connect(), delay);
        } else {
            logger.error('Máximo de intentos de reconexión alcanzado', { 
                attempts: this.reconnectAttempts 
            });
        }
    }

    /**
     * Verifica si hay conexión activa
     */
    isConnectionActive(): boolean {
        return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
    }
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
if (!WS_URL) {
    // En lugar de lanzar error, logueamos y usamos un valor por defecto
    logger.warn('NEXT_PUBLIC_WS_URL no está definido en .env, usando valor por defecto');
}
export const wsClient = new WebSocketClient(WS_URL || 'ws://localhost:8000/ws');