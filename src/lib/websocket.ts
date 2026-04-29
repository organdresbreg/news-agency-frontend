// src/lib/websocket.ts

import { WsEvent, WsEventType } from "@/types/ws-events";
import { createLogger } from "@/lib/logger";

const logger = createLogger('WebSocket');

type EventCallback = (event: WsEvent) => void;

class WebSocketClient {
    private socket: WebSocket | null = null;
    private url: string;
    private listeners: Map<WsEventType, Set<EventCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    constructor(url: string) {
        this.url = url;
    }

    connect() {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            logger.info('Conexión establecida', { url: this.url });
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit(data.type, data);
            } catch (error) {
                logger.error('Error al parsear evento', error as Error, { raw: event.data });
            }
        };

        this.socket.onclose = () => {
            logger.info('Conexión cerrada. Intentando reconectar...');
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            logger.error('Error de conexión', undefined, { error });
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(type: string, payload: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, ...payload }));
        } else {
            logger.warn('Intento de envío sin conexión activa', { type });
        }
    }

    subscribe(type: WsEventType, callback: EventCallback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)?.add(callback);

        return () => {
            this.listeners.get(type)?.delete(callback);
        };
    }

    private emit(type: WsEventType, event: WsEvent) {
        this.listeners.get(type)?.forEach((callback) => callback(event));
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
        } else {
            logger.error('Máximo de intentos de reconexión alcanzado', undefined, {
                attempts: this.reconnectAttempts,
                url: this.url,
            });
        }
    }
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
if (!WS_URL) {
    throw new Error("NEXT_PUBLIC_WS_URL no está definido en .env");
}
export const wsClient = new WebSocketClient(WS_URL);