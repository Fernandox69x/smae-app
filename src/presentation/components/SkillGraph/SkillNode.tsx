import { LEVELS } from '@domain/constants/levels';
import { Skill } from '@domain/entities/Skill';
import { useSkillContext } from '../../context/SkillContext';

interface SkillNodeProps {
    skill: Skill;
    isUnlocked: boolean;
}

/**
 * Componente de nodo individual en el grafo
 * Representa una skill con su nivel y estado visual
 */
export function SkillNode({ skill, isUnlocked }: SkillNodeProps) {
    const { selectedSkillId, selectSkill } = useSkillContext();
    const isSelected = selectedSkillId === skill.id;

    // Determinar color según estado
    let nodeColor = 'bg-slate-800 border-slate-700 text-slate-500'; // Locked/L0

    if (skill.level === 5) {
        nodeColor = 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    } else if (skill.level >= 1) {
        nodeColor = 'bg-emerald-600/20 border-emerald-500 text-emerald-400';
    } else if (isUnlocked) {
        nodeColor = 'bg-slate-700 border-slate-500 text-slate-300 hover:border-emerald-400';
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
            <div className="mb-1">
                {LEVELS[skill.level].icon}
            </div>
            <span className="text-[10px] font-bold uppercase max-w-[90%] text-center leading-none truncate">
                {skill.name}
            </span>

            {/* Badge de Nivel */}
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm">
                {skill.level}
            </div>
        </button>
    );
}
