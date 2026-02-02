import { AlertTriangle, Plus, Sparkles } from 'lucide-react';
import { useSkills } from '../hooks/useSkills';

interface HeaderProps {
    onNewSkillClick: () => void;
    onAiPathClick?: () => void;
}

/**
 * Componente Header Unificado
 */
export function Header({ onNewSkillClick, onAiPathClick }: HeaderProps) {
    const { currentWIP, maxWIP, isWIPLimitReached, error } = useSkills();

    return (
        <div className="flex items-center gap-2 sm:gap-4">
            {error && (
                <span className="hidden lg:inline text-red-400 text-[10px] animate-pulse">{error}</span>
            )}

            {/* Botón IA Path */}
            <button
                onClick={onAiPathClick}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl font-bold transition-all whitespace-nowrap group"
                title="Generar ruta con IA"
            >
                <Sparkles size={16} className="group-hover:animate-pulse" fill="currentColor" />
                <span className="hidden md:inline text-xs">Path IA</span>
            </button>

            {/* Botón Nueva Skill */}
            <button
                onClick={onNewSkillClick}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all whitespace-nowrap shadow-lg shadow-emerald-900/20"
            >
                <Plus size={16} />
                <span className="hidden sm:inline text-xs">Nueva Skill</span>
                <span className="sm:hidden text-xs">Crear</span>
            </button>

            {/* WIP INDICATOR */}
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${isWIPLimitReached
                    ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    : 'bg-slate-900 border-slate-800'
                    }`}
            >
                <span className="hidden lg:inline text-[8px] text-slate-500 uppercase font-black tracking-widest">WIP</span>
                <span
                    className={`text-xs font-mono font-black ${isWIPLimitReached ? 'text-red-400' : 'text-emerald-400'
                        }`}
                >
                    {currentWIP}/{maxWIP}
                </span>
                {isWIPLimitReached && (
                    <AlertTriangle size={14} className="text-red-400 animate-pulse" />
                )}
            </div>
        </div>
    );
}
