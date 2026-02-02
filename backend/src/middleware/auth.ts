import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smae-secret-key-change-in-production';

export interface AuthRequest extends Request {
    userId?: string;
}

/**
 * Middleware para verificar JWT y extraer userId
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    console.log('[AUTH] Request to:', req.path);
    console.log('[AUTH] Auth header present:', !!authHeader);
    console.log('[AUTH] JWT_SECRET used:', JWT_SECRET.substring(0, 10) + '...');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH] No Bearer token provided');
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[AUTH] Token received:', token.substring(0, 20) + '...');

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        console.log('[AUTH] Token verified, userId:', decoded.userId);
        req.userId = decoded.userId;
        next();
    } catch (error: any) {
        console.log('[AUTH] Token verification failed:', error.message);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

/**
 * Middleware opcional - permite requests sin auth pero agrega userId si hay token
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            req.userId = decoded.userId;
        } catch {
            // Token inválido, pero continuamos sin userId
        }
    }

    next();
}

/**
 * Genera un JWT para el usuario
 */
export function generateToken(userId: string, email?: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

/**
 * Middleware para verificar si el usuario es admin
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string };

        // Get user email from token or check if it matches admin email
        if (decoded.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
        }

        req.userId = decoded.userId;
        (req as any).isAdmin = true;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

export { JWT_SECRET };

