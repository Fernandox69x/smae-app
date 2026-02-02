import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const USE_MOCK = process.env.USE_AI_MOCK === 'true';

console.log('🔑 Gemini API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING!');
console.log('🎭 AI Mock Mode:', USE_MOCK ? 'ENABLED' : 'DISABLED');

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Servicio para interactuar con la IA de Google Gemini
 * Especializado en el sistema S.M.A.E.
 * Incluye modo mock para desarrollo cuando la API tiene problemas
 */
export class AIService {
    private static model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    /**
     * Respuestas mock para desarrollo
     */
    private static mockResponses = {
        analyzeEvidence: {
            passed: true,
            score: 8,
            feedback: "Buena explicación del concepto. Se nota comprensión del tema.",
            suggestions: [
                "Profundiza más en los casos de uso prácticos",
                "Intenta relacionar con otros conceptos similares",
                "Practica explicándolo a alguien más"
            ]
        },
        generateMicroCurriculum: {
            steps: [
                { level: 1, action: "Comprender el concepto", details: "Lee y entiende la definición básica y sus componentes principales" },
                { level: 2, action: "Conectar conocimientos", details: "Relaciona este concepto con algo que ya conoces de tu experiencia" },
                { level: 3, action: "Aplicar en práctica", details: "Realiza un ejercicio práctico donde uses activamente este conocimiento" }
            ],
            estimatedTime: "2-3 horas"
        },
        generatePath: (goal: string) => ({
            nodes: [
                {
                    name: "Fundamentos Básicos",
                    category: "Fundamentos",
                    description: `Conceptos esenciales para ${goal}`,
                    dependencies: []
                },
                {
                    name: "Teoría Intermedia",
                    category: "Fundamentos",
                    description: "Profundización en conceptos clave",
                    dependencies: ["Fundamentos Básicos"]
                },
                {
                    name: "Práctica Guiada",
                    category: "Práctica",
                    description: "Ejercicios con guía y retroalimentación",
                    dependencies: ["Teoría Intermedia"]
                },
                {
                    name: "Proyecto Aplicado",
                    category: "Práctica",
                    description: "Aplicación en un proyecto real",
                    dependencies: ["Práctica Guiada"]
                },
                {
                    name: "Dominio Completo",
                    category: "Avanzado",
                    description: `Maestría en ${goal}`,
                    dependencies: ["Proyecto Aplicado"]
                }
            ]
        })
    };

    /**
     * Analiza una evidencia de aprendizaje según los criterios SMAE
     */
    static async analyzeEvidence(
        skillName: string,
        level: number,
        evidenceType: string,
        evidenceContent: string
    ) {
        // Modo mock para desarrollo
        if (USE_MOCK) {
            console.log('🎭 Using mock response for analyzeEvidence');
            return this.mockResponses.analyzeEvidence;
        }

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
        // Modo mock para desarrollo
        if (USE_MOCK) {
            console.log('🎭 Using mock response for generateMicroCurriculum');
            return this.mockResponses.generateMicroCurriculum;
        }

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

    /**
     * Genera un camino completo de aprendizaje (Grafo de Habilidades)
     */
    static async generatePath(goal: string) {
        // Modo mock para desarrollo
        if (USE_MOCK) {
            console.log('🎭 Using mock response for generatePath');
            return this.mockResponses.generatePath(goal);
        }

        const prompt = `
            Eres un arquitecto de aprendizaje experto. Tu misión es diseñar un Grafo de Habilidades para el objetivo: "${goal}".
            El grafo debe consistir en 4 a 7 habilidades (nombres cortos, máximo 3 palabras) organizadas de forma lógica con dependencias.

            REGLAS DEL GRAFO:
            1. Debe ser un Grafo Acíclico Dirigido (DAG).
            2. Debe haber al menos una habilidad inicial (sin dependencias).
            3. Debe haber una habilidad final (el "Hito" principal).
            4. Las categorías deben ser breves (ej: "Fundamentos", "Práctica", "Avanzado").

            Responde ÚNICAMENTE en formato JSON con esta estructura:
            {
                "nodes": [
                    {
                        "name": "string",
                        "category": "string",
                        "description": "explicación breve de 1 frase",
                        "dependencies": ["nombre_de_otra_skill_en_este_json"]
                    }
                ]
            }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleanText = text.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Error generating AI path:', error);
            throw new Error('Error al generar la ruta de aprendizaje');
        }
    }
}
