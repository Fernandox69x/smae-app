import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed inicial con datos de demostración
 */
async function main() {
    console.log('🌱 Seeding database...');

    // Limpiar datos existentes
    await prisma.skillRequirement.deleteMany();
    await prisma.skill.deleteMany();

    // Crear skills base
    const skills = [
        {
            id: 'meta_focus',
            name: 'Atención Profunda',
            category: 'Soft Skill',
            level: 5,
            lastPracticed: BigInt(Date.now()),
            wip: false,
            x: 50,
            y: 10,
        },
        {
            id: 'guit_tuning',
            name: 'Afinación Standard',
            category: 'Guitarra',
            level: 4,
            lastPracticed: BigInt(Date.now() - 172800001),
            wip: false,
            x: 30,
            y: 30,
        },
        {
            id: 'guit_chords_open',
            name: 'Acordes Abiertos',
            category: 'Guitarra',
            level: 2,
            lastPracticed: BigInt(Date.now()),
            wip: true,
            x: 20,
            y: 55,
        },
        {
            id: 'guit_barre',
            name: 'Cejillas (Barre Chords)',
            category: 'Guitarra',
            level: 0,
            lastPracticed: null,
            wip: false,
            x: 20,
            y: 80,
        },
        {
            id: 'photo_iso',
            name: 'Triángulo: ISO',
            category: 'Canon T6i',
            level: 3,
            lastPracticed: BigInt(Date.now()),
            wip: true,
            x: 70,
            y: 30,
        },
        {
            id: 'photo_aperture',
            name: 'Triángulo: Apertura',
            category: 'Canon T6i',
            level: 1,
            lastPracticed: BigInt(Date.now()),
            wip: true,
            x: 85,
            y: 30,
        },
        {
            id: 'photo_manual',
            name: 'Modo Manual Total',
            category: 'Canon T6i',
            level: 0,
            lastPracticed: null,
            wip: false,
            x: 75,
            y: 65,
        },
    ];

    for (const skill of skills) {
        await prisma.skill.create({ data: skill });
    }

    // Crear dependencias
    const requirements = [
        { skillId: 'guit_tuning', requirementId: 'meta_focus' },
        { skillId: 'guit_chords_open', requirementId: 'guit_tuning' },
        { skillId: 'guit_barre', requirementId: 'guit_chords_open' },
        { skillId: 'photo_iso', requirementId: 'meta_focus' },
        { skillId: 'photo_aperture', requirementId: 'meta_focus' },
        { skillId: 'photo_manual', requirementId: 'photo_iso' },
        { skillId: 'photo_manual', requirementId: 'photo_aperture' },
    ];

    for (const req of requirements) {
        await prisma.skillRequirement.create({ data: req });
    }

    console.log('✅ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
