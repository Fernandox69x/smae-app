import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin as any);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            usersThisMonth,
            totalVisits,
            visitsToday,
            visitsThisMonth,
            totalContacts,
            unreadContacts,
            totalSkills
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
            prisma.pageVisit.count(),
            prisma.pageVisit.count({ where: { createdAt: { gte: today } } }),
            prisma.pageVisit.count({ where: { createdAt: { gte: thisMonth } } }),
            prisma.contactSubmission.count(),
            prisma.contactSubmission.count({ where: { isRead: false } }),
            prisma.skill.count()
        ]);

        // Get visits by page
        const visitsByPage = await prisma.pageVisit.groupBy({
            by: ['path'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        // Recent contacts
        const recentContacts = await prisma.contactSubmission.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                subject: true,
                isRead: true,
                createdAt: true
            }
        });

        res.json({
            users: {
                total: totalUsers,
                thisMonth: usersThisMonth
            },
            visits: {
                total: totalVisits,
                today: visitsToday,
                thisMonth: visitsThisMonth,
                byPage: visitsByPage.map(v => ({ path: v.path, count: v._count.id }))
            },
            contacts: {
                total: totalContacts,
                unread: unreadContacts,
                recent: recentContacts
            },
            skills: {
                total: totalSkills
            }
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// =====================
// SOCIAL LINKS CRUD
// =====================

/**
 * GET /api/admin/social-links
 */
router.get('/social-links', async (req: Request, res: Response) => {
    try {
        const links = await prisma.socialLink.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(links);
    } catch (error) {
        console.error('Error getting social links:', error);
        res.status(500).json({ error: 'Error al obtener links' });
    }
});

/**
 * POST /api/admin/social-links
 */
router.post('/social-links', async (req: Request, res: Response) => {
    try {
        const { name, url, icon } = req.body;

        if (!name || !url || !icon) {
            return res.status(400).json({ error: 'Nombre, URL e icono son requeridos' });
        }

        // Get max order
        const maxOrder = await prisma.socialLink.aggregate({
            _max: { order: true }
        });

        const link = await prisma.socialLink.create({
            data: {
                name,
                url,
                icon,
                order: (maxOrder._max.order || 0) + 1
            }
        });

        res.status(201).json(link);
    } catch (error) {
        console.error('Error creating social link:', error);
        res.status(500).json({ error: 'Error al crear link' });
    }
});

/**
 * PUT /api/admin/social-links/:id
 */
router.put('/social-links/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, url, icon, order, isActive } = req.body;

        const link = await prisma.socialLink.update({
            where: { id: String(id) },
            data: {
                ...(name !== undefined && { name }),
                ...(url !== undefined && { url }),
                ...(icon !== undefined && { icon }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(link);
    } catch (error) {
        console.error('Error updating social link:', error);
        res.status(500).json({ error: 'Error al actualizar link' });
    }
});

/**
 * DELETE /api/admin/social-links/:id
 */
router.delete('/social-links/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.socialLink.delete({ where: { id: String(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting social link:', error);
        res.status(500).json({ error: 'Error al eliminar link' });
    }
});

// =====================
// PORTFOLIO CONFIG
// =====================

/**
 * GET /api/admin/config/:key
 */
router.get('/config/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const config = await prisma.portfolioConfig.findUnique({
            where: { key: String(key) }
        });
        res.json(config?.value || null);
    } catch (error) {
        console.error('Error getting config:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

/**
 * PUT /api/admin/config/:key
 */
router.put('/config/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const config = await prisma.portfolioConfig.upsert({
            where: { key: String(key) },
            update: { value },
            create: { key: String(key), value }
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// =====================
// CONTACT SUBMISSIONS
// =====================

/**
 * GET /api/admin/contacts
 */
router.get('/contacts', async (req: Request, res: Response) => {
    try {
        const contacts = await prisma.contactSubmission.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(contacts);
    } catch (error) {
        console.error('Error getting contacts:', error);
        res.status(500).json({ error: 'Error al obtener contactos' });
    }
});

/**
 * PUT /api/admin/contacts/:id/read
 */
router.put('/contacts/:id/read', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isRead } = req.body;

        const contact = await prisma.contactSubmission.update({
            where: { id: String(id) },
            data: { isRead: isRead ?? true }
        });

        res.json(contact);
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Error al actualizar contacto' });
    }
});

/**
 * DELETE /api/admin/contacts/:id
 */
router.delete('/contacts/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.contactSubmission.delete({ where: { id: String(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Error al eliminar contacto' });
    }
});

// =====================
// PROJECTS CRUD
// =====================

/**
 * GET /api/admin/projects
 */
router.get('/projects', async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(projects);
    } catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({ error: 'Error al obtener proyectos' });
    }
});

/**
 * POST /api/admin/projects
 */
router.post('/projects', async (req: Request, res: Response) => {
    try {
        const { name, subtitle, description, imageUrl, projectUrl, repoUrl, technologies, status, featured } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: 'Nombre y descripción son requeridos' });
        }

        // Get max order
        const maxOrder = await prisma.project.aggregate({
            _max: { order: true }
        });

        const project = await prisma.project.create({
            data: {
                name,
                subtitle: subtitle || null,
                description,
                imageUrl: imageUrl || null,
                projectUrl: projectUrl || null,
                repoUrl: repoUrl || null,
                technologies: technologies || [],
                status: status || 'development',
                featured: featured || false,
                order: (maxOrder._max.order || 0) + 1
            }
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Error al crear proyecto' });
    }
});

/**
 * PUT /api/admin/projects/:id
 */
router.put('/projects/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, subtitle, description, imageUrl, projectUrl, repoUrl, technologies, status, featured, order, isActive } = req.body;

        const project = await prisma.project.update({
            where: { id: String(id) },
            data: {
                ...(name !== undefined && { name }),
                ...(subtitle !== undefined && { subtitle }),
                ...(description !== undefined && { description }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(projectUrl !== undefined && { projectUrl }),
                ...(repoUrl !== undefined && { repoUrl }),
                ...(technologies !== undefined && { technologies }),
                ...(status !== undefined && { status }),
                ...(featured !== undefined && { featured }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Error al actualizar proyecto' });
    }
});

/**
 * DELETE /api/admin/projects/:id
 */
router.delete('/projects/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.project.delete({ where: { id: String(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Error al eliminar proyecto' });
    }
});

export default router;
