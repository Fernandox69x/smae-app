import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Link2,
    Mail,
    Settings,
    FolderOpen,
    ArrowLeft,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    ExternalLink,
    Github,
    Star,
    StarOff,
    Eye,
    EyeOff
} from 'lucide-react';
import { config } from '../../../config';
import { useAuth } from '../../context/AuthContext';

interface Project {
    id: string;
    name: string;
    subtitle: string | null;
    description: string;
    imageUrl: string | null;
    projectUrl: string | null;
    repoUrl: string | null;
    technologies: string[];
    status: string;
    featured: boolean;
    order: number;
    isActive: boolean;
}

export function AdminProjects() {
    const { token } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        projectUrl: '',
        repoUrl: '',
        technologies: '',
        status: 'development',
        featured: false
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${config.API_URL}/admin/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setProjects(data);
        } catch (err) {
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = editingProject
            ? `${config.API_URL}/admin/projects/${editingProject.id}`
            : `${config.API_URL}/admin/projects`;

        const method = editingProject ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            setShowForm(false);
            setEditingProject(null);
            resetForm();
            fetchProjects();
        } catch (err) {
            console.error('Error saving project:', err);
        }
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            subtitle: project.subtitle || '',
            description: project.description,
            imageUrl: project.imageUrl || '',
            projectUrl: project.projectUrl || '',
            repoUrl: project.repoUrl || '',
            technologies: project.technologies.join(', '),
            status: project.status,
            featured: project.featured
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este proyecto?')) return;

        try {
            await fetch(`${config.API_URL}/admin/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchProjects();
        } catch (err) {
            console.error('Error deleting project:', err);
        }
    };

    const toggleFeatured = async (project: Project) => {
        try {
            await fetch(`${config.API_URL}/admin/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ featured: !project.featured })
            });
            fetchProjects();
        } catch (err) {
            console.error('Error updating project:', err);
        }
    };

    const toggleActive = async (project: Project) => {
        try {
            await fetch(`${config.API_URL}/admin/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !project.isActive })
            });
            fetchProjects();
        } catch (err) {
            console.error('Error updating project:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            subtitle: '',
            description: '',
            imageUrl: '',
            projectUrl: '',
            repoUrl: '',
            technologies: '',
            status: 'development',
            featured: false
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-4">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-emerald-400">Admin Panel</h1>
                </div>

                <nav className="space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link to="/admin/projects" className="flex items-center gap-3 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
                        <FolderOpen size={18} />
                        Proyectos
                    </Link>
                    <Link to="/admin/social-links" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Link2 size={18} />
                        Redes Sociales
                    </Link>
                    <Link to="/admin/contacts" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Mail size={18} />
                        Mensajes
                    </Link>
                    <Link to="/admin/config" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Settings size={18} />
                        Configuración
                    </Link>
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-white text-sm">
                        <ArrowLeft size={14} />
                        Volver al Portfolio
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Proyectos</h2>
                    <button
                        onClick={() => { setShowForm(true); setEditingProject(null); resetForm(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                    >
                        <Plus size={18} />
                        Nuevo Proyecto
                    </button>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold mb-6">
                                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Subtítulo</label>
                                        <input
                                            type="text"
                                            value={formData.subtitle}
                                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Descripción *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">URL del Proyecto</label>
                                        <input
                                            type="text"
                                            value={formData.projectUrl}
                                            onChange={e => setFormData({ ...formData, projectUrl: e.target.value })}
                                            placeholder="https://... o /ruta-interna"
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">URL del Repositorio</label>
                                        <input
                                            type="url"
                                            value={formData.repoUrl}
                                            onChange={e => setFormData({ ...formData, repoUrl: e.target.value })}
                                            placeholder="https://github.com/..."
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">URL de Imagen</label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tecnologías (separadas por coma)</label>
                                    <input
                                        type="text"
                                        value={formData.technologies}
                                        onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                                        placeholder="React, TypeScript, Node.js"
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Estado</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                        >
                                            <option value="development">En Desarrollo</option>
                                            <option value="live">En Vivo</option>
                                            <option value="archived">Archivado</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.featured}
                                                onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm">Proyecto Destacado</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                                    >
                                        {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); setEditingProject(null); }}
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Projects List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No hay proyectos. ¡Crea el primero!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={`p-6 bg-slate-800 border rounded-xl ${project.isActive ? 'border-slate-700' : 'border-slate-700/50 opacity-60'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold">{project.name}</h3>
                                            {project.featured && (
                                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                                    Destacado
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${project.status === 'live'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : project.status === 'archived'
                                                    ? 'bg-slate-500/20 text-slate-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {project.status === 'live' ? 'En Vivo' : project.status === 'archived' ? 'Archivado' : 'En Desarrollo'}
                                            </span>
                                        </div>
                                        {project.subtitle && (
                                            <p className="text-sm text-slate-400 mb-2">{project.subtitle}</p>
                                        )}
                                        <p className="text-slate-300 text-sm mb-3">{project.description}</p>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {project.technologies.map((tech, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-4 text-sm">
                                            {project.projectUrl && (
                                                <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                                                    <ExternalLink size={14} />
                                                    Ver Proyecto
                                                </a>
                                            )}
                                            {project.repoUrl && (
                                                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-white">
                                                    <Github size={14} />
                                                    Repositorio
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => toggleFeatured(project)}
                                            title={project.featured ? 'Quitar destacado' : 'Marcar como destacado'}
                                            className="p-2 text-amber-400 hover:bg-slate-700 rounded-lg"
                                        >
                                            {project.featured ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => toggleActive(project)}
                                            title={project.isActive ? 'Ocultar' : 'Mostrar'}
                                            className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg"
                                        >
                                            {project.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(project)}
                                            className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project.id)}
                                            className="p-2 text-red-400 hover:bg-slate-700 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
