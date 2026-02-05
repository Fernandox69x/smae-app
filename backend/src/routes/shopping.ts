import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { ShoppingService } from '../services/shoppingService';

const router = Router();

/**
 * GET /api/shopping/items
 * Obtener todos los items del usuario
 */
router.get('/items', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const items = await prisma.shoppingItem.findMany({
            where: { userId },
            include: {
                history: {
                    orderBy: { purchaseDate: 'desc' },
                    take: 5
                }
            },
            orderBy: [
                { isInStock: 'asc' }, // Primero los que NO están en stock
                { priority: 'desc' },
                { name: 'asc' }
            ]
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching shopping items:', error);
        res.status(500).json({ error: 'Error al obtener lista de compras' });
    }
});

/**
 * POST /api/shopping/items
 * Crear nuevo producto
 */
router.post('/items', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { name, category, priority, targetQuantity, unit, notes, currentStock, minStock, maxStock, isPerishable } = req.body;

        if (!name) return res.status(400).json({ error: 'Nombre es requerido' });

        const item = await prisma.shoppingItem.create({
            data: {
                userId,
                name,
                category,
                priority: priority || 'medium',
                targetQuantity,
                unit,
                notes,
                currentStock: currentStock || 0,
                minStock: minStock || 0,
                maxStock: maxStock || null,
                isPerishable: isPerishable || false,
                isInStock: (currentStock || 0) > 0
            }
        });

        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating shopping item:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

/**
 * PUT /api/shopping/items/:id
 * Actualizar producto (incluyendo cambiar stock)
 */
router.put('/items/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { id } = req.params as { id: string };
        const data = req.body;

        // Verificar ownership
        const existing = await prisma.shoppingItem.findFirst({
            where: { id, userId }
        });

        if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

        const item = await prisma.shoppingItem.update({
            where: { id },
            data: {
                name: data.name,
                category: data.category,
                priority: data.priority,
                targetQuantity: data.targetQuantity,
                unit: data.unit,
                notes: data.notes,
                isInStock: data.isInStock !== undefined ? data.isInStock : undefined,
                currentStock: data.currentStock,
                minStock: data.minStock,
                maxStock: data.maxStock,
                isPerishable: data.isPerishable
            }
        });

        res.json(item);
    } catch (error) {
        console.error('Error updating shopping item:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

/**
 * DELETE /api/shopping/items/:id
 */
router.delete('/items/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { id } = req.params as { id: string };

        const existing = await prisma.shoppingItem.findFirst({
            where: { id, userId }
        });

        if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

        await prisma.shoppingItem.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting shopping item:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

/**
 * POST /api/shopping/purchase
 * Registrar una compra y actualizar stock
 */
router.post('/purchase', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { itemId, price, currency, store, quantity, notes } = req.body;

        if (!itemId || !price || !store) {
            return res.status(400).json({ error: 'Item, precio y tienda son requeridos' });
        }

        const ticket = await ShoppingService.recordTicket(userId, {
            store,
            currency,
            items: [{
                itemId,
                price: Number(price),
                quantity: Number(quantity || 1),
                notes
            }]
        });

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error recording purchase:', error);
        res.status(500).json({ error: 'Error al registrar compra' });
    }
});

/**
 * POST /api/shopping/tickets
 * Registrar compra de múltiples items (Ticket)
 */
router.post('/tickets', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { store, purchaseDate, currency, notes, items } = req.body;

        if (!store || !items || !items.length) {
            return res.status(400).json({ error: 'Tienda e items son requeridos' });
        }

        const ticket = await ShoppingService.recordTicket(userId, {
            store,
            purchaseDate,
            currency,
            notes,
            items
        });

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error recording ticket:', error);
        res.status(500).json({ error: 'Error al registrar ticket de compra' });
    }
});

/**
 * POST /api/shopping/consume
 * Registrar consumo de un producto
 */
router.post('/consume', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { itemId, quantity } = req.body;

        if (!itemId || quantity === undefined) {
            return res.status(400).json({ error: 'Item y cantidad son requeridos' });
        }

        const item = await ShoppingService.consumeItem(userId, itemId, Number(quantity));
        res.json({ success: true, item });
    } catch (error) {
        console.error('Error consuming item:', error);
        res.status(500).json({ error: 'Error al registrar consumo' });
    }
});

/**
 * GET /api/shopping/tickets
 */
router.get('/tickets', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const tickets = await prisma.shoppingTicket.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        item: true
                    }
                }
            },
            orderBy: { purchaseDate: 'desc' },
            take: 20
        });
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Error al obtener historial de tickets' });
    }
});

/**
 * GET /api/shopping/stats/:id
 * Obtener estadísticas de precio para un item
 */
router.get('/stats/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { id } = req.params as { id: string };

        // Verificar que el item pertenece al usuario
        const item = await prisma.shoppingItem.findFirst({
            where: { id, userId }
        });

        if (!item) return res.status(404).json({ error: 'Producto no encontrado' });

        const history = await prisma.purchaseHistory.findMany({
            where: { shoppingItemId: id },
            orderBy: { price: 'asc' }
        });

        if (history.length === 0) {
            return res.json({ message: 'Sin historial para este producto', bestPrice: null });
        }

        const bestPrice = history[0];
        const lastPrice = await prisma.purchaseHistory.findFirst({
            where: { shoppingItemId: id },
            orderBy: { purchaseDate: 'desc' }
        });

        const storeFrequencies = history.reduce((acc: any, curr) => {
            acc[curr.store] = (acc[curr.store] || 0) + 1;
            return acc;
        }, {});

        const preferredStore = Object.entries(storeFrequencies).sort((a: any, b: any) => b[1] - a[1])[0][0];

        res.json({
            item: item.name,
            bestPrice: {
                price: bestPrice.price,
                store: bestPrice.store,
                date: bestPrice.purchaseDate
            },
            lastPrice: {
                price: lastPrice?.price,
                store: lastPrice?.store,
                date: lastPrice?.purchaseDate
            },
            preferredStore,
            historyCount: history.length
        });
    } catch (error) {
        console.error('Error fetching item stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas del producto' });
    }
});

/**
 * GET /api/shopping/items/:id/history
 */
router.get('/items/:id/history', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { id } = req.params as { id: string };

        const item = await prisma.shoppingItem.findFirst({
            where: { id, userId }
        });

        if (!item) return res.status(404).json({ error: 'Producto no encontrado' });

        const history = await prisma.purchaseHistory.findMany({
            where: { shoppingItemId: id },
            orderBy: { purchaseDate: 'desc' }
        });

        res.json(history);
    } catch (error) {
        console.error('Error fetching item history:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

/**
 * DELETE /api/shopping/history/:id
 * Eliminar un registro de compra y revertir el stock (opcionalmente)
 */
router.delete('/history/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).userId!;
        const { id } = req.params as { id: string };
        const revertStock = req.query.revertStock === 'true';

        // Buscar el registro de historia
        const historyEntry = await prisma.purchaseHistory.findUnique({
            where: { id },
            include: { item: true }
        }) as any;

        if (!historyEntry) return res.status(404).json({ error: 'Registro de compra no encontrado' });
        if (historyEntry.item.userId !== userId) return res.status(403).json({ error: 'No autorizado' });

        await prisma.$transaction(async (tx) => {
            // Revertir stock si se solicita
            if (revertStock) {
                const newStock = Math.max(0, Number(historyEntry.item.currentStock) - Number(historyEntry.quantity || 0));
                await tx.shoppingItem.update({
                    where: { id: historyEntry.shoppingItemId },
                    data: {
                        currentStock: newStock,
                        isInStock: newStock > 0
                    }
                });
            }

            // Eliminar el registro de historia
            await tx.purchaseHistory.delete({
                where: { id }
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting purchase history:', error);
        res.status(500).json({ error: 'Error al eliminar el registro de compra' });
    }
});

export default router;
