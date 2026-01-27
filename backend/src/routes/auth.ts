import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
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

export default router;
