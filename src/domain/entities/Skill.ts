import { SkillData, LevelUpValidation } from '../types';
import { CONSOLIDATION_HOURS, MAX_WIP } from '../constants/levels';

/**
 * Entidad de dominio para una Skill (habilidad)
 * Encapsula la lógica de negocio relacionada con el aprendizaje S.M.A.E.
 */
export class Skill {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    private _level: number;
    private _lastPracticed: number | null;
    private _wip: boolean;
    readonly currentLevel: number;
    readonly isActive: boolean;
    readonly failCount: number;
    readonly isHito: boolean;
    readonly isReinforcement: boolean;
    readonly parentSkillId: string | null;
    readonly requirements: string[];
    x: number;
    y: number;

    constructor(data: SkillData) {
        this.id = data.id;
        this.name = data.name;
        this.category = data.category;
        this._level = data.level;
        this.currentLevel = data.currentLevel ?? (data.level > 0 ? Math.min(data.level, 4) : 1);
        this.isActive = data.isActive ?? data.wip;
        this.failCount = data.failCount ?? 0;
        this.isHito = data.isHito ?? false;
        this.isReinforcement = data.isReinforcement ?? false;
        this.parentSkillId = data.parentSkillId ?? null;
        this._lastPracticed = data.lastPracticed;
        this._wip = data.wip;
        this.requirements = data.requirements;
        this.x = data.x ?? 0;
        this.y = data.y ?? 0;
    }

    // Getters
    get level(): number {
        return this._level;
    }

    get lastPracticed(): number | null {
        return this._lastPracticed;
    }

    get wip(): boolean {
        return this._wip;
    }

    /**
     * Verifica si la skill está desbloqueada (dependencias satisfechas)
     * Las dependencias padre deben estar en L4 o superior
     */
    isUnlocked(getSkillById: (id: string) => Skill | undefined): boolean {
        if (this.requirements.length === 0) return true;

        return this.requirements.every(reqId => {
            const parent = getSkillById(reqId);
            return parent && parent.level >= 4;
        });
    }

    /**
     * Verifica si el cooldown de 48h está activo (para transición L3 → L4)
     */
    isInCooldown(): boolean {
        if (this._level !== 3 || this._lastPracticed === null) return false;

        const hoursPassed = (Date.now() - this._lastPracticed) / (1000 * 60 * 60);
        return hoursPassed < CONSOLIDATION_HOURS;
    }

    /**
     * Calcula las horas restantes de cooldown
     */
    getCooldownHoursRemaining(): number {
        if (!this.isInCooldown() || this._lastPracticed === null) return 0;

        const hoursPassed = (Date.now() - this._lastPracticed) / (1000 * 60 * 60);
        return Math.max(0, CONSOLIDATION_HOURS - hoursPassed);
    }

    /**
     * Valida si la skill puede subir de nivel
     */
    canLevelUp(
        getSkillById: (id: string) => Skill | undefined,
        currentWIP: number
    ): LevelUpValidation {
        // Ya está en maestría
        if (this._level >= 5) {
            return { canLevelUp: false, reason: 'Ya has alcanzado la Maestría (L5).' };
        }

        // Verificar dependencias
        if (!this.isUnlocked(getSkillById)) {
            return {
                canLevelUp: false,
                reason: 'Las habilidades padre deben estar en Nivel 4 (Consolidación) mínimo.'
            };
        }

        // Verificar límite WIP (solo al iniciar L0 → L1)
        if (this._level === 0 && currentWIP >= MAX_WIP) {
            return {
                canLevelUp: false,
                reason: '¡Límite de WIP alcanzado! Termina o pausa una habilidad activa.'
            };
        }

        // Verificar cooldown 48h (L3 → L4)
        if (this.isInCooldown()) {
            return {
                canLevelUp: false,
                reason: `Debes esperar ${Math.ceil(this.getCooldownHoursRemaining())}h para consolidar la memoria (L4).`
            };
        }

        return { canLevelUp: true };
    }

    /**
     * Sube de nivel la skill (retorna nueva instancia - inmutabilidad)
     */
    levelUp(): Skill {
        const nextLevel = this._level + 1;
        const isStillWip = nextLevel < 5;

        return new Skill({
            id: this.id,
            name: this.name,
            category: this.category,
            level: nextLevel,
            lastPracticed: Date.now(),
            wip: isStillWip,
            requirements: this.requirements,
            x: this.x,
            y: this.y,
        });
    }

    /**
     * Simula el paso del tiempo (para debug)
     */
    fastForward(hours: number): Skill {
        return new Skill({
            id: this.id,
            name: this.name,
            category: this.category,
            level: this._level,
            lastPracticed: this._lastPracticed ? this._lastPracticed - (hours * 60 * 60 * 1000) : null,
            wip: this._wip,
            requirements: this.requirements,
            x: this.x,
            y: this.y,
        });
    }

    /**
     * Convierte a objeto plano (para serialización)
     */
    toData(): SkillData {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            level: this._level,
            currentLevel: this.currentLevel,
            isActive: this.isActive,
            failCount: this.failCount,
            isHito: this.isHito,
            isReinforcement: this.isReinforcement,
            parentSkillId: this.parentSkillId,
            lastPracticed: this._lastPracticed,
            wip: this._wip,
            requirements: this.requirements,
            x: this.x,
            y: this.y,
        };
    }
}
