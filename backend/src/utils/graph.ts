import { prisma } from '../index';

/**
 * Detecta si agregar una dependencia crea un ciclo en el grafo.
 * Utiliza Depth First Search (DFS).
 * 
 * @param skillId ID de la skill que recibirá los nuevos requerimientos
 * @param newRequirementIds IDs de las skills que serán requerimientos
 * @returns true si se detecta un ciclo, false en caso contrario
 */
export async function hasCycle(skillId: string, newRequirementIds: string[], userId: string): Promise<boolean> {
    // Si la skill se refiere a sí misma
    if (newRequirementIds.includes(skillId)) return true;

    // Obtener todas las skills del usuario para construir el grafo en memoria
    const allSkills = await prisma.skill.findMany({
        where: { userId },
        include: {
            requirements: { select: { requirementId: true } }
        }
    });

    const adj = new Map<string, string[]>();
    allSkills.forEach(s => {
        adj.set(s.id, s.requirements.map(r => r.requirementId));
    });

    // Simular la adición de los nuevos requerimientos
    adj.set(skillId, [...(adj.get(skillId) || []), ...newRequirementIds]);

    const visited = new Set<string>();
    const recStack = new Set<string>();

    async function isCyclic(v: string): Promise<boolean> {
        if (!visited.has(v)) {
            visited.add(v);
            recStack.add(v);

            const neighbors = adj.get(v) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && await isCyclic(neighbor)) {
                    return true;
                } else if (recStack.has(neighbor)) {
                    return true;
                }
            }
        }
        recStack.delete(v);
        return false;
    }

    // Iniciar DFS desde la skill que se está modificando
    return await isCyclic(skillId);
}
