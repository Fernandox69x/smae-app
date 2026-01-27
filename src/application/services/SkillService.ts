import { Skill } from '@domain/entities/Skill';
import { ISkillRepository } from '@domain/interfaces/ISkillRepository';
import { MAX_WIP } from '@domain/constants/levels';
import { levelUp, getNextLevelInfo } from '../useCases/levelUp';
import { validateRequirements, getMissingRequirements } from '../useCases/validateRequirements';
import { checkCooldown, getCooldownExpirationDate } from '../useCases/checkCooldown';

/**
 * Servicio de aplicación para gestionar Skills
 * 
 * Orquesta los casos de uso y proporciona una API limpia
 * para la capa de presentación.
 * 
 * Principio SOLID: 
 * - Single Responsibility: Coordina operaciones de skills
 * - Dependency Inversion: Depende de ISkillRepository (abstracción)
 */
export class SkillService {
    private repository: ISkillRepository;

    constructor(repository: ISkillRepository) {
        this.repository = repository;
    }

    /**
     * Obtiene todas las skills
     */
    getAllSkills(): Skill[] {
        return this.repository.getAll();
    }

    /**
     * Obtiene una skill por ID
     */
    getSkillById(id: string): Skill | undefined {
        return this.repository.getById(id);
    }

    /**
     * Calcula el WIP (Work In Progress) actual
     */
    getCurrentWIP(): number {
        return this.repository.getAll().filter(s => s.wip).length;
    }

    /**
     * Verifica si se ha alcanzado el límite de WIP
     */
    isWIPLimitReached(): boolean {
        return this.getCurrentWIP() >= MAX_WIP;
    }

    /**
     * Intenta subir de nivel una skill
     */
    attemptLevelUp(skillId: string): {
        success: boolean;
        error?: string
    } {
        const skill = this.repository.getById(skillId);

        if (!skill) {
            return { success: false, error: 'Skill no encontrada' };
        }

        const result = levelUp(
            skill,
            (id) => this.repository.getById(id),
            this.getCurrentWIP()
        );

        if (result.success && result.skill) {
            this.repository.save(result.skill);
            return { success: true };
        }

        return { success: false, error: result.error };
    }

    /**
     * Verifica si una skill puede subir de nivel
     */
    canSkillLevelUp(skillId: string): {
        canLevelUp: boolean;
        reason?: string
    } {
        const skill = this.repository.getById(skillId);

        if (!skill) {
            return { canLevelUp: false, reason: 'Skill no encontrada' };
        }

        return skill.canLevelUp(
            (id) => this.repository.getById(id),
            this.getCurrentWIP()
        );
    }

    /**
     * Obtiene información sobre requisitos de una skill
     */
    getRequirementsInfo(skillId: string): {
        isUnlocked: boolean;
        missingRequirements: string[];
    } {
        const skill = this.repository.getById(skillId);

        if (!skill) {
            return { isUnlocked: false, missingRequirements: [] };
        }

        const getById = (id: string) => this.repository.getById(id);

        return {
            isUnlocked: validateRequirements(skill, getById),
            missingRequirements: getMissingRequirements(skill, getById),
        };
    }

    /**
     * Obtiene información de cooldown de una skill
     */
    getCooldownInfo(skillId: string): {
        isActive: boolean;
        hoursRemaining: number;
        expirationDate: Date | null;
    } {
        const skill = this.repository.getById(skillId);

        if (!skill) {
            return { isActive: false, hoursRemaining: 0, expirationDate: null };
        }

        const cooldown = checkCooldown(skill);
        const expirationDate = getCooldownExpirationDate(skill);

        return {
            ...cooldown,
            expirationDate,
        };
    }

    /**
     * Obtiene información del próximo nivel
     */
    getNextLevelInfo(skillId: string) {
        const skill = this.repository.getById(skillId);

        if (!skill) {
            return { currentLevel: 0, nextLevel: 0, isMaxLevel: true };
        }

        return getNextLevelInfo(skill);
    }

    /**
     * Simula el paso del tiempo (debug)
     */
    debugFastForward(skillId: string, hours: number): void {
        const skill = this.repository.getById(skillId);

        if (skill) {
            const updated = skill.fastForward(hours);
            this.repository.save(updated);
        }
    }
}
