import { useMemo } from 'react';
import { useSkillContext } from '../context/SkillContext';
import { Skill } from '@domain/entities/Skill';
import { LEVELS } from '@domain/constants/levels';
import { SkillData } from '@domain/types';

/**
 * Hook personalizado para gestionar skills
 * Proporciona acceso simplificado al contexto y lógica derivada
 */
export function useSkills() {
    const context = useSkillContext();

    return {
        skills: context.skills,
        currentWIP: context.currentWIP,
        maxWIP: context.maxWIP,
        isWIPLimitReached: context.isWIPLimitReached,
        isLoading: context.isLoading,
        error: context.error,
        selectSkill: context.selectSkill,
        levelUpSkill: context.levelUpSkill,
        getSkillById: context.getSkillById,
        refreshSkills: context.refreshSkills,
        // CRUD
        createSkill: context.createSkill,
        updateSkill: context.updateSkill,
        deleteSkill: context.deleteSkill,
    };
}

/**
 * Hook para la skill seleccionada
 */
export function useSelectedSkill() {
    const { selectedSkillId, getSkillById, canSkillLevelUp, getRequirementsInfo, getCooldownInfo, debugFastForward, deleteSkill } = useSkillContext();

    const selectedSkill = useMemo(() => {
        if (!selectedSkillId) return null;
        return getSkillById(selectedSkillId);
    }, [selectedSkillId, getSkillById]);

    const levelInfo = useMemo(() => {
        if (!selectedSkill) return null;
        return LEVELS[selectedSkill.level];
    }, [selectedSkill]);

    const nextLevelInfo = useMemo(() => {
        if (!selectedSkill || selectedSkill.level >= 5) return null;
        return LEVELS[selectedSkill.level + 1];
    }, [selectedSkill]);

    const requirementsInfo = useMemo(() => {
        if (!selectedSkillId) return { isUnlocked: false, missingRequirements: [] as string[] };
        return getRequirementsInfo(selectedSkillId);
    }, [selectedSkillId, getRequirementsInfo]);

    const cooldownInfo = useMemo(() => {
        if (!selectedSkillId) return { isActive: false, hoursRemaining: 0, expirationDate: null };
        return getCooldownInfo(selectedSkillId);
    }, [selectedSkillId, getCooldownInfo]);

    const canLevelUp = useMemo(() => {
        if (!selectedSkillId) return { canLevelUp: false };
        return canSkillLevelUp(selectedSkillId);
    }, [selectedSkillId, canSkillLevelUp]);

    const fastForward = async (hours: number) => {
        if (selectedSkillId) {
            await debugFastForward(selectedSkillId, hours);
        }
    };

    const handleDelete = async () => {
        if (selectedSkillId) {
            return await deleteSkill(selectedSkillId);
        }
        return { success: false, error: 'No hay skill seleccionada' };
    };

    return {
        selectedSkill,
        selectedSkillId,
        levelInfo,
        nextLevelInfo,
        requirementsInfo,
        cooldownInfo,
        canLevelUp,
        fastForward,
        deleteSkill: handleDelete,
    };
}

/**
 * Hook para obtener skills por categoría
 */
export function useSkillsByCategory() {
    const { skills } = useSkillContext();

    return useMemo(() => {
        const categories = new Map<string, Skill[]>();

        skills.forEach(skill => {
            const existing = categories.get(skill.category) || [];
            categories.set(skill.category, [...existing, skill]);
        });

        return categories;
    }, [skills]);
}

/**
 * Hook para categorías únicas
 */
export function useCategories(): string[] {
    const { skills } = useSkillContext();

    return useMemo(() => {
        const categories = new Set<string>();
        skills.forEach(skill => categories.add(skill.category));
        return Array.from(categories).sort();
    }, [skills]);
}
