import { prisma } from '../index';
import { Decimal } from '@prisma/client/runtime/library';

export class ShoppingService {
    /**
     * Registra un ticket de compra con múltiples productos
     */
    static async recordTicket(userId: string, data: {
        store: string;
        purchaseDate?: Date;
        currency?: string;
        notes?: string;
        items: {
            itemId: string;
            price: number;
            quantity: number;
            notes?: string;
        }[]
    }) {
        const { store, purchaseDate, currency, notes, items } = data;
        const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        return await prisma.$transaction(async (tx) => {
            // 1. Crear el Ticket
            const ticket = await tx.shoppingTicket.create({
                data: {
                    userId,
                    store,
                    purchaseDate: purchaseDate || new Date(),
                    currency: currency || 'NIO',
                    totalAmount,
                    notes
                }
            });

            // 2. Procesar cada item
            for (const item of items) {
                // Crear historial vinculado al ticket
                await tx.purchaseHistory.create({
                    data: {
                        shoppingItemId: item.itemId,
                        ticketId: ticket.id,
                        price: item.price,
                        quantity: item.quantity,
                        store, // Mantenemos redundancia para facilidad de consulta
                        purchaseDate: purchaseDate || new Date(),
                        currency: currency || 'NIO',
                        notes: item.notes
                    }
                });

                // Actualizar stock del producto
                const shoppingItem = await tx.shoppingItem.findUnique({
                    where: { id: item.itemId }
                });

                if (shoppingItem) {
                    const newStock = Number(shoppingItem.currentStock) + item.quantity;
                    await tx.shoppingItem.update({
                        where: { id: item.itemId },
                        data: {
                            currentStock: newStock,
                            isInStock: newStock > 0
                        }
                    });
                }
            }

            return ticket;
        });
    }

    /**
     * Reduce el stock de un producto (consumo)
     */
    static async consumeItem(userId: string, itemId: string, quantity: number) {
        const item = await prisma.shoppingItem.findFirst({
            where: { id: itemId, userId }
        });

        if (!item) throw new Error('Producto no encontrado');

        const newStock = Math.max(0, Number(item.currentStock) - quantity);

        return await prisma.shoppingItem.update({
            where: { id: itemId },
            data: {
                currentStock: newStock,
                isInStock: newStock > 0
            }
        });
    }

    /**
     * Ajuste manual de stock
     */
    static async updateStock(userId: string, itemId: string, newStock: number) {
        const item = await prisma.shoppingItem.findFirst({
            where: { id: itemId, userId }
        });

        if (!item) throw new Error('Producto no encontrado');

        return await prisma.shoppingItem.update({
            where: { id: itemId },
            data: {
                currentStock: newStock,
                isInStock: newStock > 0
            }
        });
    }
}
