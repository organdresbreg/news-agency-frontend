"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, RotateCcw, CheckSquare, Square } from 'lucide-react';
import { useHighlightStore } from '@/stores/highlightStore';

const Trash = () => {
    const { highlights, addHighlight } = useHighlightStore();
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

    const fetchRejectedNews = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/newsroom/news/rejected');
            if (response.ok) {
                const data = await response.json();
                setNewsItems(data);
            }
        } catch (error) {
            console.error('Error fetching rejected news:', error);
            toast.error('Error al cargar la papelera');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: number) => {
        setNewsItems(prev => prev.filter(item => item.id !== id));
        try {
            const response = await fetch(`http://localhost:8000/api/v1/newsroom/news/${id}/restore`, {
                method: 'PUT'
            });
            if (response.ok) {
                toast.success('Noticia restaurada');
                addHighlight('dashboard', [id]);
            } else {
                throw new Error('Failed to restore');
            }
        } catch (error) {
            toast.error('Error al restaurar noticia');
            fetchRejectedNews();
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar esta noticia permanentemente?')) return;
        setNewsItems(prev => prev.filter(item => item.id !== id));
        try {
            const response = await fetch(`http://localhost:8000/api/v1/newsroom/news/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success('Noticia eliminada permanentemente');
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast.error('Error al eliminar noticia');
            fetchRejectedNews();
        }
    };

    const handleBatchRestore = async () => {
        const itemsToProcess = Array.from(selectedItems);
        setSelectedItems(new Set());
        setNewsItems(prev => prev.filter(item => !selectedItems.has(item.id)));
        try {
            const response = await fetch('http://localhost:8000/api/v1/newsroom/news/batch/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: itemsToProcess })
            });
            if (response.ok) {
                toast.success(`${itemsToProcess.length} noticias restauradas`);
                addHighlight('dashboard', itemsToProcess);
            } else {
                throw new Error('Failed to restore batch');
            }
        } catch (error) {
            toast.error('Error al restaurar noticias');
            fetchRejectedNews();
        }
    };

    const handleBatchDelete = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar ${selectedItems.size} noticias permanentemente?`)) return;
        const itemsToProcess = Array.from(selectedItems);
        setSelectedItems(new Set());
        setNewsItems(prev => prev.filter(item => !selectedItems.has(item.id)));
        try {
            const response = await fetch('http://localhost:8000/api/v1/newsroom/news/batch/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: itemsToProcess })
            });
            if (response.ok) {
                toast.success(`${itemsToProcess.length} noticias eliminadas`);
            } else {
                throw new Error('Failed to delete batch');
            }
        } catch (error) {
            toast.error('Error al eliminar noticias');
            fetchRejectedNews();
        }
    };

    const handleEmptyTrash = async () => {
        if (!window.confirm('¿Estás seguro de vaciar la papelera? Esta acción no se puede deshacer.')) return;
        const allIds = newsItems.map(item => item.id);
        setNewsItems([]);
        setSelectedItems(new Set());
        try {
            const response = await fetch('http://localhost:8000/api/v1/newsroom/news/rejected/all', {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success('Papelera vaciada');
            } else {
                throw new Error('Failed to empty trash');
            }
        } catch (error) {
            toast.error('Error al vaciar la papelera');
            fetchRejectedNews();
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
        fetchRejectedNews();
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Trash2 className="w-6 h-6 text-indigo-600" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Papelera</h1>
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
                                className="h-10 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
                            >
                                <Trash2 size={16} />
                                Eliminar ({selectedItems.size})
                            </button>
                        </>
                    )}
                    {newsItems.length > 0 && selectedItems.size === 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="h-10 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
                        >
                            <Trash2 size={16} />
                            Vaciar Papelera
                        </button>
                    )}
                </div>
            </div>

            {newsItems.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Trash2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">La papelera está vacía.</p>
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
                                            ${highlights.trash.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
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
                                                    title="Restaurar"
                                                >
                                                    <RotateCcw size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Eliminar permanentemente"
                                                >
                                                    <Trash2 size={20} />
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

export default Trash;
