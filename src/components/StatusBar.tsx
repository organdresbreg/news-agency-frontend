"use client";

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';

const StatusBar = () => {
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [systemActive, setSystemActive] = useState<boolean>(true);

    useEffect(() => {
        const saved = localStorage.getItem('systemActive');
        if (saved !== null) setSystemActive(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('systemActive', JSON.stringify(systemActive));
    }, [systemActive]);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Actualizado para apuntar a la nueva ruta en el backend
                const response = await fetch('http://localhost:8000/api/v1/news/status');
                if (response.ok) {
                    setBackendStatus('online');
                } else {
                    setBackendStatus('offline');
                }
            } catch (error) {
                setBackendStatus('offline');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Backend:</span>
                    {backendStatus === 'checking' && <span className="text-yellow-600 dark:text-yellow-500">Conectando...</span>}
                    {backendStatus === 'online' && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium">
                            <Wifi size={14} /> Conectado
                        </span>
                    )}
                    {backendStatus === 'offline' && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-500 font-medium">
                            <WifiOff size={14} /> Desconectado
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className={clsx("font-medium transition-colors", systemActive ? "text-green-600 dark:text-green-500" : "text-yellow-600 dark:text-yellow-500")}>
                    {systemActive ? "Sistema Activo" : "Sistema en Pausa"}
                </span>
                <button
                    onClick={() => setSystemActive(!systemActive)}
                    className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        systemActive ? "bg-green-600" : "bg-yellow-500"
                    )}
                >
                    <span
                        className={clsx(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            systemActive ? "translate-x-6" : "translate-x-1"
                        )}
                    />
                </button>
            </div>
        </div>
    );
};

export default StatusBar;
