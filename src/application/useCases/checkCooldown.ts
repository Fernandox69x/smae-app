import { Skill } from '@domain/entities/Skill';
import { CONSOLIDATION_HOURS } from '@domain/constants/levels';

/**
 * Use Case: Verificar período de cooldown
 * 
 * Regla de negocio: Para pasar de L3 (Autonomía) a L4 (Consolidación),
 * deben transcurrir 48 horas desde la última práctica para permitir
 * la consolidación de memoria a largo plazo.
 * 
 * Principio SOLID: Single Responsibility
 */
export function checkCooldown(skill: Skill): {
    isActive: boolean;
    hoursRemaining: number;
} {
    const isActive = skill.isInCooldown();
    const hoursRemaining = skill.getCooldownHoursRemaining();

    return {
        isActive,
        hoursRemaining: Math.ceil(hoursRemaining),
    };
}

/**
 * Obtiene la fecha/hora en que el cooldown expira
 */
export function getCooldownExpirationDate(skill: Skill): Date | null {
    if (!skill.isInCooldown() || skill.lastPracticed === null) {
        return null;
    }

    return new Date(skill.lastPracticed + CONSOLIDATION_HOURS * 60 * 60 * 1000);
}
