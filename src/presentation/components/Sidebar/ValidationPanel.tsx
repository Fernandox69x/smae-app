import { useState, useEffect } from 'react';
import { useValidations } from '../../hooks/useValidations';
import {
    CheckCircle,
    Clock,
    ArrowUp,
    Loader2,
    Zap,
    LucideIcon,
    Eye,
    Pencil,
    Award
} from 'lucide-react';

interface LevelInfoItem {
    name: string;
    label: string;
    description: string;
    icon: LucideIcon;
}

const LEVEL_INFO: LevelInfoItem[] = [
    { name: 'L0', label: 'Sin empezar', description: 'Aún no has comenzado', icon: Eye },
    { name: 'L1', label: 'El Mapa', description: 'Explica el concepto en una frase', icon: Eye },
    { name: 'L2', label: 'La Sombra', description: 'Completa con guía/tutorial', icon: Pencil },
    { name: 'L3', label: 'Prueba Fría', description: 'Hazlo sin ayuda externa', icon: Zap },
    { name: 'L4', label: 'Consolidación', description: '48h después + explica el porqué', icon: Award },
];

interface ValidationPanelProps {
    skillId: string;
    currentLevel: number;
    skillName: string;
    onLevelChange?: () => void;
}

/**
 * Panel de validación unificado con trazabilidad (Timeline)
 */
export function ValidationPanel({ skillId, currentLevel, onLevelChange }: ValidationPanelProps) {
    const {
        validations,
        cooldownStatus,
        isLoading,
        error,
        fetchValidations,
        checkCooldown,
        submitValidation,
        triggerPanic,
        analyzeEvidence,
        getAISuggestions
    } = useValidations(skillId);

    const [showForm, setShowForm] = useState(false);
    const [evidence, setEvidence] = useState('');
    const [attemptLevel, setAttemptLevel] = useState(currentLevel + 1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    useEffect(() => {
        fetchValidations();
        checkCooldown();
    }, [skillId]);

    const handleAIAnalysis = async () => {
        if (!evidence.trim()) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeEvidence(attemptLevel, LEVEL_INFO[attemptLevel].name, evidence);
            setAiAnalysis(result);
        } catch (err) {
            console.error('Error in AI analysis:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (passed: boolean) => {
        const result = await submitValidation(
            attemptLevel,
            LEVEL_INFO[attemptLevel].name,
            evidence,
            passed
        );

        if (result?.success) {
            setShowForm(false);
            setEvidence('');
            setAiAnalysis(null);
            onLevelChange?.();
            fetchValidations();
        }
    };

    const formatTimeRemaining = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14} />
                Trazabilidad de Maestría
            </h3>

            {/* Trazabilidad Vertical (Timeline) */}
            <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {LEVEL_INFO.map((level, index) => {
                    if (index === 0) return null; // Saltar L0 en la timeline visual

                    const isCompleted = index <= currentLevel;
                    const isNext = index === currentLevel + 1;
                    const Icon = level.icon;

                    // Buscar validación para este nivel
                    const levelValidation = validations.find(v => v.level === index && v.passed);

                    return (
                        <div key={index} className="relative">
                            {/* Punto de la Timeline */}
                            <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center z-10 
                                ${isCompleted ? 'bg-emerald-500 text-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                                    isNext ? 'bg-slate-700 border-2 border-emerald-500 text-emerald-400' :
                                        'bg-slate-800 border-2 border-slate-700 text-slate-600'}`}>
                                {isCompleted ? <CheckCircle size={14} /> : <Icon size={12} />}
                            </div>

                            <div className={`p-4 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' :
                                    isNext ? 'bg-slate-800 border-slate-700 shadow-lg' :
                                        'bg-slate-900/50 border-slate-800 opacity-50'
                                }`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : 'text-slate-200'}`}>
                                        {level.label}
                                    </h4>
                                    {isCompleted && levelValidation && (
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(levelValidation.attemptedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {level.description}
                                </p>

                                {/* Botón de Acción según estado */}
                                {isNext && !showForm && (
                                    <div className="mt-4 space-y-2">
                                        {index === 4 && cooldownStatus?.timeRemaining && !cooldownStatus.canAttemptL4 ? (
                                            <div className="flex items-center gap-2 text-orange-400 text-[10px] bg-orange-500/10 rounded-lg p-2">
                                                <Clock size={12} />
                                                Esperar: {formatTimeRemaining(cooldownStatus.timeRemaining)}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setAttemptLevel(index);
                                                    setShowForm(true);
                                                }}
                                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                                            >
                                                Validar Ahora
                                                <ArrowUp size={14} />
                                            </button>
                                        )}

                                        {currentLevel === 0 && index === 1 && (
                                            <button
                                                onClick={async () => {
                                                    setIsAnalyzing(true);
                                                    const suggestions = await getAISuggestions();
                                                    if (suggestions) {
                                                        setAiAnalysis({
                                                            passed: true,
                                                            score: 10,
                                                            feedback: `Plan generado (${suggestions.estimatedTime}):`,
                                                            suggestions: suggestions.steps.map((s: any) => `${s.action}: ${s.details}`)
                                                        });
                                                        setShowForm(true);
                                                        setAttemptLevel(1);
                                                    }
                                                    setIsAnalyzing(false);
                                                }}
                                                className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                                            >
                                                {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill="currentColor" />}
                                                Generar Plan IA
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Formulario Modal-like den tro del sidebar */}
            {showForm && (
                <div className="fixed inset-0 lg:absolute lg:inset-x-0 bottom-0 top-0 bg-slate-950/95 z-40 p-6 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-5">
                    <div className="bg-slate-900 rounded-2xl border border-emerald-500/30 p-5 shadow-2xl">
                        <h4 className="text-emerald-400 font-bold mb-1">
                            Validación de Maestría
                        </h4>
                        <p className="text-xs text-slate-400 mb-4">
                            {LEVEL_INFO[attemptLevel]?.label}: {LEVEL_INFO[attemptLevel]?.description}
                        </p>

                        <div className="space-y-3">
                            <textarea
                                value={evidence}
                                onChange={(e) => setEvidence(e.target.value)}
                                placeholder="Describe tu evidencia aquí..."
                                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />

                            {evidence.length > 20 && !aiAnalysis && (
                                <button
                                    onClick={handleAIAnalysis}
                                    disabled={isAnalyzing}
                                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30 flex items-center justify-center gap-2"
                                >
                                    {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill="currentColor" />}
                                    Analizar Honestidad con IA
                                </button>
                            )}

                            {aiAnalysis && (
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[11px] text-indigo-300">
                                    <p className="font-bold mb-1 italic">Veredicto IA: {aiAnalysis.score}/10</p>
                                    <p className="leading-tight opacity-80">{aiAnalysis.feedback}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={isLoading || !evidence.trim()}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    Pasé
                                </button>
                                <button
                                    onClick={() => handleSubmit(false)}
                                    className="flex-1 py-3 bg-red-600/20 border border-red-500/40 text-red-500 rounded-xl font-bold"
                                >
                                    Fallé
                                </button>
                            </div>

                            <button
                                onClick={() => { setShowForm(false); setAiAnalysis(null); }}
                                className="w-full py-2 text-slate-500 text-xs hover:text-slate-300"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Panic Button */}
            <div className="mt-8 pt-6 border-t border-slate-800/50">
                {currentLevel > 0 && !showForm && (
                    <button
                        onClick={async () => {
                            if (confirm('¿Honestidad Brutal? Retrocederás un nivel.')) {
                                const lastPassed = validations.find(v => v.passed);
                                if (lastPassed) {
                                    const result = await triggerPanic(lastPassed.id);
                                    if (result.success) onLevelChange?.();
                                }
                            }
                        }}
                        className="w-full py-2 text-red-500/50 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all"
                    >
                        Botón de Pánico
                    </button>
                )}
                {error && <p className="text-red-400 text-[10px] mt-2 text-center">{error}</p>}
            </div>
        </div>
    );
}
