"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Trash2, Plus, Globe, Rss, Pencil,
    X, Share2, Database, Video, FileText,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const SOURCE_TYPES = [
    {
        id: 'RSS',
        name: 'RSS Feed',
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
        active: true
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

const Sources = () => {
    const [sources, setSources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<any>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', url: '' });

    const fetchSources = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/v1/newsroom/sources');
            setSources(response.data);
        } catch (error) {
            console.error('Error fetching sources:', error);
            toast.error('Error al cargar las fuentes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', url: '' });
        setSelectedType(null);
        setEditingId(null);
        setStep(1);
        setIsModalOpen(false);
    };

    const handleEdit = (source: any) => {
        setFormData({ name: source.name, url: source.config.url });
        setSelectedType(SOURCE_TYPES.find(t => t.id === source.type));
        setEditingId(source.id);
        setStep(2);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            type: selectedType.id,
            config: { url: formData.url },
            active: true
        };
        try {
            if (editingId) {
                await axios.put(`http://localhost:8000/api/v1/newsroom/sources/${editingId}`, payload);
                toast.success('Fuente actualizada correctamente');
            } else {
                await axios.post('http://localhost:8000/api/v1/newsroom/sources', payload);
                toast.success('Fuente agregada correctamente');
            }
            resetForm();
            fetchSources();
        } catch (error) {
            console.error('Error saving source:', error);
            toast.error('Error al guardar la fuente');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta fuente?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/v1/newsroom/sources/${id}`);
            toast.success('Fuente eliminada correctamente');
            fetchSources();
        } catch (error) {
            console.error('Error deleting source:', error);
            toast.error('Error al eliminar la fuente');
        }
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
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Rss className="w-6 h-6 text-indigo-600" />
                        Gestión de Fuentes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona tus fuentes de datos y flujos de ingesta.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={20} />
                    Agregar Fuente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Cargando integraciones...</p>
                    </div>
                ) : sources.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin fuentes activas</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Comienza agregando tu primera fuente de información.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-medium mt-4 hover:underline">
                            Configurar ahora
                        </button>
                    </div>
                ) : (
                    sources.map((source) => {
                        const Icon = getTypeIcon(source.type);
                        return (
                            <div
                                key={source.id}
                                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg hover:shadow-indigo-500/5 transition-all relative overflow-hidden flex flex-col justify-center"
                                style={{ minHeight: '130px' }}
                            >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(source)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(source.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
                                    {source.health_status === 'OK' && (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Online
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100/50 dark:border-gray-800/50" title={source.config.url}>
                                    {source.config.url}
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
                                {editingId ? 'Editar Integración' : 'Nueva Integración'}
                            </h2>
                            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8">
                            {step === 1 ? (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Selecciona el tipo de fuente de datos:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {SOURCE_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <button
                                                    key={type.id}
                                                    disabled={!type.active}
                                                    onClick={() => { setSelectedType(type); setStep(2); }}
                                                    className={`group p-4 text-left rounded-2xl border-2 transition-all flex items-center gap-4 relative ${!type.active
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
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedType.bgColor}`}>
                                            <selectedType.icon className={`w-6 h-6 ${selectedType.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Configurando {selectedType.name}</p>
                                            <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">
                                                Cambiar tipo
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de la fuente</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                autoFocus
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                                placeholder="Ej. Blog Tecnológico"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">URL del Recurso</label>
                                            <input
                                                type="url"
                                                value={formData.url}
                                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                                placeholder="https://pagina.com/feed.xml"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <button type="button" onClick={resetForm} className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium">
                                            Cancelar
                                        </button>
                                        <button type="submit" className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                                            {editingId ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                                            {editingId ? 'Guardar Cambios' : 'Activar Fuente'}
                                        </button>
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
