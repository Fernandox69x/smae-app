import { useState } from 'react';
import { BookOpen, Crown, Lock, Edit2, Trash2, Zap } from 'lucide-react';
import { useSelectedSkill, useSkills } from '../../hooks/useSkills';
import { StatusCard } from './StatusCard';
import { ValidationPanel } from './ValidationPanel';

interface SkillSidebarProps {
    onLevelUpClick: () => void;
    onEditClick: () => void;
}

/**
 * Sidebar con detalles de la skill seleccionada
 */
export function SkillSidebar({ onLevelUpClick, onEditClick }: SkillSidebarProps) {
    const { selectedSkill, levelInfo, nextLevelInfo, requirementsInfo, cooldownInfo, fastForward, deleteSkill, refreshSkills, toggleActivate } = useSelectedSkill();
    const { currentWIP, maxWIP, isWIPLimitReached } = useSkills();
    const [showValidation, setShowValidation] = useState(true);

    const handleDelete = async () => {
        if (selectedSkill && confirm(`¿Eliminar "${selectedSkill.name}"? Esta acción no se puede deshacer.`)) {
            await deleteSkill();
        }
    };

    if (!selectedSkill) {
        return (
            <div className="w-96 bg-slate-950 border-l border-slate-800 flex flex-col z-10 shadow-2xl">
                <div className="flex flex-col items-center justify-center h-full text-slate-600 p-6 text-center">
                    <BookOpen size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Selecciona un nodo del grafo para ver su estado S.M.A.E.</p>
                </div>
            </div>
        );
    }

    // Usar currentLevel nuevo o level legacy
    const currentLevel = (selectedSkill as any).currentLevel ?? selectedSkill.level;
    const isCooldownActive = cooldownInfo.isActive;
    const requirementsMet = requirementsInfo.isUnlocked;

    return (
        <div className="w-96 bg-slate-950 border-l border-slate-800 flex flex-col z-10 shadow-2xl">
            <div className="flex flex-col h-full p-6 overflow-y-auto">
                {/* Header Nodo */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider">
                            {selectedSkill.category}
                        </span>
                        <h2 className="text-2xl font-bold text-white leading-tight mt-1">
                            {selectedSkill.name}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toggleActivate(selectedSkill.id, !((selectedSkill as any).isActive))}
                            className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${(selectedSkill as any).isActive
                                ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                                }`}
                            title={(selectedSkill as any).isActive ? "Quitar de enfoque" : "Fijar enfoque (máx 3)"}
                        >
                            <Zap size={16} fill={(selectedSkill as any).isActive ? 'currentColor' : 'none'} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                                {(selectedSkill as any).isActive ? 'En Enfoque' : 'Enfoque'}
                            </span>
                        </button>
                        <button
                            onClick={onEditClick}
                            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Editar skill"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                            title="Eliminar skill"
                        >
                            <Trash2 size={16} />
                        </button>
                        <div
                            className={`p-2 rounded-lg border ${currentLevel >= 4
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                        >
                            {levelInfo?.icon}
                        </div>
                    </div>
                </div>

                {/* Toggle entre vista antigua y nueva */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setShowValidation(true)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${showValidation
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        Sistema Anti-Autoengaño
                    </button>
                    <button
                        onClick={() => setShowValidation(false)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${!showValidation
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        Vista Clásica
                    </button>
                </div>

                {/* Panel de Validación (nuevo sistema) */}
                {showValidation ? (
                    <ValidationPanel
                        skillId={selectedSkill.id}
                        currentLevel={currentLevel}
                        skillName={selectedSkill.name}
                        onLevelChange={refreshSkills}
                    />
                ) : (
                    <>
                        {/* Status Card (vista clásica) */}
                        <StatusCard onDebugFastForward={() => fastForward(49)} />

                        {/* Action Area (vista clásica) */}
                        <div className="mt-auto">
                            <div className="border-t border-slate-800 pt-6">
                                {selectedSkill.level < 5 ? (
                                    <button
                                        onClick={onLevelUpClick}
                                        disabled={!requirementsMet || isCooldownActive}
                                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all
                  ${!requirementsMet || isCooldownActive
                                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                                            }`}
                                    >
                                        <span>
                                            {selectedSkill.level === 0
                                                ? 'Iniciar Aprendizaje (L1)'
                                                : `Validar ${nextLevelInfo?.label.split(':')[0]}`}
                                        </span>
                                        {(!requirementsMet || isCooldownActive) && <Lock size={16} />}
                                    </button>
                                ) : (
                                    <div className="w-full py-4 bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                                        <Crown size={18} /> Maestría Alcanzada
                                    </div>
                                )}

                                {/* Contexto WIP */}
                                {selectedSkill.level === 0 && isWIPLimitReached && requirementsMet && (
                                    <p className="text-red-400 text-xs text-center mt-3">
                                        Límite WIP activo ({currentWIP}/{maxWIP}). Finaliza otra tarea primero.
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

