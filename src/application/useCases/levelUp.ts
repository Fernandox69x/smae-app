import { Skill } from '@domain/entities/Skill';
import { LevelUpValidation } from '@domain/types';

/**
 * Use Case: Subir de nivel una skill
 * 
 * Orquesta todas las validaciones necesarias antes de permitir
 * el avance de nivel siguiendo la metodología S.M.A.E.
 * 
 * Principio SOLID: Single Responsibility
 */
export function levelUp(
    skill: Skill,
    getSkillById: (id: string) => Skill | undefined,
    currentWIP: number
): { success: boolean; skill?: Skill; error?: string } {
    // Validar si puede subir de nivel
    const validation: LevelUpValidation = skill.canLevelUp(getSkillById, currentWIP);

    if (!validation.canLevelUp) {
        return {
            success: false,
            error: validation.reason,
        };
    }

    // Ejecutar la subida de nivel
    const updatedSkill = skill.levelUp();

    return {
        success: true,
        skill: updatedSkill,
    };
}

/**
 * Obtiene el siguiente nivel disponible
 */
export function getNextLevelInfo(skill: Skill): {
    currentLevel: number;
    nextLevel: number;
    isMaxLevel: boolean;
} {
    const currentLevel = skill.level;
    const isMaxLevel = currentLevel >= 5;
    const nextLevel = isMaxLevel ? 5 : currentLevel + 1;

    return {
        currentLevel,
        nextLevel,
        isMaxLevel,
    };
}
