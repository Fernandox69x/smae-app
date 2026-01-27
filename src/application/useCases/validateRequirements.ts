import { Skill } from '@domain/entities/Skill';

/**
 * Use Case: Validar requisitos de dependencias
 * 
 * Regla de negocio: Una skill solo puede desbloquearse cuando
 * todas sus dependencias (padres) están en L4 o superior.
 * 
 * Principio SOLID: Single Responsibility
 */
export function validateRequirements(
    skill: Skill,
    getSkillById: (id: string) => Skill | undefined
): boolean {
    return skill.isUnlocked(getSkillById);
}

/**
 * Obtiene la lista de requisitos faltantes
 */
export function getMissingRequirements(
    skill: Skill,
    getSkillById: (id: string) => Skill | undefined
): string[] {
    return skill.requirements.filter(reqId => {
        const parent = getSkillById(reqId);
        return !parent || parent.level < 4;
    });
}
