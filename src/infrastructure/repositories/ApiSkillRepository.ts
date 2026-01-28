import { ISkillRepository } from '@domain/interfaces/ISkillRepository';
import { Skill } from '@domain/entities/Skill';
import { SkillData } from '@domain/types';
import { getAuthToken } from '@presentation/context/AuthContext';
import { config } from '../../config';

const API_BASE_URL = config.API_URL;

/**
 * Helper para obtener headers con auth
 */
function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

/**
 * Repositorio que consume la API REST
 * Implementa ISkillRepository para mantener la arquitectura limpia
 */
export class ApiSkillRepository implements ISkillRepository {
    private cache: Map<string, Skill> = new Map();

    async fetchAll(): Promise<Skill[]> {
        const response = await fetch(`${API_BASE_URL}/skills`, {
            headers: getAuthHeaders(),
        });

        if (response.status === 401) {
            throw new Error('No autorizado');
        }

        if (!response.ok) {
            throw new Error('Error al obtener skills');
        }

        const data: SkillData[] = await response.json();
        const skills = data.map(d => new Skill(d));

        // Actualizar cache
        this.cache.clear();
        skills.forEach(s => this.cache.set(s.id, s));

        return skills;
    }

    getAll(): Skill[] {
        return Array.from(this.cache.values());
    }

    getById(id: string): Skill | undefined {
        return this.cache.get(id);
    }

    async create(data: Omit<SkillData, 'lastPracticed'>): Promise<Skill> {
        const response = await fetch(`${API_BASE_URL}/skills`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Error al crear skill');
        }

        const skillData: SkillData = await response.json();
        const skill = new Skill(skillData);
        this.cache.set(skill.id, skill);
        return skill;
    }

    async update(id: string, updates: Partial<SkillData>): Promise<Skill> {
        const response = await fetch(`${API_BASE_URL}/skills/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error('Error al actualizar skill');
        }

        const skillData: SkillData = await response.json();
        const skill = new Skill(skillData);
        this.cache.set(skill.id, skill);
        return skill;
    }

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/skills/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Error al eliminar skill');
        }

        this.cache.delete(id);
    }

    async levelUp(id: string): Promise<Skill> {
        const response = await fetch(`${API_BASE_URL}/skills/${id}/level-up`, {
            method: 'PUT',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al subir de nivel');
        }

        const skillData: SkillData = await response.json();
        const skill = new Skill(skillData);
        this.cache.set(skill.id, skill);
        return skill;
    }

    async toggleActivate(id: string, isActive: boolean): Promise<Skill> {
        const response = await fetch(`${API_BASE_URL}/skills/${id}/activate`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isActive }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.message || 'Error al cambiar estado activo');
        }

        const skillData: SkillData = await response.json();
        const skill = new Skill(skillData);
        this.cache.set(skill.id, skill);
        return skill;
    }

    // Métodos síncronos para compatibilidad
    save(skill: Skill): void {
        this.cache.set(skill.id, skill);
    }

    saveAll(skills: Skill[]): void {
        skills.forEach(s => this.cache.set(s.id, s));
    }

    getAllData(): SkillData[] {
        return this.getAll().map(s => s.toData());
    }

    // Limpiar cache (útil al logout)
    clearCache(): void {
        this.cache.clear();
    }
}

// Singleton para usar en toda la app
export const apiSkillRepository = new ApiSkillRepository();
