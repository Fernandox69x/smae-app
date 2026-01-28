import { LEVELS } from '@domain/constants/levels';
import { Skill } from '@domain/entities/Skill';
import { useSkillContext } from '../../context/SkillContext';
import { Clock, AlertTriangle, Award, Target } from 'lucide-react';

interface SkillNodeProps {
    skill: Skill;
    isUnlocked: boolean;
}

/**
 * Componente LevelPips - Indicador visual de nivel (5 puntos)
 */
function LevelPips({ level, maxLevel = 4 }: { level: number; maxLevel?: number }) {
    // Mapear nivel 0-4 a pips 1-5 (nivel 4 = todos llenos)
    const filledPips = Math.min(level, maxLevel);

    return (
        <div className="flex gap-1">
            {Array.from({ length: maxLevel + 1 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${i < filledPips
                        ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]'
                        : i === filledPips && level > 0
                            ? 'bg-emerald-400/50 animate-pulse'
                            : 'bg-slate-600'
                        }`}
                />
            ))}
        </div>
    );
}

/**
 * Componente de nodo individual en el grafo
 * Representa una skill con su nivel y estado visual
 */
export function SkillNode({ skill, isUnlocked }: SkillNodeProps) {
    const { selectedSkillId, selectSkill } = useSkillContext();
    const isSelected = selectedSkillId === skill.id;

    // Usar propiedades de la entidad (actualizadas)
    const currentLevel = (skill as any).currentLevel ?? skill.level;
    const isActive = (skill as any).isActive ?? skill.wip;
    const failCount = (skill as any).failCount ?? 0;
    const isHito = (skill as any).isHito ?? false;
    const isReinforcement = (skill as any).isReinforcement ?? false;

    // Determinar color base según estado
    let nodeColor = 'bg-slate-800 border-slate-700 text-slate-500'; // Locked/L0

    if (currentLevel >= 4) {
        nodeColor = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
    } else if (currentLevel >= 3) {
        nodeColor = 'bg-blue-600/20 border-blue-400 text-blue-300';
    } else if (currentLevel >= 1) {
        nodeColor = 'bg-slate-700/50 border-emerald-500/50 text-emerald-400';
    } else if (isUnlocked) {
        nodeColor = 'bg-slate-700 border-slate-500 text-slate-300 hover:border-emerald-400';
    }

    // Overrides para tipos especiales
    if (isHito) {
        nodeColor = currentLevel >= 4
            ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
            : 'bg-slate-800 border-amber-600 text-amber-500 hover:border-amber-400';
    }

    if (isReinforcement) {
        nodeColor = 'bg-red-900/20 border-red-500/50 text-red-400 hover:border-red-400';
    }

    // Indicador de skill activa
    if (isActive) {
        nodeColor += ' ring-1 ring-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
    }

    if (isSelected) {
        nodeColor += ' ring-2 ring-white scale-110 z-10';
    }

    return (
        <button
            onClick={() => selectSkill(skill.id)}
            style={{ left: `${skill.x}px`, top: `${skill.y}px` }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 
        w-24 h-24 rounded-2xl flex flex-col items-center justify-center 
        border-2 transition-all duration-300 shadow-xl ${nodeColor} ${isHito ? 'border-dashed' : ''}`}
        >
            {/* Etiquetas superiores flotantes */}
            <div className="absolute -top-3 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                {isHito && (
                    <div className="bg-amber-500 text-black px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 shadow-lg">
                        <Award size={8} fill="currentColor" /> HITO
                    </div>
                )}
                {isReinforcement && (
                    <div className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 shadow-lg">
                        <Target size={8} fill="currentColor" /> REFUERZO
                    </div>
                )}
            </div>

            {/* Icono del nivel o icono especial */}
            <div className="mb-1">
                {isReinforcement ? <Target size={20} className="text-red-400" /> :
                    isHito ? <Award size={20} className={currentLevel >= 4 ? 'text-amber-400' : 'text-amber-500/50'} /> :
                        LEVELS[Math.min(skill.level, 5)].icon}
            </div>

            {/* Nombre de la skill */}
            <span className={`text-[10px] font-bold uppercase max-w-[90%] text-center leading-none truncate ${isHito ? 'text-amber-200' : ''}`}>
                {skill.name}
            </span>

            {/* Pips de nivel (en lugar del badge numérico) */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <LevelPips level={currentLevel} maxLevel={4} />
            </div>

            {/* Indicador de fallas (si hay 2+) */}
            {failCount >= 2 && !isReinforcement && (
                <div className="absolute -top-4 -left-2 w-5 h-5 rounded-full bg-orange-500/80 flex items-center justify-center border border-white/20">
                    <AlertTriangle className="w-3 h-3 text-white" />
                </div>
            )}

            {/* Badge de nivel numérico (esquina derecha) */}
            <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shadow-md border ${currentLevel >= 4
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : isHito
                        ? 'bg-amber-600 text-white border-amber-400'
                        : 'bg-slate-900 border-slate-600 text-white'
                }`}>
                L{currentLevel}
            </div>
        </button>
    );
}


