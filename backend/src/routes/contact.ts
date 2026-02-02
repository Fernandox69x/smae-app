import { Router } from 'express';
import { sendContactEmail } from '../services/emailService';
import { prisma } from '../index';

const router = Router();

/**
 * POST /api/contact
 * Recibe un mensaje del formulario de contacto y lo envía por email
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validación básica
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos'
            });
        }

        // Validar formato de email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email inválido'
            });
        }

        // Guardar en base de datos para el admin panel
        await prisma.contactSubmission.create({
            data: { name, email, subject, message }
        });

        // Enviar email
        const result = await sendContactEmail(name, email, subject, message);

        if (!result.success) {
            console.error('Error enviando email de contacto:', result.error);
            return res.status(500).json({
                error: 'Error al enviar el mensaje. Intenta de nuevo más tarde.'
            });
        }

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente'
        });

    } catch (error) {
        console.error('Error en endpoint de contacto:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

export default router;
