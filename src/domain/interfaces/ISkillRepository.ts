import { Skill } from '../entities/Skill';
import { SkillData } from '../types';

/**
 * Interfaz del repositorio de Skills
 * Define el contrato que deben cumplir las implementaciones (localStorage, API, etc.)
 * 
 * Principio SOLID: Dependency Inversion - Depender de abstracciones, no implementaciones
 */
export interface ISkillRepository {
    /**
     * Obtiene todas las skills
     */
    getAll(): Skill[];

    /**
     * Obtiene una skill por su ID
     */
    getById(id: string): Skill | undefined;

    /**
     * Guarda una skill (crear o actualizar)
     */
    save(skill: Skill): void;

    /**
     * Guarda múltiples skills
     */
    saveAll(skills: Skill[]): void;

    /**
     * Obtiene los datos crudos (para persistencia)
     */
    getAllData(): SkillData[];
}
