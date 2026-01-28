import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import skillRoutes from './routes/skills';
import authRoutes from './routes/auth';
import validationRoutes from './routes/validations';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// CORS: permitir frontend en desarrollo y producción
const allowedOrigins = [
    'http://localhost:5173',
    'https://smae-app.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (como Postman) o si está en la lista
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/validations', validationRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SMAE API running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export { prisma };
