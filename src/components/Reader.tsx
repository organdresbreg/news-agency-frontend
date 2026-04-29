"use client";

import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderProps {
    item: any;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
}

const Reader = ({ item, onClose, onNext, onPrev, hasNext, hasPrev }: ReaderProps) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 relative rounded-t-2xl">
                    <div className="pr-20"> {/* Space for top-right actions */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                {item.source?.name || 'Fuente'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.published_date).toLocaleDateString()}
                            </span>
                            {item.language && item.language !== 'es' && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                                        {item.language}
                                    </span>
                                </>
                            )}
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            {item.title_es || item.title}
                        </h2>
                    </div>

                    {/* Top Right Actions */}
                    <div className="absolute top-5 right-6 flex items-center gap-2">
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            title="Ver Original"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            title="Cerrar"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Arrows (Positioned at the border line) */}
                    {hasPrev && (
                        <button
                            onClick={onPrev}
                            className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 z-20 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-full text-indigo-600 dark:text-indigo-400 hover:scale-110 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center group"
                            title="Anterior"
                        >
                            <ChevronLeft size={18} className="group-active:-translate-x-0.5 transition-transform" />
                        </button>
                    )}
                    {hasNext && (
                        <button
                            onClick={onNext}
                            className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 z-20 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-full text-indigo-600 dark:text-indigo-400 hover:scale-110 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center group"
                            title="Siguiente"
                        >
                            <ChevronRight size={18} className="group-active:translate-x-0.5 transition-transform" />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-10 rounded-b-2xl">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg whitespace-pre-wrap font-serif">
                            {item.content_es || item.content_snippet || "No hay contenido disponible para esta noticia."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reader;
