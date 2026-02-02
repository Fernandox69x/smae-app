import { BookOpen, Edit2, Trash2, Zap, X } from 'lucide-react';
import { useSelectedSkill } from '../../hooks/useSkills';
import { ValidationPanel } from './ValidationPanel';

interface SkillSidebarProps {
    onLevelUpClick: () => void;
    onEditClick: () => void;
    onClose?: () => void;
}

/**
 * Sidebar Unificado con Trazabilidad SMAE
 */
export function SkillSidebar({ onLevelUpClick, onEditClick, onClose }: SkillSidebarProps) {
    const { selectedSkill, refreshSkills, deleteSkill, toggleActivate } = useSelectedSkill();

    const handleDelete = async () => {
        if (selectedSkill && confirm(`¿Eliminar "${selectedSkill.name}"? Esta acción no se puede deshacer.`)) {
            await deleteSkill();
        }
    };

    if (!selectedSkill) {
        return (
            <div className="hidden lg:flex w-96 bg-slate-950 border-l border-slate-800 flex-col z-10 shadow-2xl">
                <div className="flex flex-col items-center justify-center h-full text-slate-600 p-6 text-center">
                    <BookOpen size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Selecciona una habilidad para ver tu camino a la maestría.</p>
                </div>
            </div>
        );
    }

    const currentLevel = (selectedSkill as any).currentLevel ?? selectedSkill.level;

    return (
        <div className="fixed inset-0 lg:relative lg:inset-auto w-full lg:w-96 bg-slate-950/95 lg:bg-slate-950 border-l border-slate-800 flex flex-col z-30 lg:z-10 shadow-2xl backdrop-blur-sm lg:backdrop-blur-none transition-all duration-300">
            <div className="flex flex-col h-full p-6 overflow-hidden">
                {/* Header Nodo */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex-1 mr-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded">
                                {selectedSkill.category}
                            </span>
                            {(selectedSkill as any).isHito && (
                                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                                    Hito
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight">
                            {selectedSkill.name}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                        {/* Botón Cerrar (Solo móvil) */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full mb-2"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleActivate(selectedSkill.id, !((selectedSkill as any).isActive))}
                                className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${(selectedSkill as any).isActive
                                    ? 'bg-emerald-500 text-slate-900 border-emerald-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                                    }`}
                                title={(selectedSkill as any).isActive ? "Quitar enfoque" : "Fijar enfoque"}
                            >
                                <Zap size={14} fill={(selectedSkill as any).isActive ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                onClick={onEditClick}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel de Validación Unificado con Timeline */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <ValidationPanel
                        skillId={selectedSkill.id}
                        currentLevel={currentLevel}
                        skillName={selectedSkill.name}
                        onLevelChange={refreshSkills}
                    />
                </div>
            </div>
        </div>
    );
}
