import cron from 'node-cron';
import { BriefingService } from './BriefingService';

export class CronService {
    static init() {
        // 1. Briefing Semanal: Cada lunes a las 8:00 AM
        // Formato: min hora dia mes dia-semana
        cron.schedule('0 8 * * 1', async () => {
            await BriefingService.sendWeeklyBriefings();
        });

        // Tarea de prueba opcional (cada hora para verificar que el servicio está vivo)
        cron.schedule('0 * * * *', () => {
            // Service is alive
        });
    }
}
