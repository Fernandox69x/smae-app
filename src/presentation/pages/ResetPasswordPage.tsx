import { useState, useEffect } from 'react';
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

/**
 * Página para restablecer contraseña con token
 */
export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Token de recuperación no encontrado');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el servidor');
            }

            setSuccess(true);

            // Redirigir al login después de 3 segundos
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
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
                    {!token ? (
                        /* Token inválido */
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Enlace inválido</h2>
                            <p className="text-slate-400 mb-6">
                                Este enlace de recuperación no es válido o ha expirado.
                            </p>
                            <Link
                                to="/forgot-password"
                                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                Solicitar nuevo enlace
                            </Link>
                        </div>
                    ) : success ? (
                        /* Éxito */
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h2>
                            <p className="text-slate-400 mb-6">
                                Tu contraseña ha sido cambiada correctamente. Serás redirigido al login...
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <ArrowLeft size={18} />
                                Ir al login ahora
                            </Link>
                        </div>
                    ) : (
                        /* Formulario */
                        <>
                            <h2 className="text-xl font-bold text-white mb-2">Nueva contraseña</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Ingresa tu nueva contraseña para tu cuenta.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Nueva Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="Mínimo 6 caracteres"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Confirmar Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="Repite la contraseña"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        'Cambiar contraseña'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
