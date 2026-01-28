/**
 * Configuración de la aplicación
 * Lee variables de entorno en producción
 */
export const config = {
    /**
     * URL base del API backend
     * En desarrollo: http://localhost:3001/api
     * En producción: se configura con VITE_API_URL
     */
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
};
