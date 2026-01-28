import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

/**
 * Página para solicitar recuperación de contraseña
 */
export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el servidor');
            }

            setSent(true);
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
                    {sent ? (
                        /* Mensaje de éxito */
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">¡Revisa tu correo!</h2>
                            <p className="text-slate-400 mb-6">
                                Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <ArrowLeft size={18} />
                                Volver al login
                            </Link>
                        </div>
                    ) : (
                        /* Formulario */
                        <>
                            <h2 className="text-xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Ingresa tu email y te enviaremos un enlace para restablecerla.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
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

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        'Enviar enlace'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Volver al login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
