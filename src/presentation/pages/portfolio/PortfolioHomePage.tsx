import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Code2,
    Briefcase,
    Github,
    Linkedin,
    Mail,
    ArrowRight,
    Sparkles,
    ExternalLink,
    Globe,
    Instagram,
    Youtube,
    Twitter,
    Facebook
} from 'lucide-react';
import { config } from '../../../config';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
    github: Github,
    linkedin: Linkedin,
    twitter: Twitter,
    mail: Mail,
    globe: Globe,
    instagram: Instagram,
    youtube: Youtube,
    facebook: Facebook
};

interface SocialLink {
    id: string;
    name: string;
    url: string;
    icon: string;
}

interface HeroConfig {
    title?: string;
    subtitle?: string;
    description?: string;
}

interface ProfileConfig {
    name?: string;
}

interface Project {
    id: string;
    name: string;
    subtitle: string | null;
    description: string;
    technologies: string[];
    projectUrl: string | null;
    status: string;
    featured: boolean;
}


const techStack = [
    { name: 'React', color: 'cyan' },
    { name: 'TypeScript', color: 'blue' },
    { name: 'Node.js', color: 'emerald' },
    { name: '.NET Core', color: 'violet' },
    { name: 'Three.js', color: 'orange' },
    { name: 'PostgreSQL', color: 'indigo' },
];

export function PortfolioHomePage() {
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [hero, setHero] = useState<HeroConfig>({});
    const [profile, setProfile] = useState<ProfileConfig>({});
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        fetch(`${config.API_URL}/public/social-links`)
            .then(res => res.json())
            .then(data => setSocialLinks(data))
            .catch(console.error);

        fetch(`${config.API_URL}/public/config/hero`)
            .then(res => res.json())
            .then(data => setHero(data || {}))
            .catch(console.error);

        fetch(`${config.API_URL}/public/config/profile`)
            .then(res => res.json())
            .then(data => setProfile(data || {}))
            .catch(console.error);

        // Fetch projects from API (featured only, limit 3)
        fetch(`${config.API_URL}/public/projects`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Show up to 3 projects (prioritize featured ones)
                    setProjects(data.slice(0, 3));
                }
            })
            .catch(console.error);
    }, []);

    const displayName = profile.name || 'Fernando';
    const displaySubtitle = hero.subtitle || 'Desarrollador Full Stack';
    const displayDescription = hero.description || 'Creo experiencias digitales con código limpio, diseño moderno y tecnologías de vanguardia.';

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Navbar */}
            <nav className="px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Code2 className="text-slate-900" size={20} />
                    </div>
                    <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        {displayName}
                    </span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    <Link to="/projects" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Proyectos
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

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Text Content */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <Sparkles size={12} />
                            {displaySubtitle}
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight">
                            Hola, soy{' '}
                            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                {displayName}
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-slate-400 max-w-xl mb-8 leading-relaxed">
                            {displayDescription}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/projects"
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-xl shadow-emerald-900/40"
                            >
                                Ver Proyectos
                                <ArrowRight size={18} />
                            </Link>
                            {socialLinks.find(l => l.icon.toLowerCase() === 'github') && (
                                <a
                                    href={socialLinks.find(l => l.icon.toLowerCase() === 'github')?.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
                                >
                                    <Github size={18} />
                                    GitHub
                                </a>
                            )}
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-4 mt-8 justify-center lg:justify-start">
                            {socialLinks.slice(0, 4).map((link) => {
                                const IconComponent = iconMap[link.icon.toLowerCase()] || Globe;
                                return (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors"
                                    >
                                        <IconComponent size={18} className="text-slate-400" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Profile Image Placeholder */}
                    <div className="relative">
                        <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center border border-slate-700">
                            <div className="text-center">
                                <Briefcase size={64} className="text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm">Foto aquí</p>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-2xl -z-10"></div>
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-500/10 rounded-2xl -z-10"></div>
                    </div>
                </div>
            </main>

            {/* Tech Stack */}
            <section className="py-12 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-slate-500 text-sm mb-6 uppercase tracking-widest">Tecnologías</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {techStack.map((tech) => (
                            <div
                                key={tech.name}
                                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm font-medium text-slate-300"
                            >
                                {tech.name}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Projects */}
            <section className="py-20 sm:py-32 max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black mb-4">
                        Proyectos Destacados
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Una selección de mis trabajos más recientes
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="group p-6 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-emerald-500/30 transition-all"
                        >
                            {/* Status Badge */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${project.status === 'live'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {project.status === 'live' ? 'En Vivo' : 'En Desarrollo'}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-1">{project.name}</h3>
                            <p className="text-sm text-slate-500 mb-3">{project.subtitle}</p>
                            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                {project.description}
                            </p>

                            {/* Tech Tags */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {project.technologies.slice(0, 3).map((t) => (
                                    <span key={t} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                                        {t}
                                    </span>
                                ))}
                            </div>

                            {/* Link */}
                            {project.projectUrl && project.status === 'live' ? (
                                project.projectUrl.startsWith('/') ? (
                                    <Link
                                        to={project.projectUrl}
                                        className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                                    >
                                        Ver Proyecto
                                        <ExternalLink size={14} />
                                    </Link>
                                ) : (
                                    <a
                                        href={project.projectUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                                    >
                                        Ver Proyecto
                                        <ExternalLink size={14} />
                                    </a>
                                )
                            ) : (
                                <span className="text-slate-500 text-sm">Próximamente...</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
                    >
                        Ver Todos los Proyectos
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 sm:py-12 border-t border-slate-800 text-center text-slate-600 text-sm">
                <p>&copy; 2026 Fernando - Portfolio</p>
            </footer>
        </div>
    );
}
