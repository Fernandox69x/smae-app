import {
    BookOpen,
    Copy,
    Brain,
    Clock,
    Crown,
    Lock,
} from 'lucide-react';
import { LevelsMap } from '../types';

/**
 * Niveles de la metodología S.M.A.E.
 * 
 * L0: Inactivo - Habilidad no iniciada
 * L1: Exposición - Entiendes la teoría
 * L2: Copia - Ejecución con guía
 * L3: Autonomía - Ejecución sin ayuda (Prueba en Frío)
 * L4: Consolidación - Repetición tras 48h (Memoria Largo Plazo)
 * L5: Maestría - Integración en flujo real o enseñanza
 */
export const LEVELS: LevelsMap = {
    0: { label: 'Inactivo', desc: 'Habilidad no iniciada.', icon: <Lock /> },
    1: { label: 'L1: Exposición', desc: 'Entiendes la teoría. Sabes "qué es".', icon: <BookOpen /> },
    2: { label: 'L2: Copia', desc: 'Ejecución con guía/instrucciones.', icon: <Copy /> },
    3: { label: 'L3: Autonomía', desc: 'Ejecución sin ayuda (Prueba en Frío).', icon: <Brain /> },
    4: { label: 'L4: Consolidación', desc: 'Repetición tras 48h (Memoria Largo Plazo).', icon: <Clock /> },
    5: { label: 'L5: Maestría', desc: 'Integración en flujo real o enseñanza.', icon: <Crown /> },
};

/**
 * Límite máximo de Work In Progress (habilidades activas simultáneamente)
 * Basado en la carga cognitiva óptima para el aprendizaje efectivo
 */
export const MAX_WIP = 3;

/**
 * Horas requeridas de espera para consolidación (L3 → L4)
 */
export const CONSOLIDATION_HOURS = 48;
