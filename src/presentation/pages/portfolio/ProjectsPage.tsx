import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Code2,
    ArrowLeft,
    ExternalLink,
    Github,
    Filter,
    Loader2,
    FolderOpen
} from 'lucide-react';
import { config } from '../../../config';

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
}

export function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('Fernando');

    useEffect(() => {
        // Fetch projects from API
        fetch(`${config.API_URL}/public/projects`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProjects(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        // Fetch profile name
        fetch(`${config.API_URL}/public/config/profile`)
            .then(res => res.json())
            .then(data => setProfileName(data?.name || 'Fernando'))
            .catch(console.error);
    }, []);

    const allTechs = [...new Set(projects.flatMap(p => p.technologies))];

    const filteredProjects = filter
        ? projects.filter(p => p.technologies.includes(filter))
        : projects;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Navbar */}
            <nav className="px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Code2 className="text-slate-900" size={20} />
                    </div>
                    <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        {profileName}
                    </span>
                </Link>

                <div className="flex items-center gap-4 sm:gap-6">
                    <Link to="/" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Inicio
                    </Link>
                    <Link to="/about" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Sobre Mí
                    </Link>
                    <Link
                        to="/contact"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all border border-slate-700"
                    >
                        Contacto
                    </Link>
                </div>
            </nav>

            {/* Header */}
            <header className="max-w-7xl mx-auto px-6 pt-8 pb-12">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} />
                    Volver al Inicio
                </Link>

                <h1 className="text-4xl sm:text-5xl font-black mb-4">
                    Mis Proyectos
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl">
                    Una colección de proyectos que demuestran mis habilidades en diferentes tecnologías y áreas del desarrollo.
                </p>
            </header>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="text-emerald-500 animate-spin" />
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="max-w-7xl mx-auto px-6 py-12 text-center">
                    <FolderOpen size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">No hay proyectos para mostrar.</p>
                </div>
            )}

            {!loading && projects.length > 0 && (
                <>
                    {/* Filters */}
                    <section className="max-w-7xl mx-auto px-6 pb-8">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Filter size={14} />
                                Filtrar:
                            </div>
                            <button
                                onClick={() => setFilter(null)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === null
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                Todos
                            </button>
                            {allTechs.slice(0, 6).map((tech) => (
                                <button
                                    key={tech}
                                    onClick={() => setFilter(filter === tech ? null : tech)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === tech
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {tech}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Projects Grid */}
                    <section className="max-w-7xl mx-auto px-6 pb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="group p-6 sm:p-8 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-emerald-500/30 transition-all"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-2xl font-bold">{project.name}</h3>
                                                {project.featured && (
                                                    <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">Featured</span>
                                                )}
                                            </div>
                                            {project.subtitle && (
                                                <p className="text-slate-500">{project.subtitle}</p>
                                            )}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${project.status === 'live'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : project.status === 'archived'
                                                ? 'bg-slate-500/20 text-slate-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {project.status === 'live' ? 'En Vivo' : project.status === 'archived' ? 'Archivado' : 'En Desarrollo'}
                                        </div>
                                    </div>

                                    <p className="text-slate-400 mb-6 leading-relaxed">
                                        {project.description}
                                    </p>

                                    {/* Tech Tags */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {project.technologies.map((t) => (
                                            <span key={t} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Links */}
                                    <div className="flex gap-4">
                                        {project.projectUrl && project.status === 'live' ? (
                                            project.projectUrl.startsWith('/') ? (
                                                <Link
                                                    to={project.projectUrl}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-colors"
                                                >
                                                    Ver Demo
                                                    <ExternalLink size={14} />
                                                </Link>
                                            ) : (
                                                <a
                                                    href={project.projectUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-colors"
                                                >
                                                    Ver Demo
                                                    <ExternalLink size={14} />
                                                </a>
                                            )
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-400 rounded-xl font-medium text-sm cursor-not-allowed">
                                                Próximamente
                                            </span>
                                        )}
                                        {project.repoUrl && (
                                            <a
                                                href={project.repoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium text-sm transition-colors"
                                            >
                                                <Github size={14} />
                                                Código
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {/* Footer */}
            <footer className="py-8 border-t border-slate-800 text-center text-slate-600 text-sm">
                <p>&copy; 2026 {profileName} - Portfolio</p>
            </footer>
        </div>
    );
}
