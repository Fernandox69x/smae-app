import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@presentation/context/AuthContext';
import { useSkillContext, SkillProvider } from '@presentation/context/SkillContext';
import { Header } from '@presentation/components/Header';
import { SkillGraph } from '@presentation/components/SkillGraph/SkillGraph';
import { SkillSidebar } from '@presentation/components/Sidebar/SkillSidebar';
import { AiPathModal } from '@presentation/components/Modal/AiPathModal';
import { EvidenceModal } from '@presentation/components/Modal/EvidenceModal';
import { SkillFormModal } from '@presentation/components/Modal/SkillFormModal';
import { Loader2, LogOut, User as UserIcon } from 'lucide-react';

/**
 * Contenido principal del Dashboard (Grafo y gestión de habilidades)
 */
function DashboardContent() {
    const { user, logout } = useAuth();
    const { skills, isLoading, refreshSkills, selectSkill, selectedSkillId } = useSkillContext();
    const navigate = useNavigate();

    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [showSkillFormModal, setShowSkillFormModal] = useState(false);
    const [showAiPathModal, setShowAiPathModal] = useState(false);

    const [editingSkill, setEditingSkill] = useState<{
        id: string;
        name: string;
        category: string;
        x: number;
        y: number;
        requirements: string[];
    } | null>(null);

    useEffect(() => {
        refreshSkills();
    }, []);

    const handleNewSkillClick = () => {
        setEditingSkill(null);
        setShowSkillFormModal(true);
    };

    const handleEditClick = (skill?: any) => {
        const targetSkill = skill || skills.find(s => s.id === selectedSkillId);
        if (targetSkill) {
            setEditingSkill({
                id: targetSkill.id,
                name: targetSkill.name,
                category: targetSkill.category,
                x: targetSkill.x,
                y: targetSkill.y,
                requirements: targetSkill.requirements || []
            });
            setShowSkillFormModal(true);
        }
    };

    const handleLevelUpClick = () => {
        setShowEvidenceModal(true);
    };

    const handleCloseSidebar = () => {
        selectSkill(null);
    };

    if (isLoading && !skills.length) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-slate-400 font-medium tracking-tight">Cargando tu universo de aprendizaje...</p>
                </div>
            </div>
        );
    }

    const { error: contextError } = useSkillContext();

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden">
            {/* Header unificado */}
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-20">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => navigate('/')}
                >
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-black text-xl group-hover:scale-110 transition-transform">
                        S
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tighter">
                        SMAE<span className="text-emerald-500">.</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    {/* Perfil (Solo Desktop) */}
                    <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <UserIcon size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">
                            {user?.name || user?.email?.split('@')[0]}
                        </span>
                    </div>

                    <Header
                        onNewSkillClick={handleNewSkillClick}
                        onAiPathClick={() => setShowAiPathModal(true)}
                    />

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 relative overflow-hidden">
                {/* Grafo Principal */}
                <main className="flex-1 relative flex bg-slate-900">
                    {contextError ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                                <LogOut size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Error de Conexión</h3>
                            <p className="text-slate-400 max-w-xs mb-6">{contextError}</p>
                            <button
                                onClick={() => refreshSkills()}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : skills.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 animate-pulse">
                                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 font-black text-2xl">S</div>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Tu universo está vacío</h3>
                            <p className="text-slate-400 max-w-sm mb-8 italic">"El primer paso para la maestría es definir tu primera habilidad."</p>
                            <button
                                onClick={handleNewSkillClick}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-900/20"
                            >
                                Crear mi primera Skill
                            </button>
                        </div>
                    ) : (
                        <SkillGraph />
                    )}
                </main>

                {/* Sidebar Responsivo */}
                <SkillSidebar
                    onLevelUpClick={handleLevelUpClick}
                    onEditClick={() => handleEditClick()}
                    onClose={handleCloseSidebar}
                />
            </div>

            {/* Modales */}
            <EvidenceModal
                isOpen={showEvidenceModal}
                onClose={() => setShowEvidenceModal(false)}
                onConfirm={(_evidence) => setShowEvidenceModal(false)}
            />

            <SkillFormModal
                isOpen={showSkillFormModal}
                onClose={() => setShowSkillFormModal(false)}
                editingSkill={editingSkill}
            />

            <AiPathModal
                isOpen={showAiPathModal}
                onClose={() => setShowAiPathModal(false)}
            />
        </div>
    );
}

/**
 * Página del Dashboard que provee el contexto de habilidades
 */
export function DashboardPage() {
    return (
        <SkillProvider>
            <DashboardContent />
        </SkillProvider>
    );
}
