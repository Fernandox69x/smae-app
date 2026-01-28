import { useState, useEffect } from 'react';
import { useValidations } from '../../hooks/useValidations';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    ArrowUp,
    Loader2,
    Eye,
    Pencil,
    Zap,
    Award
} from 'lucide-react';

const LEVEL_INFO = [
    { name: 'L0', label: 'Sin empezar', description: 'Aún no has comenzado' },
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
 * Panel de validación para sistema anti-autoengaño
 */
export function ValidationPanel({ skillId, currentLevel, skillName, onLevelChange }: ValidationPanelProps) {
    const {
        validations,
        cooldownStatus,
        isLoading,
        error,
        fetchValidations,
        checkCooldown,
        submitValidation,
        triggerPanic
    } = useValidations(skillId);

    const [showForm, setShowForm] = useState(false);
    const [evidence, setEvidence] = useState('');
    const [attemptLevel, setAttemptLevel] = useState(currentLevel + 1);

    useEffect(() => {
        fetchValidations();
        checkCooldown();
    }, [fetchValidations, checkCooldown]);

    // Calcular siguiente nivel disponible
    const nextLevel = Math.min(currentLevel + 1, 4);
    const canAttempt = nextLevel <= 4 && (nextLevel < 4 || cooldownStatus?.canAttemptL4);

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
            onLevelChange?.();
        }
    };

    const formatTimeRemaining = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="space-y-4">
            {/* Estado Actual */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                    Sistema Anti-Autoengaño
                </h3>

                {/* Indicador de nivel actual */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map(level => (
                            <div
                                key={level}
                                className={`w-3 h-3 rounded-full ${level <= currentLevel
                                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                        : level === currentLevel + 1
                                            ? 'bg-emerald-400/30 animate-pulse'
                                            : 'bg-slate-600'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-white font-bold">
                        {LEVEL_INFO[currentLevel]?.label || 'Sin empezar'}
                    </span>
                </div>

                {/* Siguiente nivel */}
                {currentLevel < 4 && (
                    <div className="text-sm text-slate-400 mb-3">
                        <span className="text-emerald-400">Siguiente: </span>
                        {LEVEL_INFO[nextLevel]?.label} - {LEVEL_INFO[nextLevel]?.description}
                    </div>
                )}

                {/* Cooldown para L4 */}
                {nextLevel === 4 && !cooldownStatus?.canAttemptL4 && cooldownStatus?.timeRemaining && (
                    <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-500/10 rounded-lg p-3 mb-3">
                        <Clock size={16} />
                        Cooldown activo: {formatTimeRemaining(cooldownStatus.timeRemaining)}
                    </div>
                )}
            </div>

            {/* Botón para intentar validación */}
            {!showForm && currentLevel < 4 && (
                <button
                    onClick={() => {
                        setAttemptLevel(nextLevel);
                        setShowForm(true);
                    }}
                    disabled={!canAttempt || isLoading}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${canAttempt && !isLoading
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    <ArrowUp size={18} />
                    Intentar {LEVEL_INFO[nextLevel]?.label}
                </button>
            )}

            {/* Formulario de validación */}
            {showForm && (
                <div className="bg-slate-800 rounded-lg p-4 border border-emerald-500/30">
                    <h4 className="text-emerald-400 font-semibold mb-3">
                        Validación: {LEVEL_INFO[attemptLevel]?.label}
                    </h4>

                    <p className="text-slate-400 text-sm mb-4">
                        {LEVEL_INFO[attemptLevel]?.description}
                    </p>

                    <textarea
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                        placeholder={
                            attemptLevel === 1
                                ? "Explica el concepto en una sola frase simple..."
                                : attemptLevel === 2
                                    ? "¿Qué guía/tutorial seguiste? ¿Cómo te fue?"
                                    : attemptLevel === 3
                                        ? "Describe cómo lo lograste sin ayuda..."
                                        : "Explica el PORQUÉ de cada paso..."
                        }
                        className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none focus:border-emerald-500 focus:outline-none"
                    />

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => handleSubmit(true)}
                            disabled={isLoading || !evidence.trim()}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Pasé
                        </button>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={isLoading}
                            className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                            <XCircle size={16} />
                            Fallé
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setShowForm(false);
                            setEvidence('');
                        }}
                        className="w-full mt-2 py-2 text-slate-500 hover:text-slate-300 text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {/* Historial de validaciones */}
            {validations.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Historial
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {validations.slice(0, 5).map(v => (
                            <div
                                key={v.id}
                                className={`flex items-center gap-2 text-xs p-2 rounded ${v.passed
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-red-500/10 text-red-400'
                                    }`}
                            >
                                {v.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                <span>L{v.level}</span>
                                <span className="text-slate-500">
                                    {new Date(v.attemptedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Maestría alcanzada */}
            {currentLevel >= 4 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                    <Award className="mx-auto text-amber-400 mb-2" size={32} />
                    <p className="text-amber-400 font-bold">¡Maestría Alcanzada!</p>
                    <p className="text-slate-400 text-sm mt-1">
                        Has consolidado este conocimiento
                    </p>
                </div>
            )}
        </div>
    );
}
