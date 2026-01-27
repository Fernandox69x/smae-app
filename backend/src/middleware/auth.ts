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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (error) {
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
export function generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };
