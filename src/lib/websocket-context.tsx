"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { wsClient } from "@/lib/websocket";
import { WsEvent, WsEventType } from "@/types/ws-events";

interface WebSocketContextType {
    isConnected: boolean;
    subscribe: (type: WsEventType, callback: (event: WsEvent) => void) => () => void;
    send: (type: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        wsClient.connect();
        setIsConnected(true);

        return () => {
            wsClient.disconnect();
            setIsConnected(false);
        };
    }, []);

    const value: WebSocketContextType = {
        isConnected,
        subscribe: (type: WsEventType, callback: (event: WsEvent) => void) => {
            return wsClient.subscribe(type, callback);
        },
        send: (type: string, payload: any) => {
            wsClient.send(type, payload);
        },
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
}