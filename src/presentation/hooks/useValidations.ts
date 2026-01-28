import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Validation {
    id: string;
    skillId: string;
    level: number;
    evidenceType?: string;
    evidence?: string;
    aiAnalysis?: string;
    passed: boolean;
    attemptedAt: string;
    passedAt?: string;
    cooldownEnd?: string;
}

interface CooldownStatus {
    canAttemptL4: boolean;
    cooldownEnd?: string;
    timeRemaining?: number;
    reason?: string;
}

/**
 * Hook para manejar validaciones de skills
 */
export function useValidations(skillId?: string) {
    const [validations, setValidations] = useState<Validation[]>([]);
    const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    /**
     * Obtener historial de validaciones
     */
    const fetchValidations = useCallback(async () => {
        if (!skillId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/validations/${skillId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener validaciones');

            const data = await response.json();
            setValidations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, [skillId]);

    /**
     * Verificar estado de cooldown para L4
     */
    const checkCooldown = useCallback(async () => {
        if (!skillId) return;

        try {
            const response = await fetch(`${API_URL}/validations/skill/${skillId}/cooldown`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al verificar cooldown');

            const data = await response.json();
            setCooldownStatus(data);
        } catch (err) {
            console.error('Error checking cooldown:', err);
        }
    }, [skillId]);

    /**
     * Registrar intento de validación
     */
    const submitValidation = useCallback(async (
        level: number,
        evidenceType: string,
        evidence: string,
        passed: boolean
    ) => {
        if (!skillId) return null;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/validations`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    skillId,
                    level,
                    evidenceType,
                    evidence,
                    passed
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Manejar errores específicos (cooldown, nivel incorrecto, etc.)
                setError(data.error || 'Error al registrar validación');
                return { success: false, error: data.error, ...data };
            }

            // Refrescar validaciones
            await fetchValidations();

            return { success: true, validation: data, ...data };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    }, [skillId, fetchValidations]);

    /**
     * Botón de pánico (re-evaluar honestamente)
     */
    const triggerPanic = useCallback(async (validationId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/validations/${validationId}/panic`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Error al re-evaluar');

            const data = await response.json();
            await fetchValidations();

            return { success: true, ...data };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    }, [fetchValidations]);

    return {
        validations,
        cooldownStatus,
        isLoading,
        error,
        fetchValidations,
        checkCooldown,
        submitValidation,
        triggerPanic
    };
}
