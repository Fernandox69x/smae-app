import { useState } from 'react';
import { Sparkles, Loader2, X, Check, BrainCircuit, ListChecks } from 'lucide-react';
import { useValidations } from '../../hooks/useValidations';
import { useSkillContext } from '../../context/SkillContext';
import { config } from '../../../config';

interface AiPathModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SuggestedNode {
    name: string;
    category: string;
    description: string;
    dependencies: string[]; // Nombres de dependencias sugeridas
}

export function AiPathModal({ isOpen, onClose }: AiPathModalProps) {
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestedNode[] | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Usamos el hook de validaciones para acceder al servicio de IA (asumiendo que tiene capacidad de generar rutas)
    const { getAISuggestions } = useValidations('');
    const { refreshSkills } = useSkillContext();

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!goal.trim()) return;
        setIsGenerating(true);
        try {
            // Aquí llamaríamos al nuevo endpoint de generación de rutas
            // Por ahora simularemos la respuesta o usaremos una lógica similar a getAISuggestions
            // Nota: En la implementación final esto llamará a un servicio dedicado de PathGeneration
            const response = await fetch(`${config.API_URL}/ai/generate-path`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ goal })
            });

            if (!response.ok) throw new Error('Error al generar ruta');
            const data = await response.json();
            setSuggestions(data.nodes);
        } catch (error) {
            console.error(error);
            alert('No se pudo generar la ruta. Inténtalo de nuevo con un objetivo más específico.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = async () => {
        if (!suggestions) return;
        setIsSaving(true);
        try {
            const response = await fetch(`${config.API_URL}/skills/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ skills: suggestions })
            });

            if (!response.ok) throw new Error('Error al guardar skills');

            await refreshSkills();
            onClose();
            setSuggestions(null);
            setGoal('');
        } catch (error) {
            console.error(error);
            alert('Error al guardar la ruta generada.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                            <Sparkles size={22} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Generador de Rutas IA</h2>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Powered by Gemini Pro</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {!suggestions ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">¿Qué quieres dominar?</label>
                                <textarea
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="Ej: Quiero ser un experto en React y Next.js, o quiero aprender los fundamentos de la inversión en bolsa..."
                                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:border-indigo-500 focus:outline-none transition-all resize-none"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !goal.trim()}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-900/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Diseñando tu camino...
                                    </>
                                ) : (
                                    <>
                                        <BrainCircuit size={24} />
                                        Generar Grafo de Habilidades
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                    <ListChecks size={18} className="text-emerald-400" />
                                    Nodos Sugeridos ({suggestions.length})
                                </h3>
                                <button onClick={() => setSuggestions(null)} className="text-xs text-indigo-400 hover:underline">Cambiar objetivo</button>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {suggestions.map((node, i) => (
                                    <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-white text-sm">{node.name}</h4>
                                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-black">{node.category}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-tight">{node.description}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSaving}
                                    className="flex-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/20"
                                >
                                    {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
                                    Empezar a Aprender
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
