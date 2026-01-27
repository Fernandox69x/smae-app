import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Skill } from '@domain/entities/Skill';
import { SkillData } from '@domain/types';
import { apiSkillRepository } from '@infrastructure/repositories/ApiSkillRepository';
import { MAX_WIP } from '@domain/constants/levels';

interface SkillContextType {
    skills: Skill[];
    selectedSkillId: string | null;
    currentWIP: number;
    maxWIP: number;
    isWIPLimitReached: boolean;
    isLoading: boolean;
    error: string | null;

    // Acciones
    selectSkill: (id: string | null) => void;
    levelUpSkill: (id: string) => Promise<{ success: boolean; error?: string }>;
    getSkillById: (id: string) => Skill | undefined;
    canSkillLevelUp: (id: string) => { canLevelUp: boolean; reason?: string };
    getRequirementsInfo: (id: string) => { isUnlocked: boolean; missingRequirements: string[] };
    getCooldownInfo: (id: string) => { isActive: boolean; hoursRemaining: number; expirationDate: Date | null };
    debugFastForward: (id: string, hours: number) => Promise<void>;
    refreshSkills: () => Promise<void>;

    // CRUD
    createSkill: (data: Omit<SkillData, 'lastPracticed'>) => Promise<{ success: boolean; error?: string }>;
    updateSkill: (id: string, updates: Partial<SkillData>) => Promise<{ success: boolean; error?: string }>;
    deleteSkill: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

interface SkillProviderProps {
    children: ReactNode;
}

/**
 * Provider del contexto de Skills
 * Conecta la UI con la API REST
 */
export function SkillProvider({ children }: SkillProviderProps) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar skills al montar
    const refreshSkills = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedSkills = await apiSkillRepository.fetchAll();
            setSkills(fetchedSkills);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSkills();
    }, [refreshSkills]);

    const selectSkill = useCallback((id: string | null) => {
        setSelectedSkillId(id);
    }, []);

    const getSkillById = useCallback((id: string) => {
        return skills.find(s => s.id === id);
    }, [skills]);

    const levelUpSkill = useCallback(async (id: string) => {
        try {
            await apiSkillRepository.levelUp(id);
            await refreshSkills();
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Error al subir nivel' };
        }
    }, [refreshSkills]);

    const canSkillLevelUp = useCallback((id: string) => {
        const skill = skills.find(s => s.id === id);
        if (!skill) return { canLevelUp: false, reason: 'Skill no encontrada' };

        const currentWIP = skills.filter(s => s.wip).length;
        return skill.canLevelUp((reqId) => skills.find(s => s.id === reqId), currentWIP);
    }, [skills]);

    const getRequirementsInfo = useCallback((id: string) => {
        const skill = skills.find(s => s.id === id);
        if (!skill) return { isUnlocked: false, missingRequirements: [] };

        const isUnlocked = skill.isUnlocked((reqId) => skills.find(s => s.id === reqId));
        const missingRequirements = skill.requirements.filter(reqId => {
            const parent = skills.find(s => s.id === reqId);
            return !parent || parent.level < 4;
        });

        return { isUnlocked, missingRequirements };
    }, [skills]);

    const getCooldownInfo = useCallback((id: string) => {
        const skill = skills.find(s => s.id === id);
        if (!skill) return { isActive: false, hoursRemaining: 0, expirationDate: null };

        const isActive = skill.isInCooldown();
        const hoursRemaining = Math.ceil(skill.getCooldownHoursRemaining());
        const expirationDate = isActive && skill.lastPracticed
            ? new Date(skill.lastPracticed + 48 * 60 * 60 * 1000)
            : null;

        return { isActive, hoursRemaining, expirationDate };
    }, [skills]);

    const debugFastForward = useCallback(async (id: string, hours: number) => {
        const skill = skills.find(s => s.id === id);
        if (skill && skill.lastPracticed) {
            await apiSkillRepository.update(id, {
                lastPracticed: skill.lastPracticed - (hours * 60 * 60 * 1000)
            });
            await refreshSkills();
        }
    }, [skills, refreshSkills]);

    // CRUD Operations
    const createSkill = useCallback(async (data: Omit<SkillData, 'lastPracticed'>) => {
        try {
            await apiSkillRepository.create(data);
            await refreshSkills();
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Error al crear' };
        }
    }, [refreshSkills]);

    const updateSkill = useCallback(async (id: string, updates: Partial<SkillData>) => {
        try {
            await apiSkillRepository.update(id, updates);
            await refreshSkills();
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar' };
        }
    }, [refreshSkills]);

    const deleteSkill = useCallback(async (id: string) => {
        try {
            await apiSkillRepository.delete(id);
            if (selectedSkillId === id) {
                setSelectedSkillId(null);
            }
            await refreshSkills();
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar' };
        }
    }, [refreshSkills, selectedSkillId]);

    const currentWIP = useMemo(() => skills.filter(s => s.wip).length, [skills]);
    const isWIPLimitReached = useMemo(() => currentWIP >= MAX_WIP, [currentWIP]);

    const value: SkillContextType = {
        skills,
        selectedSkillId,
        currentWIP,
        maxWIP: MAX_WIP,
        isWIPLimitReached,
        isLoading,
        error,
        selectSkill,
        levelUpSkill,
        getSkillById,
        canSkillLevelUp,
        getRequirementsInfo,
        getCooldownInfo,
        debugFastForward,
        refreshSkills,
        createSkill,
        updateSkill,
        deleteSkill,
    };

    return (
        <SkillContext.Provider value={value}>
            {children}
        </SkillContext.Provider>
    );
}

/**
 * Hook para consumir el contexto de Skills
 */
export function useSkillContext(): SkillContextType {
    const context = useContext(SkillContext);

    if (context === undefined) {
        throw new Error('useSkillContext debe usarse dentro de un SkillProvider');
    }

    return context;
}
