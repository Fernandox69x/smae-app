import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticación
router.use(authMiddleware);

/**
 * GET /api/validations/:skillId
 * Obtener historial de validaciones de una skill
 */
router.get('/:skillId', async (req: AuthRequest, res: Response) => {
    try {
        const skillId = req.params.skillId as string;

        // Verificar que la skill pertenece al usuario
        const skill = await prisma.skill.findFirst({
            where: { id: skillId, userId: req.userId as string }
        });

        if (!skill) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        const validations = await prisma.validation.findMany({
            where: { skillId },
            orderBy: { attemptedAt: 'desc' }
        });

        res.json(validations);
    } catch (error) {
        console.error('Error fetching validations:', error);
        res.status(500).json({ error: 'Error al obtener validaciones' });
    }
});

/**
 * POST /api/validations
 * Registrar un intento de validación
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { skillId, level, evidenceType, evidence, passed } = req.body;

        // Verificar que la skill pertenece al usuario
        const skill = await prisma.skill.findFirst({
            where: { id: skillId, userId: req.userId as string },
            include: { validations: { orderBy: { attemptedAt: 'desc' }, take: 1 } }
        });

        if (!skill) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        // Validar que no se salte niveles
        if (level > skill.currentLevel + 1) {
            return res.status(400).json({
                error: 'No puedes saltar niveles. Completa el nivel actual primero.'
            });
        }

        // Verificar cooldown para L4 (48h desde L3)
        if (level === 4) {
            const lastL3 = await prisma.validation.findFirst({
                where: { skillId, level: 3, passed: true },
                orderBy: { passedAt: 'desc' }
            });

            if (!lastL3 || !lastL3.passedAt) {
                return res.status(400).json({
                    error: 'Debes completar el nivel 3 antes de intentar el nivel 4.'
                });
            }

            const cooldownEnd = new Date(lastL3.passedAt.getTime() + 48 * 60 * 60 * 1000);
            if (new Date() < cooldownEnd) {
                return res.status(400).json({
                    error: 'Cooldown activo. Debes esperar 48 horas desde que pasaste L3.',
                    cooldownEnd
                });
            }
        }

        // Crear validación
        const validation = await prisma.validation.create({
            data: {
                skillId,
                level,
                evidenceType,
                evidence,
                passed,
                passedAt: passed ? new Date() : null,
                cooldownEnd: level === 3 && passed
                    ? new Date(Date.now() + 48 * 60 * 60 * 1000)
                    : null
            }
        });

        // Si pasó, actualizar nivel de la skill
        if (passed) {
            await prisma.skill.update({
                where: { id: skillId },
                data: {
                    currentLevel: level,
                    failCount: 0 // Reset fail count on success
                }
            });
        } else {
            // Si falló, incrementar failCount
            const newFailCount = skill.failCount + 1;

            // Si falla 3 veces, sugerir nodo de refuerzo
            if (newFailCount >= 3) {
                await prisma.skill.update({
                    where: { id: skillId },
                    data: { failCount: newFailCount }
                });

                return res.status(200).json({
                    validation,
                    suggestion: 'Has fallado 3 veces. Considera agregar un nodo de refuerzo.',
                    failCount: newFailCount
                });
            }

            // Retroceso si falla en L3 o L4
            if (level >= 3 && skill.currentLevel >= level - 1) {
                await prisma.skill.update({
                    where: { id: skillId },
                    data: {
                        currentLevel: level - 1,
                        failCount: newFailCount
                    }
                });
            } else {
                await prisma.skill.update({
                    where: { id: skillId },
                    data: { failCount: newFailCount }
                });
            }
        }

        res.status(201).json(validation);
    } catch (error) {
        console.error('Error creating validation:', error);
        res.status(500).json({ error: 'Error al crear validación' });
    }
});

/**
 * PUT /api/validations/:id/panic
 * Botón de pánico - re-evaluar (honestidad brutal)
 */
router.put('/:id/panic', async (req: AuthRequest, res: Response) => {
    try {
        const validationId = req.params.id as string;

        const validation = await prisma.validation.findUnique({
            where: { id: validationId },
            include: { skill: true }
        });

        if (!validation) {
            return res.status(404).json({ error: 'Validación no encontrada' });
        }

        // Verificar propiedad
        if (validation.skill.userId !== req.userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Retroceder nivel de la skill
        const newLevel = Math.max(1, validation.skill.currentLevel - 2);

        await prisma.skill.update({
            where: { id: validation.skillId },
            data: {
                currentLevel: newLevel,
                failCount: 0
            }
        });

        // Marcar validación como invalidada
        await prisma.validation.update({
            where: { id: validationId },
            data: {
                passed: false,
                passedAt: null
            }
        });

        res.json({
            message: 'Nivel retrocedido por honestidad brutal',
            newLevel
        });
    } catch (error) {
        console.error('Error in panic button:', error);
        res.status(500).json({ error: 'Error al re-evaluar' });
    }
});

/**
 * GET /api/validations/skill/:skillId/cooldown
 * Verificar estado de cooldown para una skill
 */
router.get('/skill/:skillId/cooldown', async (req: AuthRequest, res: Response) => {
    try {
        const skillId = req.params.skillId as string;

        const lastL3 = await prisma.validation.findFirst({
            where: { skillId, level: 3, passed: true },
            orderBy: { passedAt: 'desc' }
        });

        if (!lastL3 || !lastL3.passedAt) {
            return res.json({
                canAttemptL4: false,
                reason: 'No has completado L3 aún'
            });
        }

        const cooldownEnd = new Date(lastL3.passedAt.getTime() + 48 * 60 * 60 * 1000);
        const now = new Date();

        res.json({
            canAttemptL4: now >= cooldownEnd,
            cooldownEnd,
            timeRemaining: now < cooldownEnd ? cooldownEnd.getTime() - now.getTime() : 0
        });
    } catch (error) {
        console.error('Error checking cooldown:', error);
        res.status(500).json({ error: 'Error al verificar cooldown' });
    }
});

export default router;
