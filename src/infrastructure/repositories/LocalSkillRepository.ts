import { ISkillRepository } from '@domain/interfaces/ISkillRepository';
import { Skill } from '@domain/entities/Skill';
import { SkillData } from '@domain/types';

/**
 * Datos iniciales de skills para demostración
 * Basados en las metas del ejemplo original
 */
const INITIAL_DATA: SkillData[] = [
    // Rama Raíz: Meta-Aprendizaje
    {
        id: 'meta_focus',
        name: 'Atención Profunda',
        category: 'Soft Skill',
        level: 5,
        lastPracticed: Date.now(),
        wip: false,
        requirements: [],
        x: 50,
        y: 10,
    },
    // Rama: Guitarra
    {
        id: 'guit_tuning',
        name: 'Afinación Standard',
        category: 'Guitarra',
        level: 4,
        lastPracticed: Date.now() - 172800001, // Hace más de 48h
        wip: false,
        requirements: ['meta_focus'],
        x: 30,
        y: 30,
    },
    {
        id: 'guit_chords_open',
        name: 'Acordes Abiertos',
        category: 'Guitarra',
        level: 2,
        lastPracticed: Date.now(),
        wip: true, // ACTIVA
        requirements: ['guit_tuning'],
        x: 20,
        y: 55,
    },
    {
        id: 'guit_barre',
        name: 'Cejillas (Barre Chords)',
        category: 'Guitarra',
        level: 0,
        lastPracticed: null,
        wip: false,
        requirements: ['guit_chords_open'],
        x: 20,
        y: 80,
    },
    // Rama: Fotografía (Canon T6i)
    {
        id: 'photo_iso',
        name: 'Triángulo: ISO',
        category: 'Canon T6i',
        level: 3,
        lastPracticed: Date.now(), // Reciente, esperando 48h para L4
        wip: true, // ACTIVA
        requirements: ['meta_focus'],
        x: 70,
        y: 30,
    },
    {
        id: 'photo_aperture',
        name: 'Triángulo: Apertura',
        category: 'Canon T6i',
        level: 1,
        lastPracticed: Date.now(),
        wip: true, // ACTIVA
        requirements: ['meta_focus'],
        x: 85,
        y: 30,
    },
    {
        id: 'photo_manual',
        name: 'Modo Manual Total',
        category: 'Canon T6i',
        level: 0,
        lastPracticed: null,
        wip: false,
        requirements: ['photo_iso', 'photo_aperture'],
        x: 75,
        y: 65,
    },
];

/**
 * Repositorio local de Skills
 * Implementa ISkillRepository usando memoria (futuro: localStorage/API)
 * 
 * Principio SOLID: 
 * - Liskov Substitution: Puede sustituir cualquier ISkillRepository
 * - Open/Closed: Cerrado a modificación, abierto a extensión
 */
export class LocalSkillRepository implements ISkillRepository {
    private skills: Map<string, Skill>;

    constructor(initialData?: SkillData[]) {
        this.skills = new Map();
        const data = initialData || INITIAL_DATA;

        data.forEach(skillData => {
            this.skills.set(skillData.id, new Skill(skillData));
        });
    }

    getAll(): Skill[] {
        return Array.from(this.skills.values());
    }

    getById(id: string): Skill | undefined {
        return this.skills.get(id);
    }

    save(skill: Skill): void {
        this.skills.set(skill.id, skill);
    }

    saveAll(skills: Skill[]): void {
        skills.forEach(skill => this.save(skill));
    }

    getAllData(): SkillData[] {
        return this.getAll().map(skill => skill.toData());
    }
}
