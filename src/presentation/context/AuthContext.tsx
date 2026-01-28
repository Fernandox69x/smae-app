import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { config } from '../../config';

const API_BASE_URL = config.API_URL;

interface User {
    id: string;
    email: string;
    name: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Provider de autenticación
 * Maneja login, registro, logout y persistencia del token
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('smae_token'));
    const [isLoading, setIsLoading] = useState(true);

    // Verificar token al cargar
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    // Token inválido, limpiar
                    localStorage.removeItem('smae_token');
                    setToken(null);
                }
            } catch {
                localStorage.removeItem('smae_token');
                setToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Error al iniciar sesión' };
            }

            localStorage.setItem('smae_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        } catch {
            return { success: false, error: 'Error de conexión' };
        }
    }, []);

    const register = useCallback(async (email: string, password: string, name?: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Error al registrarse' };
            }

            localStorage.setItem('smae_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        } catch {
            return { success: false, error: 'Error de conexión' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('smae_token');
        setToken(null);
        setUser(null);
    }, []);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook para consumir el contexto de Auth
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }

    return context;
}

/**
 * Obtener el token actual desde localStorage
 */
export function getAuthToken(): string | null {
    return localStorage.getItem('smae_token');
}
