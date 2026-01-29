import { Link } from 'react-router-dom';
import { useAuth } from '@presentation/context/AuthContext';
import {
    Zap,
    ShieldCheck,
    Clock,
    BrainCircuit,
    ArrowRight,
    LayoutDashboard,
    CheckCircle2,
    Target
} from 'lucide-react';

export function LandingPage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Navbar */}
            <nav className="px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/20">
                        <Target className="text-slate-900" size={20} />
                    </div>
                    <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        S.M.A.E.
                    </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-base font-bold transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <LayoutDashboard size={16} />
                            <span className="hidden xs:inline">Dashboard</span>
                            <span className="xs:hidden">Entrar</span>
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-slate-400 hover:text-white text-xs sm:text-sm font-medium px-2 sm:px-4">
                                Login
                            </Link>
                            <Link
                                to="/login"
                                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-base font-bold transition-all border border-slate-700"
                            >
                                Empezar
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-12 sm:pt-20 pb-20 sm:pb-32 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 sm:mb-8 animate-bounce">
                    <Zap size={12} fill="currentColor" />
                    v2.0 con IA Mentor
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight max-w-4xl">
                    Domina habilidades <br className="hidden sm:block" />
                    <span className="text-emerald-400">Sin Autoengaño</span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mb-8 sm:mb-12 leading-relaxed">
                    SMAE es el Sistema de Maestría diseñado para destruir el autoengaño mediante evidencias obligatorias e IA Mentor.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12 sm:mb-20 w-full max-w-xs sm:max-w-md">
                    <Link
                        to="/login"
                        className="flex-1 px-6 py-3 sm:px-8 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-xl shadow-emerald-900/40"
                    >
                        Comenzar mi Grafo
                        <ArrowRight size={18} />
                    </Link>
                </div>

                {/* Dashboard Preview Mockup */}
                <div className="relative w-full max-w-5xl aspect-video bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-700 shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-60"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-8 text-slate-500 flex flex-col items-center">
                            <LayoutDashboard size={48} className="sm:size-80 mb-4 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                            <p className="text-[10px] sm:text-sm font-mono uppercase tracking-[0.3em]">Vista previa del Grafo</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-slate-950 py-20 sm:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                        {/* Feature 1 */}
                        <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-emerald-500/30 transition-all group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <ShieldCheck className="text-emerald-400" size={24} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-4">Anti-Autoengaño</h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                No puedes subir de nivel solo haciendo clic. Debes proporcionar evidencia textual verificable.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-indigo-500/30 transition-all group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <BrainCircuit className="text-indigo-400" size={24} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-4">Mentoría con IA</h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                Gemini Pro analiza tus evidencias y te da feedback honesto. Si fallas, genera rutas de refuerzo.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-cyan-500/30 transition-all group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <Clock className="text-cyan-400" size={24} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-4">Consolidación</h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                El nivel Maestro requiere 48 horas de espera. La memoria a largo plazo no se negocia.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Methodology Section */}
            <section className="py-20 sm:py-32 max-w-5xl mx-auto px-6">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-center mb-12 sm:mb-16 italic">
                    "Si no puedes explicarlo, <br /> no lo has aprendido."
                </h2>

                <div className="space-y-8 sm:space-y-12">
                    {[
                        { level: 'L1', title: 'El Mapa', desc: 'Concepto base explicado con tus propias palabras.' },
                        { level: 'L2', title: 'La Sombra', desc: 'Aplicación guiada o mediante tutorial integral.' },
                        { level: 'L3', title: 'Prueba Fría', desc: 'Resolución de problemas sin ayuda externa.' },
                        { level: 'L4', title: 'Consolidación', desc: '48h después: transferencia de conocimiento.' },
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-4 sm:gap-6 group">
                            <div className="text-2xl sm:text-4xl font-black text-slate-800 group-hover:text-emerald-500/20 transition-colors">
                                {step.level}
                            </div>
                            <div className="flex-1 pt-1 border-l-2 border-slate-800 pl-4 sm:pl-8 group-hover:border-emerald-500/30 transition-colors">
                                <h4 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    {step.title}
                                </h4>
                                <p className="text-slate-400 text-sm">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 sm:mt-20 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 text-sm sm:text-base"
                    >
                        Dejar de autoengañarme
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 sm:py-12 border-t border-slate-800 text-center text-slate-600 text-[10px] sm:text-sm">
                <p>&copy; 2026 S.M.A.E. v2.0 - Sistema Maestro Anti-Autoengaño</p>
            </footer>
        </div>
    );
}
