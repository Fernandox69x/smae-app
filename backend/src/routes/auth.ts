import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { prisma } from '../index';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                name: name || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });

        // Generar token
        const token = generateToken(user.id);

        res.status(201).json({
            user,
            token,
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token
        const token = generateToken(user.id);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
            token,
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

/**
 * GET /api/auth/me
 * Obtener usuario actual (requiere auth)
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperación de contraseña
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email es obligatorio' });
        }

        // Buscar usuario (no revelar si existe o no por seguridad)
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Siempre responder igual para evitar enumeration attacks
        const successMessage = { message: 'Si el email existe, recibirás un enlace de recuperación' };

        if (!user) {
            return res.json(successMessage);
        }

        // Generar token seguro (64 bytes = 128 chars hex)
        const token = crypto.randomBytes(64).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Expiración: 1 hora
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Invalidar tokens anteriores del usuario
        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() }
        });

        // Crear nuevo token
        await prisma.passwordResetToken.create({
            data: {
                tokenHash,
                userId: user.id,
                expiresAt,
            }
        });

        // Enviar email
        const { sendPasswordResetEmail } = await import('../services/emailService');
        await sendPasswordResetEmail(user.email, token, user.name || undefined);

        res.json(successMessage);
    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({ error: 'Error al procesar solicitud' });
    }
});

/**
 * POST /api/auth/reset-password
 * Restablecer contraseña con token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Hash del token recibido
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Buscar token válido
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });

        if (!resetToken) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        if (resetToken.usedAt) {
            return res.status(400).json({ error: 'Este enlace ya fue utilizado' });
        }

        if (resetToken.expiresAt < new Date()) {
            return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' });
        }

        // Actualizar contraseña
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash }
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() }
            })
        ]);

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
});

export default router;
