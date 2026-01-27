import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

interface AuthPageProps {
    onSuccess: () => void;
}

/**
 * Página de autenticación (Login/Registro combinados)
 */
export function AuthPage({ onSuccess }: AuthPageProps) {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = isLogin
                ? await login(email, password)
                : await register(email, password, name || undefined);

            if (result.success) {
                onSuccess();
            } else {
                setError(result.error || 'Error desconocido');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        S.M.A.E.
                    </h1>
                    <p className="text-slate-400 mt-2">Sistema de Maestría y Aprendizaje Efectivo</p>
                </div>

                {/* Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">
                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nombre (solo registro) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    Nombre (opcional)
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    {isLogin ? 'Entrar' : 'Registrarse'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                        >
                            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
