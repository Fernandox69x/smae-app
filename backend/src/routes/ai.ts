import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AIService } from '../services/ai.service';
import { prisma } from '../index';

const router = Router();

// Todas las rutas de IA requieren autenticación
router.use(authMiddleware);

/**
 * POST /api/ai/analyze-evidence
 * Analiza una evidencia antes de enviarla formalmente
 */
router.post('/analyze-evidence', async (req: AuthRequest, res: Response) => {
    try {
        const { skillId, level, evidenceType, evidenceContent } = req.body;

        if (!skillId || !level || !evidenceType || !evidenceContent) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const skill = await prisma.skill.findUnique({
            where: { id: skillId }
        });

        if (!skill) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        const analysis = await AIService.analyzeEvidence(
            skill.name,
            level,
            evidenceType,
            evidenceContent
        );

        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing evidence with AI:', error);
        res.status(500).json({ error: 'Error al procesar el análisis de la IA' });
    }
});

/**
 * GET /api/ai/suggest-steps/:skillId
 * Genera sugerencias de aprendizaje basadas en la skill
 */
router.get('/suggest-steps/:skillId', async (req: AuthRequest, res: Response) => {
    try {
        const skillId = req.params.skillId as string;

        const skill = await prisma.skill.findUnique({
            where: { id: skillId }
        });

        if (!skill) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }

        const curriculum = await AIService.generateMicroCurriculum(
            skill.name,
            skill.category
        );

        res.json(curriculum);
    } catch (error) {
        console.error('Error generating AI steps:', error);
        res.status(500).json({ error: 'Error al generar sugerencias de la IA' });
    }
});

export default router;
