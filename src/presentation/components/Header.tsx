import { AlertTriangle, Plus } from 'lucide-react';
import { useSkills } from '../hooks/useSkills';

interface HeaderProps {
    onNewSkillClick: () => void;
}

/**
 * Componente Header
 * Muestra el título, indicador de WIP y botón para crear skills
 */
export function Header({ onNewSkillClick }: HeaderProps) {
    const { currentWIP, maxWIP, isWIPLimitReached, error } = useSkills();

    return (
        <header className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center z-20">

            <div className="flex items-center gap-4">
                {error && (
                    <span className="text-red-400 text-xs">{error}</span>
                )}

                {/* Botón Nueva Skill */}
                <button
                    onClick={onNewSkillClick}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus size={16} />
                    Nueva Skill
                </button>

                {/* WIP INDICATOR */}
                <div
                    className={`flex flex-col items-end px-4 py-2 rounded-lg border ${isWIPLimitReached
                        ? 'bg-red-900/20 border-red-500/50'
                        : 'bg-slate-800 border-slate-700'
                        }`}
                >
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Carga Cognitiva (WIP)
                    </span>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-xl font-mono font-bold ${isWIPLimitReached ? 'text-red-400' : 'text-emerald-400'
                                }`}
                        >
                            {currentWIP} / {maxWIP}
                        </span>
                        {isWIPLimitReached && (
                            <AlertTriangle size={16} className="text-red-400 animate-pulse" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
