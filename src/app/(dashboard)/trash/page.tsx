"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, RotateCcw, CheckSquare, Square, Archive, AlertTriangle, Database } from 'lucide-react';
import { useHighlightStore } from '@/stores/highlightStore';
import { api } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TrashArchive');

const TrashArchive = () => {
    const { highlights, addHighlight } = useHighlightStore();
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'trash' | 'archive'>('trash');

    const fetchNews = async () => {
        setLoading(true);
        try {
            const endpoint = viewMode === 'trash' 
                ? '/api/v1/newsroom/news/rejected' 
                : '/api/v1/newsroom/news/archived';
            const data = await api.get<any[]>(endpoint);
            setNewsItems(data);
        } catch (error) {
            logger.error(`Error fetching ${viewMode} news`, error as Error);
            toast.error(`Error al cargar ${viewMode === 'trash' ? 'la papelera' : 'el archivo'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: number) => {
        setNewsItems(prev => prev.filter(item => item.id !== id));
        try {
            // Restore always puts it back to DISCOVERED. 
            // We can just use the existing endpoint or create a new one. 
            // For now, the existing put /news/{id}/restore works for both, 
            // but let's make sure backend allows restoring ARCHIVED.
            // Backend `restore_news_item` just sets status = "DISCOVERED".
            await api.put(`/api/v1/newsroom/news/${id}/restore`);
            toast.success('Noticia restaurada a la bandeja principal');
            addHighlight('dashboard', [id]);
        } catch (error) {
            logger.error('Error restoring news item', error as Error);
            toast.error('Error al restaurar noticia');
            fetchNews();
        }
    };

    const handleDelete = async (id: number) => {
        if (viewMode === 'archive') {
            if (!window.confirm('¿Eliminar FÍSICAMENTE de la base de datos? La noticia podrá volver a ingresar si sigue en el feed RSS.')) return;
        }
        
        setNewsItems(prev => prev.filter(item => item.id !== id));
        try {
            if (viewMode === 'trash') {
                await api.delete(`/api/v1/newsroom/news/${id}`); // Soft delete (moves to ARCHIVED)
                toast.success('Noticia archivada');
            } else {
                await api.delete(`/api/v1/newsroom/news/archived/${id}`); // Physical delete
                toast.success('Noticia eliminada de la base de datos');
            }
        } catch (error) {
            logger.error('Error deleting news item', error as Error);
            toast.error('Error al procesar la eliminación');
            fetchNews();
        }
    };

    const handleBatchRestore = async () => {
        const itemsToProcess = Array.from(selectedItems);
        setSelectedItems(new Set());
        setNewsItems(prev => prev.filter(item => !selectedItems.has(item.id)));
        try {
            await api.post('/api/v1/newsroom/news/batch/restore', { ids: itemsToProcess });
            toast.success(`${itemsToProcess.length} noticias restauradas`);
            addHighlight('dashboard', itemsToProcess);
        } catch (error) {
            logger.error('Error restoring batch', error as Error);
            toast.error('Error al restaurar noticias');
            fetchNews();
        }
    };

    const handleBatchDelete = async () => {
        if (viewMode === 'archive') {
            if (!window.confirm(`¿Eliminar FÍSICAMENTE ${selectedItems.size} noticias de la base de datos? Podrán volver a ingresar en la próxima sincronización.`)) return;
        }

        const itemsToProcess = Array.from(selectedItems);
        setSelectedItems(new Set());
        setNewsItems(prev => prev.filter(item => !selectedItems.has(item.id)));
        try {
            if (viewMode === 'trash') {
                await api.post('/api/v1/newsroom/news/batch/delete', { ids: itemsToProcess });
                toast.success(`${itemsToProcess.length} noticias archivadas`);
            } else {
                await api.post('/api/v1/newsroom/news/archived/batch/delete', { ids: itemsToProcess });
                toast.success(`${itemsToProcess.length} noticias eliminadas físicamente`);
            }
        } catch (error) {
            logger.error('Error deleting batch', error as Error);
            toast.error('Error al procesar la eliminación masiva');
            fetchNews();
        }
    };

    const handleEmptyList = async () => {
        if (viewMode === 'trash') {
            if (!window.confirm('¿Estás seguro de vaciar la papelera? Las noticias se moverán al Archivo.')) return;
        } else {
            if (!window.confirm('¿Vaciar TODO el archivo permanentemente? Esto permitirá que TODAS estas noticias vuelvan a ingresar.')) return;
        }
        
        setNewsItems([]);
        setSelectedItems(new Set());
        try {
            if (viewMode === 'trash') {
                await api.delete('/api/v1/newsroom/news/rejected/all');
                toast.success('Papelera vaciada al archivo');
            } else {
                await api.delete('/api/v1/newsroom/news/archived/all');
                toast.success('Archivo vaciado físicamente');
            }
        } catch (error) {
            logger.error('Error emptying list', error as Error);
            toast.error('Error al vaciar la lista');
            fetchNews();
        }
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === newsItems.length && newsItems.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(newsItems.map(item => item.id)));
        }
    };

    const toggleSelectItem = (id: number) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    useEffect(() => {
        fetchNews();
        setSelectedItems(new Set());
    }, [viewMode]);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            {/* View Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
                    <button
                        onClick={() => setViewMode('trash')}
                        className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                            viewMode === 'trash' 
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <Trash2 size={16} />
                        Papelera
                    </button>
                    <button
                        onClick={() => setViewMode('archive')}
                        className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                            viewMode === 'archive' 
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <Archive size={16} />
                        Archivo Oculto
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    {viewMode === 'trash' ? (
                        <>
                            <Trash2 className="w-6 h-6 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Papelera</h1>
                        </>
                    ) : (
                        <>
                            <Archive className="w-6 h-6 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Archivo de Duplicados</h1>
                        </>
                    )}
                </div>
                <div className="flex gap-2">
                    {selectedItems.size > 0 && (
                        <>
                            <button
                                onClick={handleBatchRestore}
                                className="h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
                            >
                                <RotateCcw size={16} />
                                Restaurar ({selectedItems.size})
                            </button>
                            <button
                                onClick={handleBatchDelete}
                                className={`h-10 px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 font-medium ${
                                    viewMode === 'trash' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {viewMode === 'trash' ? <Archive size={16} /> : <Database size={16} />}
                                {viewMode === 'trash' ? `Archivar (${selectedItems.size})` : `Eliminar Físico (${selectedItems.size})`}
                            </button>
                        </>
                    )}
                    {newsItems.length > 0 && selectedItems.size === 0 && (
                        <button
                            onClick={handleEmptyList}
                            className={`h-10 px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 font-medium ${
                                viewMode === 'trash' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {viewMode === 'trash' ? <Archive size={16} /> : <Database size={16} />}
                            {viewMode === 'trash' ? 'Vaciar al Archivo' : 'Vaciar DB (Permitir reingreso)'}
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'archive' && newsItems.length > 0 && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">Sobre el Archivo</h3>
                        <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                            Las noticias aquí están ocultas pero evitan que el sistema ingrese duplicados. Si realizas una <strong>Eliminación Física</strong>, el sistema olvidará la noticia y podrá volver a descargarla en el próximo escaneo RSS.
                        </p>
                    </div>
                </div>
            )}

            {newsItems.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    {viewMode === 'trash' ? (
                        <Trash2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    ) : (
                        <Archive size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    )}
                    <p className="text-gray-500 dark:text-gray-400">
                        {viewMode === 'trash' ? 'La papelera está vacía.' : 'El archivo está vacío.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            {selectedItems.size === newsItems.length && newsItems.length > 0 ? (
                                                <CheckSquare size={20} className="text-indigo-600" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium w-32">Fecha</th>
                                    <th className="px-4 py-3 font-medium w-24">Fuente</th>
                                    <th className="px-4 py-3 font-medium">Título</th>
                                    <th className="px-4 py-3 font-medium w-48 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {newsItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`
                                            hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                            ${selectedItems.has(item.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                            ${highlights.trash?.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                        `}
                                    >
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleSelectItem(item.id)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                {selectedItems.has(item.id) ? (
                                                    <CheckSquare size={20} className="text-indigo-600" />
                                                ) : (
                                                    <Square size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(item.published_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                {item.source ? item.source.name : 'Fuente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                {item.title}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(item.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                    title="Restaurar al Panel"
                                                >
                                                    <RotateCcw size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className={`p-1.5 rounded-md transition-colors ${
                                                        viewMode === 'trash' 
                                                            ? 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800' 
                                                            : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    }`}
                                                    title={viewMode === 'trash' ? "Archivar" : "Eliminar físicamente (Permitir reingreso)"}
                                                >
                                                    {viewMode === 'trash' ? <Archive size={20} /> : <Database size={20} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrashArchive;
