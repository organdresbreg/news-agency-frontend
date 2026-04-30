"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import {
    Trash2, Plus, Globe, Rss, Pencil,
    X, Share2, Database, Video, FileText,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const SOURCE_TYPES = [
    {
        id: 'RSS',
        name: 'RSS',
        description: 'Suscríbete a feeds de noticias estándar',
        icon: Rss,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        active: true
    },
    {
        id: 'WEBSITE',
        name: 'Sitio Web',
        description: 'Extrae contenido de páginas HTML',
        icon: Globe,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        active: false
    },
    {
        id: 'SOCIAL',
        name: 'Redes Sociales',
        description: 'Twitter, LinkedIn (Próximamente)',
        icon: Share2,
        color: 'text-sky-500',
        bgColor: 'bg-sky-50 dark:bg-sky-950/20',
        active: false
    },
    {
        id: 'API',
        name: 'API Datos',
        description: 'Fuentes JSON/REST personalizadas',
        icon: Database,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        active: false
    },
    {
        id: 'VIDEO',
        name: 'Video/Audio',
        description: 'YouTube, Transcripciones (Próximamente)',
        icon: Video,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        active: false
    },
    {
        id: 'DOCUMENT',
        name: 'Documentos',
        description: 'PDFs, DOCX, Google Docs (Próximamente)',
        icon: FileText,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
        active: false
    },
];

const SourceSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse flex flex-col justify-center h-[130px]">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="flex justify-between items-center mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="h-8 bg-gray-100 dark:bg-gray-900 rounded w-full"></div>
    </div>
);

const Sources = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<any>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', url: '' });
    const [previewData, setPreviewData] = useState<any>(null);
    const [testingSource, setTestingSource] = useState(false);
    const [testError, setTestError] = useState<string | null>(null);

    // React Query for fetching
    const { data: sources = [], isLoading } = useQuery({
        queryKey: ['sources'],
        queryFn: () => api.get<any[]>('/api/v1/sources'),
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    // Mutations
    const saveMutation = useMutation({
        mutationFn: (payload: any) => {
            if (editingId) {
                return api.put(`/api/v1/sources/${editingId}`, payload);
            }
            return api.post('/api/v1/sources', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
            toast.success(editingId ? 'Fuente actualizada correctamente' : 'Fuente agregada correctamente');
            resetForm();
        },
        onError: (error) => {
            logger.error('Error saving source:', error as Error);
            toast.error('Error al guardar la fuente');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/sources/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
            toast.success('Fuente eliminada correctamente');
        },
        onError: (error) => {
            logger.error('Error deleting source:', error as Error);
            toast.error('Error al eliminar la fuente');
        }
    });

    const resetForm = () => {
        setFormData({ name: '', url: '' });
        setSelectedType(null);
        setEditingId(null);
        setStep(1);
        setIsModalOpen(false);
        setPreviewData(null);
        setTestError(null);
    };

    const handleEdit = (source: any) => {
        setFormData({ name: source.name, url: source.url });
        setSelectedType(SOURCE_TYPES.find(t => t.id === source.type));
        setEditingId(source.id);
        setPreviewData({ suggested_frequency_minutes: source.fetch_frequency_minutes });
        setTestError(null);
        setStep(2);
        setIsModalOpen(true);
    };

    const handleTestSource = async () => {
        if (!formData.url) {
            toast.error('Por favor ingresa una URL');
            return;
        }
        setTestingSource(true);
        setTestError(null);
        try {
            const data = await api.post<any>('/api/v1/sources/test', { url: formData.url });
            if (data.success) {
                toast.success(data.message);
                setPreviewData(data);
            } else {
                setTestError(data.message || 'La fuente no respondió correctamente.');
            }
        } catch (error: any) {
            logger.error('Error testing source:', error as Error);
            const errorMsg = error?.response?.data?.detail || error?.message || 'Error de red inesperado';
            setTestError(errorMsg);
        } finally {
            setTestingSource(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editingId && !previewData) {
            handleTestSource();
            return;
        }

        const payload = {
            name: formData.name,
            type: selectedType.id,
            url: formData.url,
            active: true,
            fetch_frequency_minutes: previewData?.suggested_frequency_minutes || 60,
            tier: 3,
            trust_score: 50.0
        };

        saveMutation.mutate(payload);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta fuente?')) return;
        deleteMutation.mutate(id);
    };

    const getTypeIcon = (typeId: string) => {
        const type = SOURCE_TYPES.find(t => t.id === typeId);
        return type ? type.icon : Globe;
    };

    const getTypeColor = (typeId: string) => {
        const type = SOURCE_TYPES.find(t => t.id === typeId);
        return type ? type.color : 'text-gray-500';
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Rss className="w-6 h-6 text-indigo-600" />
                        Gestión de Fuentes
                    </h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    title="Agregar Fuente"
                    className="flex items-center justify-center w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.05] active:scale-[0.95] animate-in fade-in slide-in-from-right-4 duration-500 cursor-pointer"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SourceSkeleton key={i} />)
                ) : sources.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-500">
                        <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin fuentes activas</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Comienza agregando una fuente de información.</p>
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md shadow-indigo-500/10 transition-all active:scale-95 cursor-pointer"
                        >
                            Agregar ahora
                        </button>
                    </div>
                ) : (
                    sources.map((source: any, idx: number) => {
                        const Icon = getTypeIcon(source.type);
                        return (
                            <div
                                key={source.id}
                                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg hover:shadow-indigo-500/5 transition-all relative overflow-hidden flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
                                style={{ 
                                    minHeight: '130px',
                                    animationDelay: `${idx * 50}ms`
                                }}
                            >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(source)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(source.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate pr-14 mb-3" title={source.name}>
                                    {source.name}
                                </h3>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Icon className={`w-4 h-4 ${getTypeColor(source.type)}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                            {source.type}
                                        </span>
                                    </div>
                                    {source.health_status === 'HEALTHY' && (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Online
                                        </span>
                                    )}
                                    {source.health_status === 'DEGRADED' && (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-500" title={`Errores consecutivos: ${source.consecutive_errors}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                            Inestable
                                        </span>
                                    )}
                                    {['OFFLINE', 'BANNED'].includes(source.health_status) && (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-red-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            {source.health_status}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100/50 dark:border-gray-800/50" title={source.url}>
                                    {source.url}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Editar Fuente' : 'Nueva Fuente'}
                            </h2>
                            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            {step === 1 ? (
                                <div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {SOURCE_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <button
                                                    key={type.id}
                                                    disabled={!type.active}
                                                    onClick={() => { setSelectedType(type); setStep(2); }}
                                                    className={`group p-4 text-left rounded-2xl border-2 transition-all flex items-center gap-4 relative cursor-pointer ${!type.active
                                                        ? 'opacity-40 grayscale cursor-not-allowed border-gray-100 dark:border-gray-700'
                                                        : 'border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg bg-white dark:bg-gray-800'
                                                    }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${type.bgColor}`}>
                                                        <Icon className={`w-6 h-6 ${type.color}`} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white">{type.name}</h3>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedType.bgColor}`}>
                                            <selectedType.icon className={`w-5 h-5 ${selectedType.color}`} />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <p className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">{selectedType.name}</p>
                                            <button type="button" onClick={() => { setStep(1); setTestError(null); }} className="text-sm text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer">
                                                Cambiar tipo
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                autoFocus
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">URL</label>
                                            <input
                                                type="url"
                                                value={formData.url}
                                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        
                                        {testError && (
                                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl animate-in slide-in-from-top-2">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Error de conexión</h4>
                                                        <p className="text-xs text-red-700 dark:text-red-500 mt-1 leading-relaxed">
                                                            {testError}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {previewData && previewData.recent_titles && (
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl animate-in slide-in-from-top-2">
                                                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 size={16} />
                                                    Vista Previa Exitosa
                                                </h4>
                                                <ul className="list-disc list-inside text-sm text-emerald-700 dark:text-emerald-500 space-y-1 mb-3">
                                                    {previewData.recent_titles.map((title: string, i: number) => (
                                                        <li key={i} className="truncate">{title}</li>
                                                    ))}
                                                </ul>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">
                                                    Sugerencia de escaneo: Cada {previewData.suggested_frequency_minutes} minutos.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <button type="button" onClick={resetForm} className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium cursor-pointer">
                                            Cancelar
                                        </button>
                                        {!editingId && !previewData ? (
                                            <button type="button" onClick={handleTestSource} disabled={testingSource} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer">
                                                {testingSource ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : null}
                                                Conectar
                                            </button>
                                        ) : (
                                             <button 
                                                type="submit" 
                                                disabled={saveMutation.isPending}
                                                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                                            >
                                                {saveMutation.isPending && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                                                {editingId ? 'Guardar' : 'Activar'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sources;
