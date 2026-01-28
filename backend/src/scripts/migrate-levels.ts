import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de migración S.M.A.E. v1 -> v2
 * Copia el valor de 'level' (legacy) a 'currentLevel' (nuevo sistema)
 * y ajusta los valores si es necesario.
 */
async function migrateLevels() {
    console.log('🚀 Iniciando migración de niveles legacy...');

    try {
        const skills = await prisma.skill.findMany();
        console.log(`Encontradas ${skills.length} skills para procesar.`);

        let updatedCount = 0;

        for (const skill of skills) {
            // El nuevo currentLevel tiene default 1.
            // Si el level legacy es mayor que 0, actualizamos.
            if (skill.level > 0) {
                // En v1, level 0-5. En v2, currentLevel 1-4.
                // Mapeo: 1->1, 2->2, 3->3, 4->4, 5->4 (Maestría)
                const newLevel = Math.min(skill.level, 4);

                await prisma.skill.update({
                    where: { id: skill.id },
                    data: {
                        currentLevel: newLevel,
                        // Si era nivel 5, ya no es WIP
                        isActive: skill.level < 5
                    }
                });
                updatedCount++;
            }
        }

        console.log(`✅ Migración completada. ${updatedCount} skills actualizadas.`);
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateLevels();
