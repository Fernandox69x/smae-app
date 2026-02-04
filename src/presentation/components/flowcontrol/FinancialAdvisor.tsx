import { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, ShoppingBag, CreditCard, DollarSign } from 'lucide-react';
import { config } from '../../../config';

interface AdviceResponse {
    summary: string;
    analysis: {
        spending: string;
        debt: string;
        shopping: string;
    };
    recommendations: {
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
    }[];
    alert: string | null;
}

export default function FinancialAdvisor() {
    const [advice, setAdvice] = useState<AdviceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const fetchAdvice = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/flowcontrol/ai-advice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al consultar al asesor');

            const data = await response.json();
            setAdvice(data);
        } catch (err) {
            setError('El asesor está ocupado. Intenta de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group hover:shadow-violet-500/25 transition-all cursor-pointer" onClick={() => { setIsOpen(true); fetchAdvice(); }}>
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                        <Brain size={32} className="text-white animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Asesor Financiero IA</h3>
                        <p className="text-violet-100/80 text-sm">Análisis inteligente de tus finanzas y consejos personalizados.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-900/50 to-indigo-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Brain className="text-violet-400" size={24} />
                    <h3 className="font-bold text-white text-lg">Reporte Financiero Inteligente</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors text-sm">
                    Cerrar
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="animate-spin text-violet-500 mx-auto mb-4" size={40} />
                        <p className="text-slate-300">Analizando tus transacciones, deudas y despensa...</p>
                        <p className="text-slate-500 text-sm mt-2">Consultando con Gemini AI</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-400">
                        <AlertTriangle className="mx-auto mb-2" size={32} />
                        <p>{error}</p>
                        <button onClick={fetchAdvice} className="mt-4 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white text-sm">
                            Reintentar
                        </button>
                    </div>
                ) : advice ? (
                    <div className="space-y-6">
                        {/* Summary & Alert */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <p className="text-lg text-slate-200 font-medium leading-relaxed">
                                "{advice.summary}"
                            </p>
                            {advice.alert && (
                                <div className="mt-4 flex items-start gap-3 bg-red-500/10 p-3 rounded border border-red-500/20">
                                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                                    <p className="text-red-200 text-sm">{advice.alert}</p>
                                </div>
                            )}
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                    <TrendingUp size={18} />
                                    <h4 className="font-semibold text-sm uppercase tracking-wider">Flujo & Gastos</h4>
                                </div>
                                <p className="text-slate-300 text-sm">{advice.analysis.spending}</p>
                            </div>
                            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-2 text-rose-400">
                                    <CreditCard size={18} />
                                    <h4 className="font-semibold text-sm uppercase tracking-wider">Deudas</h4>
                                </div>
                                <p className="text-slate-300 text-sm">{advice.analysis.debt}</p>
                            </div>
                            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-2 text-amber-400">
                                    <ShoppingBag size={18} />
                                    <h4 className="font-semibold text-sm uppercase tracking-wider">Despensa</h4>
                                </div>
                                <p className="text-slate-300 text-sm">{advice.analysis.shopping}</p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <h4 className="flex items-center gap-2 text-white font-semibold mb-4">
                                <CheckCircle className="text-violet-400" size={20} />
                                Acciones Recomendadas
                            </h4>
                            <div className="space-y-3">
                                {advice.recommendations.map((rec, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-slate-700/20 rounded-lg hover:bg-slate-700/40 transition-colors border border-slate-700/30">
                                        <div className={`w-1.5 rounded-full shrink-0 ${rec.priority === 'high' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                            rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                        <div>
                                            <h5 className="text-white font-medium mb-1">{rec.title}</h5>
                                            <p className="text-slate-400 text-sm">{rec.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Footer */}
            {advice && (
                <div className="bg-slate-900/30 p-3 px-6 text-center border-t border-slate-700">
                    <button onClick={fetchAdvice} className="text-violet-400 hover:text-violet-300 text-xs font-medium flex items-center justify-center gap-2 w-full transition-colors">
                        <RefreshCw size={12} />
                        Actualizar análisis
                    </button>
                </div>
            )}
        </div>
    );
}
