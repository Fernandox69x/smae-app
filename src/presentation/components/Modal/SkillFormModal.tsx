import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useSkills, useCategories } from '../../hooks/useSkills';
import { SkillData } from '@domain/types';

interface SkillFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSkill?: {
        id: string;
        name: string;
        category: string;
        x: number;
        y: number;
        requirements: string[];
    } | null;
}

/**
 * Modal para crear o editar skills
 */
export function SkillFormModal({ isOpen, onClose, editingSkill }: SkillFormModalProps) {
    const { skills, createSkill, updateSkill } = useSkills();
    const categories = useCategories();

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        category: '',
        x: 50,
        y: 50,
        requirements: [] as string[],
    });
    const [newCategory, setNewCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Resetear form cuando cambia editingSkill
    useEffect(() => {
        if (editingSkill) {
            setFormData({
                id: editingSkill.id,
                name: editingSkill.name,
                category: editingSkill.category,
                x: editingSkill.x,
                y: editingSkill.y,
                requirements: editingSkill.requirements,
            });
        } else {
            setFormData({
                id: '',
                name: '',
                category: '',
                x: 50,
                y: 50,
                requirements: [],
            });
        }
        setError(null);
    }, [editingSkill, isOpen]);

    if (!isOpen) return null;

    const isEditing = !!editingSkill;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const category = newCategory || formData.category;

            if (!formData.name || !category) {
                setError('Nombre y categoría son obligatorios');
                return;
            }

            const data: Omit<SkillData, 'lastPracticed'> = {
                id: formData.id || formData.name.toLowerCase().replace(/\s+/g, '_'),
                name: formData.name,
                category,
                level: 0,
                wip: false,
                requirements: formData.requirements,
                x: formData.x,
                y: formData.y,
            };

            let result;
            if (isEditing) {
                result = await updateSkill(editingSkill.id, {
                    name: data.name,
                    category: data.category,
                    x: data.x,
                    y: data.y,
                    requirements: data.requirements,
                });
            } else {
                result = await createSkill(data);
            }

            if (result.success) {
                onClose();
            } else {
                setError(result.error || 'Error desconocido');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleRequirement = (skillId: string) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements.includes(skillId)
                ? prev.requirements.filter(r => r !== skillId)
                : [...prev.requirements, skillId],
        }));
    };

    // Skills disponibles como dependencias (excluir la actual si está editando)
    const availableSkills = skills.filter(s => s.id !== editingSkill?.id);

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                        {isEditing ? 'Editar Skill' : 'Nueva Skill'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Ej: Acordes de Jazz"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Categoría *
                        </label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="">Seleccionar o crear nueva...</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="O escribe una nueva categoría..."
                        />
                    </div>

                    {/* Dependencias */}
                    {availableSkills.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                Dependencias (skills que deben estar en L4+)
                            </label>
                            <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-950 rounded-lg p-2 border border-slate-800">
                                {availableSkills.map(skill => (
                                    <label
                                        key={skill.id}
                                        className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.requirements.includes(skill.id)}
                                            onChange={() => toggleRequirement(skill.id)}
                                            className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-slate-300">{skill.name}</span>
                                        <span className="text-xs text-slate-500">({skill.category})</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Skill')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
