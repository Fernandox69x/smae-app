import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Servicio para interactuar con la IA de Google Gemini
 * Especializado en el sistema S.M.A.E.
 */
export class AIService {
    private static model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    /**
     * Analiza una evidencia de aprendizaje según los criterios SMAE
     */
    static async analyzeEvidence(
        skillName: string,
        level: number,
        evidenceType: string,
        evidenceContent: string
    ) {
        const prompt = `
            Eres un experto evaluador del sistema de aprendizaje S.M.A.E. (Sistema Maestro Anti-Autoengaño).
            Tu objetivo es analizar honestamente si la evidencia proporcionada por el estudiante es suficiente para validar el nivel solicitado.

            Habilidad: "${skillName}"
            Nivel a Validar: L${level}
            Tipo de Evidencia: ${evidenceType}
            Contenido de la Evidencia: "${evidenceContent}"

            CRITERIOS SMAE PARA EVALUAR:
            - L1 (Concepto): El estudiante debe explicar el concepto con sus propias palabras. No copy-paste. Debe demostrar que entiende el "qué".
            - L2 (Conexión): El estudiante debe conectar el concepto con ejemplos reales o conocimientos previos. Debe demostrar el "cómo se relaciona".
            - L3 (Prueba Fría/Aplicación): El estudiante debe describir cómo aplicó el conocimiento en un problema real o ejercicio práctico sin ayuda externa.

            Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
            {
                "passed": boolean,
                "score": number (0-10),
                "feedback": "string breve y honesto explicando por qué pasa o por qué no",
                "suggestions": ["3 puntos clave para mejorar si falló o para profundizar si pasó"]
            }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Limpiar el texto de posibles backticks de markdown
            const cleanText = text.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Error in Gemini AIService:', error);
            throw new Error('Error al procesar la solicitud con la IA');
        }
    }

    /**
     * Genera un micro-curriculum educativo para una skill
     */
    static async generateMicroCurriculum(skillName: string, category: string) {
        const prompt = `
            Eres un tutor experto en pedagogía del sistema S.M.A.E.
            Genera un plan de estudio ultra-rápido (Micro-Curriculum) para la habilidad: "${skillName}" (Categoría: ${category}).

            El plan debe estar dividido en los 3 primeros niveles SMAE:
            1. L1 (Concepto): ¿Qué es lo más importante que debe entender hoy?
            2. L2 (Conexión): ¿Con qué otro conocimiento común debe relacionarlo sugerido?
            3. L3 (Aplicación): Sugiere un ejercicio práctico específico para validar el conocimiento.

            Responde ÚNICAMENTE en formato JSON:
            {
                "steps": [
                    { "level": 1, "action": "string corto", "details": "descripción breve" },
                    { "level": 2, "action": "string corto", "details": "descripción breve" },
                    { "level": 3, "action": "string corto", "details": "descripción breve" }
                ],
                "estimatedTime": "ej: 2 horas"
            }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleanText = text.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Error generating curriculum:', error);
            throw new Error('Error al generar micro-curriculum');
        }
    }
}
