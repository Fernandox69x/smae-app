import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas de skills
router.use(authMiddleware);

/**
 * GET /api/skills
 * Obtener todas las skills del usuario con sus dependencias
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const skills = await prisma.skill.findMany({
            where: { userId: req.userId },
            include: {
                requirements: {
                    select: { requirementId: true }
                }
            }
        });

        // Transformar al formato esperado por el frontend
        const formattedSkills = skills.map(skill => ({
            id: skill.id,
            name: skill.name,
            category: skill.category,
            level: skill.level,
            lastPracticed: skill.lastPracticed ? Number(skill.lastPracticed) : null,
            wip: skill.wip,
            requirements: skill.requirements.map(r => r.requirementId),
            x: skill.x,
            y: skill.y
        }));

        res.json(formattedSkills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Error al obtener skills' });
    }
});

/**
 * GET /api/skills/:id
 * Obtener skill por ID (solo si pertenece al usuario)
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const skill = await prisma.skill.findFirst({
            where: { id, userId: req.userId },
            include: {
                requirements: {
                    select: { requirementId: true }
                }
            }
        });

        if (!skill) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        res.json({
            ...skill,
            lastPracticed: skill.lastPracticed ? Number(skill.lastPracticed) : null,
            requirements: skill.requirements.map(r => r.requirementId)
        });
    } catch (error) {
        console.error('Error fetching skill:', error);
        res.status(500).json({ error: 'Error al obtener skill' });
    }
});

/**
 * POST /api/skills
 * Crear nueva skill para el usuario
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { id, name, category, level = 0, wip = false, requirements = [], x, y } = req.body;

        const skill = await prisma.skill.create({
            data: {
                id,
                name,
                category,
                level,
                wip,
                x,
                y,
                userId: req.userId,
                requirements: {
                    create: requirements.map((reqId: string) => ({
                        requirementId: reqId
                    }))
                }
            },
            include: {
                requirements: { select: { requirementId: true } }
            }
        });

        res.status(201).json({
            ...skill,
            requirements: skill.requirements.map(r => r.requirementId)
        });
    } catch (error) {
        console.error('Error creating skill:', error);
        res.status(500).json({ error: 'Error al crear skill' });
    }
});

/**
 * PUT /api/skills/:id
 * Actualizar skill (incluyendo level-up)
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, category, level, lastPracticed, wip, requirements, x, y } = req.body;

        // Verificar que la skill pertenece al usuario
        const existing = await prisma.skill.findFirst({
            where: { id, userId: req.userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        // Si se actualizan requirements, primero eliminar los existentes
        if (requirements) {
            await prisma.skillRequirement.deleteMany({
                where: { skillId: id }
            });
        }

        const skill = await prisma.skill.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(category && { category }),
                ...(level !== undefined && { level }),
                ...(lastPracticed !== undefined && { lastPracticed: lastPracticed ? BigInt(lastPracticed) : null }),
                ...(wip !== undefined && { wip }),
                ...(x !== undefined && { x }),
                ...(y !== undefined && { y }),
                ...(requirements && {
                    requirements: {
                        create: requirements.map((reqId: string) => ({
                            requirementId: reqId
                        }))
                    }
                })
            },
            include: {
                requirements: { select: { requirementId: true } }
            }
        });

        res.json({
            ...skill,
            lastPracticed: skill.lastPracticed ? Number(skill.lastPracticed) : null,
            requirements: skill.requirements.map(r => r.requirementId)
        });
    } catch (error) {
        console.error('Error updating skill:', error);
        res.status(500).json({ error: 'Error al actualizar skill' });
    }
});

/**
 * DELETE /api/skills/:id
 * Eliminar skill
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verificar que la skill pertenece al usuario
        const existing = await prisma.skill.findFirst({
            where: { id, userId: req.userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        await prisma.skill.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting skill:', error);
        res.status(500).json({ error: 'Error al eliminar skill' });
    }
});

/**
 * PUT /api/skills/:id/level-up
 * Subir de nivel una skill
 */
router.put('/:id/level-up', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const skill = await prisma.skill.findFirst({
            where: { id, userId: req.userId }
        });

        if (!skill) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        if (skill.level >= 5) {
            return res.status(400).json({ error: 'Ya está en nivel máximo (Maestría)' });
        }

        const nextLevel = skill.level + 1;
        const isStillWip = nextLevel < 5;

        const updated = await prisma.skill.update({
            where: { id },
            data: {
                level: nextLevel,
                wip: isStillWip,
                lastPracticed: BigInt(Date.now())
            }
        });

        res.json({
            ...updated,
            lastPracticed: updated.lastPracticed ? Number(updated.lastPracticed) : null
        });
    } catch (error) {
        console.error('Error leveling up skill:', error);
        res.status(500).json({ error: 'Error al subir nivel' });
    }
});

export default router;
