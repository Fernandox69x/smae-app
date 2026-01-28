import cron from 'node-cron';
import { prisma } from '../index';
import { sendCooldownEndEmail } from './emailService';

/**
 * Servicio para manejar notificaciones programadas
 */
export class NotificationService {
    /**
     * Inicializa las tareas programadas
     */
    static init() {
        console.log('🔔 Notification Service Initialized');

        // Ejecutar cada hora para revisar cooldowns finalizados
        cron.schedule('0 * * * *', () => {
            this.checkCooldowns();
        });

        // Tarea inmediata para pruebas al inicio (opcional)
        // this.checkCooldowns();
    }

    /**
     * Revisa qué skills han terminado su cooldown de 48h
     */
    static async checkCooldowns() {
        console.log('🔍 Checking for finished cooldowns...');

        try {
            const now = new Date();
            const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

            // 1. Buscar validaciones exitosas de L3 que:
            // - Pasaron hace más de 48h
            // - Pertenecen a una skill que aún está en nivel 3 (no consolidada)
            // - No se ha enviado notificación para esta validación específica
            const validationsToNotify = await prisma.validation.findMany({
                where: {
                    level: 3,
                    passed: true,
                    passedAt: {
                        lte: fortyEightHoursAgo
                    },
                    notified: false,
                    skill: {
                        level: 3
                    }
                } as any,
                include: {
                    skill: {
                        include: {
                            user: true
                        }
                    }
                } as any
            }) as any[];

            if (validationsToNotify.length === 0) {
                console.log('✅ No new skills to notify.');
                return;
            }

            console.log(`✉️ Found ${validationsToNotify.length} skills to notify.`);

            for (const validation of validationsToNotify) {
                const user = validation.skill.user;

                await sendCooldownEndEmail(
                    user.email,
                    validation.skill.name,
                    user.name || undefined
                );

                // Marcar como notificada para no repetir
                await prisma.validation.update({
                    where: { id: validation.id },
                    data: { notified: true } as any
                });

                console.log(`✅ Notified user ${user.email} for skill ${validation.skill.name}`);
            }

        } catch (error) {
            console.error('❌ Error checking cooldowns:', error);
        }
    }
}
