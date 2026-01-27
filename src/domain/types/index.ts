import { ReactNode } from 'react';

/**
 * Representa un nivel en la escala S.M.A.E.
 */
export interface SkillLevel {
    label: string;
    desc: string;
    icon: ReactNode;
}

/**
 * Mapa de todos los niveles disponibles (0-5)
 */
export type LevelsMap = {
    [key: number]: SkillLevel;
};

/**
 * Datos crudos de un skill (como vienen del storage)
 */
export interface SkillData {
    id: string;
    name: string;
    category: string;
    level: number;
    lastPracticed: number | null;
    wip: boolean;
    requirements: string[];
    x?: number;
    y?: number;
}

/**
 * Resultado de validación de nivel
 */
export interface LevelUpValidation {
    canLevelUp: boolean;
    reason?: string;
}

/**
 * Tipos de evidencia disponibles
 */
export type EvidenceType = 'Video' | 'Audio' | 'Imagen' | 'Texto';
