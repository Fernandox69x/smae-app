import { LEVELS } from '@domain/constants/levels';
import { Skill } from '@domain/entities/Skill';
import { useSkillContext } from '../../context/SkillContext';
import { Clock, AlertTriangle } from 'lucide-react';

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

    // Usar currentLevel si existe, sino level
    const currentLevel = (skill as any).currentLevel ?? skill.level;
    const isActive = (skill as any).isActive ?? skill.wip;
    const failCount = (skill as any).failCount ?? 0;

    // Determinar color según estado
    let nodeColor = 'bg-slate-800 border-slate-700 text-slate-500'; // Locked/L0

    if (currentLevel >= 4) {
        // Nivel 4 (Consolidación) = Maestría
        nodeColor = 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    } else if (currentLevel >= 3) {
        // Nivel 3 (Prueba Fría) = En camino
        nodeColor = 'bg-emerald-600/20 border-emerald-400 text-emerald-300';
    } else if (currentLevel >= 1) {
        // Nivel 1-2 = En progreso
        nodeColor = 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400';
    } else if (isUnlocked) {
        // Desbloqueado pero sin empezar
        nodeColor = 'bg-slate-700 border-slate-500 text-slate-300 hover:border-emerald-400';
    }

    // Indicador de skill activa
    if (isActive) {
        nodeColor += ' ring-1 ring-blue-400';
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
        border-2 transition-all duration-300 shadow-xl ${nodeColor}`}
        >
            {/* Icono del nivel */}
            <div className="mb-1">
                {LEVELS[Math.min(skill.level, 5)].icon}
            </div>

            {/* Nombre de la skill */}
            <span className="text-[10px] font-bold uppercase max-w-[90%] text-center leading-none truncate">
                {skill.name}
            </span>

            {/* Pips de nivel (en lugar del badge numérico) */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <LevelPips level={currentLevel} maxLevel={4} />
            </div>

            {/* Indicador de fallas (si hay 2+) */}
            {failCount >= 2 && (
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-orange-500/80 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-white" />
                </div>
            )}

            {/* Badge de nivel numérico (esquina derecha) */}
            <div className={`absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shadow-sm ${currentLevel >= 4
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-900 border border-slate-600 text-white'
                }`}>
                L{currentLevel}
            </div>
        </button>
    );
}

