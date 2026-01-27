import { Skill } from '@domain/entities/Skill';

/**
 * Servicio para calcular el diseño (layout) del grafo de habilidades.
 * Utiliza un algoritmo de capas basado en la profundidad de las dependencias.
 */
export class LayoutService {
    private VERTICAL_SPACING = 250;
    private HORIZONTAL_SPACING = 350;

    /**
     * Calcula y asigna coordenadas X e Y a cada skill.
     * Crecimiento vertical basado en dependencias.
     */
    public calculateLayout(skills: Skill[]): Skill[] {
        if (skills.length === 0) return [];

        const skillMap = new Map<string, Skill>();
        skills.forEach(s => skillMap.set(s.id, s));

        const depths = new Map<string, number>();

        // 1. Calcular profundidad de cada nodo
        const calculateDepth = (id: string, visited: Set<string> = new Set()): number => {
            if (depths.has(id)) return depths.get(id)!;
            if (visited.has(id)) return 0; // Evitar ciclos (aunque es un DAG)

            const skill = skillMap.get(id);
            if (!skill || skill.requirements.length === 0) {
                depths.set(id, 0);
                return 0;
            }

            visited.add(id);
            const maxParentDepth = Math.max(
                ...skill.requirements.map(reqId => calculateDepth(reqId, new Set(visited)))
            );

            const depth = maxParentDepth + 1;
            depths.set(id, depth);
            return depth;
        };

        skills.forEach(skill => calculateDepth(skill.id));

        // 2. Agrupar por niveles
        const levels = new Map<number, Skill[]>();
        depths.forEach((depth, id) => {
            const skill = skillMap.get(id);
            if (skill) {
                const levelSkills = levels.get(depth) || [];
                levelSkills.push(skill);
                levels.set(depth, levelSkills);
            }
        });

        // 3. Asignar coordenadas
        levels.forEach((levelSkills, depth) => {
            const totalInLevel = levelSkills.length;
            const levelWidth = (totalInLevel - 1) * this.HORIZONTAL_SPACING;
            const startX = -levelWidth / 2;

            // Ordenar por categoría para mayor orden visual
            levelSkills.sort((a, b) => a.category.localeCompare(b.category));

            levelSkills.forEach((skill, index) => {
                skill.x = startX + index * this.HORIZONTAL_SPACING;
                skill.y = depth * this.VERTICAL_SPACING;
            });
        });

        return Array.from(skillMap.values());
    }
}

export const layoutService = new LayoutService();
