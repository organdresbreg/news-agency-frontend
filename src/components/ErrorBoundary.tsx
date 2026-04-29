'use client';

import { logger } from '@/lib/logger';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('ErrorBoundary caught an error', error, { errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg">
                    <h2>Algo salió mal</h2>
                    <button onClick={() => window.location.reload()}>Recargar</button>
                </div>
            );
        }
        return this.props.children;
    }
}