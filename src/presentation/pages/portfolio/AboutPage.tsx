import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Code2,
    ArrowLeft,
    Briefcase,
    GraduationCap,
    Award,
    Coffee
} from 'lucide-react';
import { config } from '../../../config';

interface ProfileConfig {
    name?: string;
}

interface AboutConfig {
    bio?: string;
    location?: string;
}

const skills = [
    { category: 'Frontend', items: ['React', 'TypeScript', 'Tailwind CSS', 'Three.js'] },
    { category: 'Backend', items: ['Node.js', '.NET Core', 'Express', 'C#'] },
    { category: 'Databases', items: ['PostgreSQL', 'SQL Server', 'Prisma', 'MongoDB'] },
    { category: 'Tools', items: ['Git', 'Docker', 'Azure', 'VS Code'] },
];

const experience = [
    {
        title: 'Desarrollador Full Stack',
        company: 'Tu Empresa',
        period: '2024 - Presente',
        description: 'Desarrollo de aplicaciones web modernas con React y Node.js.'
    },
    // Add more experience items here
];

export function AboutPage() {
    const [profile, setProfile] = useState<ProfileConfig>({});
    const [about, setAbout] = useState<AboutConfig>({});

    useEffect(() => {
        fetch(`${config.API_URL}/public/config/profile`)
            .then(res => res.json())
            .then(data => setProfile(data || {}))
            .catch(console.error);

        fetch(`${config.API_URL}/public/config/about`)
            .then(res => res.json())
            .then(data => setAbout(data || {}))
            .catch(console.error);
    }, []);

    const displayName = profile.name || 'Fernando';
    const displayBio = about.bio || 'Soy un desarrollador apasionado por crear soluciones tecnológicas que impacten positivamente. Me especializo en desarrollo web full stack, combinando experiencia tanto en frontend como en backend.';
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Navbar */}
            <nav className="px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Code2 className="text-slate-900" size={20} />
                    </div>
                    <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        {displayName}
                    </span>
                </Link>

                <div className="flex items-center gap-4 sm:gap-6">
                    <Link to="/" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Inicio
                    </Link>
                    <Link to="/projects" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Proyectos
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
                    Sobre Mí
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl">
                    Conoce más sobre mi trayectoria, habilidades y pasión por el desarrollo.
                </p>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column - Bio */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Bio Section */}
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-slate-700">
                                    <Briefcase size={32} className="text-slate-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{displayName}</h2>
                                    <p className="text-emerald-400">Desarrollador Full Stack</p>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    {displayBio}
                                </p>
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <GraduationCap size={20} className="text-emerald-400" />
                                Experiencia
                            </h3>

                            <div className="space-y-6">
                                {experience.map((exp, i) => (
                                    <div key={i} className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold">{exp.title}</h4>
                                            <span className="text-sm text-slate-500">{exp.period}</span>
                                        </div>
                                        <p className="text-emerald-400 text-sm mb-2">{exp.company}</p>
                                        <p className="text-slate-400 text-sm">{exp.description}</p>
                                    </div>
                                ))}

                                <div className="p-6 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl text-center">
                                    <p className="text-slate-500 text-sm">
                                        + Añade más experiencia aquí
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Skills */}
                    <div className="space-y-8">
                        {/* Skills Section */}
                        <section className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Award size={18} className="text-emerald-400" />
                                Habilidades
                            </h3>

                            <div className="space-y-6">
                                {skills.map((skillGroup) => (
                                    <div key={skillGroup.category}>
                                        <p className="text-sm text-slate-500 mb-2">{skillGroup.category}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {skillGroup.items.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Fun Facts */}
                        <section className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Coffee size={18} className="text-emerald-400" />
                                Fun Facts
                            </h3>

                            <ul className="space-y-3 text-sm text-slate-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    X tazas de café al día
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    Y proyectos completados
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    Z años de experiencia
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 border-t border-slate-800 text-center text-slate-600 text-sm">
                <p>&copy; 2026 Fernando - Portfolio</p>
            </footer>
        </div>
    );
}
