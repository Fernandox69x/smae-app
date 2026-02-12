import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@presentation/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
import ShoppingListPage from './presentation/pages/flowcontrol/ShoppingListPage';

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
    const location = useLocation();

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
                element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/admin/social-links"
                element={isAuthenticated ? <AdminSocialLinks /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/admin/contacts"
                element={isAuthenticated ? <AdminContacts /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/admin/config"
                element={isAuthenticated ? <AdminConfig /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/admin/projects"
                element={isAuthenticated ? <AdminProjects /> : <Navigate to="/login" replace state={{ from: location }} />}
            />

            {/* ===================== */}
            {/* FLOWCONTROL ROUTES    */}
            {/* ===================== */}
            <Route
                path="/flowcontrol"
                element={isAuthenticated ? <FlowControlDashboard /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/accounts"
                element={isAuthenticated ? <AccountsPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/transactions"
                element={isAuthenticated ? <TransactionsPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/receivables"
                element={isAuthenticated ? <ReceivablesPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/categories"
                element={isAuthenticated ? <CategoriesPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/loans"
                element={isAuthenticated ? <LoansPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/loans/:id"
                element={isAuthenticated ? <LoanDetailsPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/recurring"
                element={isAuthenticated ? <RecurringTransactionsPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />
            <Route
                path="/flowcontrol/shopping"
                element={isAuthenticated ? <ShoppingListPage /> : <Navigate to="/login" replace state={{ from: location }} />}
            />

            {/* ===================== */}
            {/* devMastery APP ROUTES (Old SMAE) */}
            {/* ===================== */}
            <Route path="/mastery" element={<LandingPage />} />
            <Route path="/smae" element={<Navigate to="/mastery" replace />} />

            {/* Unified Auth */}
            <Route
                path="/login"
                element={
                    isAuthenticated
                        ? <Navigate to={location.state?.from?.pathname || "/mastery/dashboard"} replace />
                        : <AuthPage onSuccess={() => navigate(location.state?.from?.pathname || '/mastery/dashboard')} />
                }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* mastery Dashboard (Protected) */}
            <Route
                path="/mastery/dashboard"
                element={
                    isAuthenticated
                        ? <DashboardPage />
                        : <Navigate to="/login" replace state={{ from: location }} />
                }
            />
            <Route path="/smae/dashboard" element={<Navigate to="/mastery/dashboard" replace />} />

            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/mastery/dashboard" replace />} />

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
                <SpeedInsights />
            </AuthProvider>
        </BrowserRouter>
    );
}
