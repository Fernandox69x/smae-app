import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@presentation/context/AuthContext';
import { Loader2 } from 'lucide-react';

// Portfolio Pages
import { PortfolioHomePage, ProjectsPage, AboutPage, ContactPage } from '@presentation/pages/portfolio';

// Admin Pages
import { AdminDashboard, AdminSocialLinks, AdminContacts, AdminConfig, AdminProjects } from '@presentation/pages/admin';

// FlowControl Pages
import FlowControlDashboard from '@presentation/pages/flowcontrol/FlowControlDashboard';
import AccountsPage from '@presentation/pages/flowcontrol/AccountsPage';
import TransactionsPage from '@presentation/pages/flowcontrol/TransactionsPage';
import ReceivablesPage from './presentation/pages/flowcontrol/ReceivablesPage';
import CategoriesPage from './presentation/pages/flowcontrol/CategoriesPage';
import LoansPage from './presentation/pages/flowcontrol/LoansPage';
import LoanDetailsPage from './presentation/pages/flowcontrol/LoanDetailsPage';
import RecurringTransactionsPage from './presentation/pages/flowcontrol/RecurringTransactionsPage';

// SMAE Pages
import { LandingPage } from '@presentation/pages/LandingPage';
import { DashboardPage } from '@presentation/pages/DashboardPage';
import { AuthPage } from '@presentation/pages/AuthPage';
import { ForgotPasswordPage } from '@presentation/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@presentation/pages/ResetPasswordPage';

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
            {/* ===================== */}
            {/* PORTFOLIO ROUTES      */}
            {/* ===================== */}
            <Route path="/" element={<PortfolioHomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ===================== */}
            {/* ADMIN ROUTES          */}
            {/* ===================== */}
            <Route
                path="/admin"
                element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/admin/social-links"
                element={isAuthenticated ? <AdminSocialLinks /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/admin/contacts"
                element={isAuthenticated ? <AdminContacts /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/admin/config"
                element={isAuthenticated ? <AdminConfig /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/admin/projects"
                element={isAuthenticated ? <AdminProjects /> : <Navigate to="/smae/login" replace />}
            />

            {/* ===================== */}
            {/* FLOWCONTROL ROUTES    */}
            {/* ===================== */}
            <Route
                path="/flowcontrol"
                element={isAuthenticated ? <FlowControlDashboard /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/flowcontrol/accounts"
                element={isAuthenticated ? <AccountsPage /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/flowcontrol/transactions"
                element={isAuthenticated ? <TransactionsPage /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/flowcontrol/receivables"
                element={isAuthenticated ? <ReceivablesPage /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/flowcontrol/categories"
                element={isAuthenticated ? <CategoriesPage /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/flowcontrol/loans"
                element={isAuthenticated ? <LoansPage /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/flowcontrol/loans/:id"
                element={isAuthenticated ? <LoanDetailsPage /> : <Navigate to="/smae/login" replace />}
            />
            <Route
                path="/flowcontrol/recurring"
                element={isAuthenticated ? <RecurringTransactionsPage /> : <Navigate to="/smae/login" replace />}
            />

            {/* ===================== */}
            {/* SMAE APP ROUTES       */}
            {/* ===================== */}
            {/* SMAE Landing */}
            <Route path="/smae" element={<LandingPage />} />

            {/* SMAE Auth */}
            <Route
                path="/smae/login"
                element={
                    isAuthenticated
                        ? <Navigate to="/smae/dashboard" replace />
                        : <AuthPage onSuccess={() => navigate('/smae/dashboard')} />
                }
            />
            <Route path="/smae/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/smae/reset-password" element={<ResetPasswordPage />} />

            {/* SMAE Dashboard (Protected) */}
            <Route
                path="/smae/dashboard"
                element={
                    isAuthenticated
                        ? <DashboardPage />
                        : <Navigate to="/smae/login" replace />
                }
            />

            {/* Legacy redirects - old routes redirect to new SMAE routes */}
            <Route path="/login" element={<Navigate to="/smae/login" replace />} />
            <Route path="/dashboard" element={<Navigate to="/smae/dashboard" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/smae/forgot-password" replace />} />
            <Route path="/reset-password" element={<Navigate to="/smae/reset-password" replace />} />

            {/* Fallback - redirect to portfolio home */}
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
