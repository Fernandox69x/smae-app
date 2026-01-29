import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@presentation/context/AuthContext';
import { LandingPage } from '@presentation/pages/LandingPage';
import { DashboardPage } from '@presentation/pages/DashboardPage';
import { AuthPage } from '@presentation/pages/AuthPage';
import { ForgotPasswordPage } from '@presentation/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@presentation/pages/ResetPasswordPage';
import { Loader2 } from 'lucide-react';

/**
 * Contenedor con lógica de autenticación y rutas
 */
function AppRoutes() {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <Routes>
            {/* Landing Page (Pública) */}
            <Route path="/" element={<LandingPage />} />

            {/* Rutas de Autenticación */}
            <Route
                path="/login"
                element={
                    isAuthenticated
                        ? <Navigate to="/dashboard" replace />
                        : <AuthPage onSuccess={() => navigate('/dashboard')} />
                }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Dashboard (Protegida) */}
            <Route
                path="/dashboard"
                element={
                    isAuthenticated
                        ? <DashboardPage />
                        : <Navigate to="/login" replace />
                }
            />

            {/* Redirigir cualquier otra ruta a la Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

/**
 * App raíz con providers
 */
export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
