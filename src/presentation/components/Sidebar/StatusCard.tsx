import { Clock, AlertTriangle } from 'lucide-react';
import { useSelectedSkill } from '../../hooks/useSkills';

interface StatusCardProps {
    onDebugFastForward?: () => void;
}

/**
 * Tarjeta de estado actual de la skill
 */
export function StatusCard({ onDebugFastForward }: StatusCardProps) {
    const { selectedSkill, levelInfo, requirementsInfo, cooldownInfo } = useSelectedSkill();

    if (!selectedSkill || !levelInfo) return null;

    return (
        <div className="space-y-4 mb-8">
            {/* Estado Actual */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-2">Estado Actual</div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                    {levelInfo.label}
                </div>
                <p className="text-sm text-slate-400 mt-1 italic border-l-2 border-slate-700 pl-3">
                    "{levelInfo.desc}"
                </p>
            </div>

            {/* Requirements Warning */}
            {!requirementsInfo.isUnlocked && (
                <div className="flex items-start gap-3 p-3 bg-red-900/10 border border-red-900/50 rounded-lg">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <div className="text-xs text-red-300">
                        <strong>Bloqueo de Dependencia:</strong>
                        <br />
                        Las habilidades padre deben estar en <u>Nivel 4 (Consolidación)</u> mínimo.
                    </div>
                </div>
            )}

            {/* L4 Cooldown Warning */}
            {cooldownInfo.isActive && (
                <div className="p-3 bg-blue-900/10 border border-blue-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-400 text-xs font-bold uppercase flex items-center gap-2">
                            <Clock size={14} /> Espera Cognitiva
                        </span>
                        {onDebugFastForward && (
                            <button
                                onClick={onDebugFastForward}
                                className="text-[10px] bg-slate-800 px-2 py-1 rounded hover:bg-slate-700"
                            >
                                Debug: Adelantar 48h
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        El cerebro necesita 48 horas para pasar de L3 a L4 (Consolidación).
                        <br />
                        <span className="text-slate-500 mt-1 block">
                            Última práctica:{' '}
                            {selectedSkill.lastPracticed
                                ? new Date(selectedSkill.lastPracticed).toLocaleString()
                                : 'N/A'}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}
