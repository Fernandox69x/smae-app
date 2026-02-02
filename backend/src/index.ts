import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import skillRoutes from './routes/skills';
import authRoutes from './routes/auth';
import validationRoutes from './routes/validations';
import aiRoutes from './routes/ai';
import contactRoutes from './routes/contact';
import adminRoutes from './routes/admin';
import flowcontrolRoutes from './routes/flowcontrol';
import { NotificationService } from './services/notificationService';
import { authMiddleware } from './middleware/auth';
import { CronService } from './services/CronService';

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
app.use('/api/ai', aiRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/flowcontrol', authMiddleware, flowcontrolRoutes);

// Public endpoints for portfolio
app.get('/api/public/social-links', async (req, res) => {
    try {
        const links = await prisma.socialLink.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, url: true, icon: true }
        });
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// Visit tracking
app.post('/api/public/visit', async (req, res) => {
    try {
        const { path } = req.body;
        const userAgent = req.headers['user-agent']?.substring(0, 500);
        const referrer = (req.headers['referer'] || req.headers['referrer'] || '')?.toString().substring(0, 500);
        const ip = (req.ip || req.headers['x-forwarded-for'] || '')?.toString().substring(0, 45);

        await prisma.pageVisit.create({
            data: { path: path || '/', userAgent, referrer, ip }
        });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// Public config endpoint (read-only)
app.get('/api/public/config/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const config = await prisma.portfolioConfig.findUnique({
            where: { key }
        });
        res.json(config?.value || null);
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// Public projects endpoint
app.get('/api/public/projects', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { isActive: true },
            orderBy: [
                { featured: 'desc' },
                { order: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                subtitle: true,
                description: true,
                imageUrl: true,
                projectUrl: true,
                repoUrl: true,
                technologies: true,
                status: true,
                featured: true
            }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize external services
NotificationService.init();
CronService.init();

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
