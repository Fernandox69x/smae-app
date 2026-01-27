import { useState } from 'react';
import { AuthProvider, useAuth } from '@presentation/context/AuthContext';
import { SkillProvider, useSkillContext } from '@presentation/context/SkillContext';
import { Header } from '@presentation/components/Header';
import { SkillGraph } from '@presentation/components/SkillGraph/SkillGraph';
import { SkillSidebar } from '@presentation/components/Sidebar/SkillSidebar';
import { EvidenceModal } from '@presentation/components/Modal/EvidenceModal';
import { SkillFormModal } from '@presentation/components/Modal/SkillFormModal';
import { AuthPage } from '@presentation/pages/AuthPage';
import { Loader2, LogOut, User } from 'lucide-react';

/**
 * Componente principal de la app (autenticado)
 */
function MainApp() {
    const { isLoading, selectedSkillId, skills } = useSkillContext();
    const { user, logout } = useAuth();
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [showSkillFormModal, setShowSkillFormModal] = useState(false);
    const [editingSkill, setEditingSkill] = useState<{
        id: string;
        name: string;
        category: string;
        x: number;
        y: number;
        requirements: string[];
    } | null>(null);

    const handleLevelUpClick = () => {
        setShowEvidenceModal(true);
    };

    const handleEvidenceConfirm = () => {
        setShowEvidenceModal(false);
    };

    const handleNewSkillClick = () => {
        setEditingSkill(null);
        setShowSkillFormModal(true);
    };

    const handleEditClick = () => {
        const skill = skills.find(s => s.id === selectedSkillId);
        if (skill) {
            setEditingSkill({
                id: skill.id,
                name: skill.name,
                category: skill.category,
                x: skill.x,
                y: skill.y,
                requirements: skill.requirements,
            });
            setShowSkillFormModal(true);
        }
    };

    const handleFormClose = () => {
        setShowSkillFormModal(false);
        setEditingSkill(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    <p className="text-slate-400">Cargando tus skills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col overflow-hidden">
            {/* Header con info de usuario */}
            <header className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center z-20">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Proyecto S.M.A.E.
                    </h1>
                    <p className="text-slate-400 text-xs">Sistema de Maestría y Aprendizaje Efectivo</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Usuario */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User size={16} />
                        {user?.name || user?.email}
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut size={16} />
                    </button>

                    <Header onNewSkillClick={handleNewSkillClick} />
                </div>
            </header>

            <div className="flex flex-1 relative overflow-hidden">
                <SkillGraph />
                <SkillSidebar
                    onLevelUpClick={handleLevelUpClick}
                    onEditClick={handleEditClick}
                />
            </div>

            <EvidenceModal
                isOpen={showEvidenceModal}
                onClose={() => setShowEvidenceModal(false)}
                onConfirm={handleEvidenceConfirm}
            />

            <SkillFormModal
                isOpen={showSkillFormModal}
                onClose={handleFormClose}
                editingSkill={editingSkill}
            />
        </div>
    );
}

/**
 * Contenedor con lógica de autenticación
 */
function AppWithAuth() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage onSuccess={() => window.location.reload()} />;
    }

    return (
        <SkillProvider>
            <MainApp />
        </SkillProvider>
    );
}

/**
 * App raíz con providers
 */
export default function App() {
    return (
        <AuthProvider>
            <AppWithAuth />
        </AuthProvider>
    );
}
