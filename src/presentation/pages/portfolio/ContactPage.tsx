import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Code2,
    ArrowLeft,
    Mail,
    Github,
    Linkedin,
    Twitter,
    MapPin,
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    Globe,
    Instagram,
    Youtube,
    Facebook
} from 'lucide-react';
import { config } from '../../../config';

// Map icon names to components
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

interface ProfileConfig {
    name?: string;
    email?: string;
}

interface AboutConfig {
    location?: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [profile, setProfile] = useState<ProfileConfig>({});
    const [about, setAbout] = useState<AboutConfig>({});

    useEffect(() => {
        // Fetch social links
        fetch(`${config.API_URL}/public/social-links`)
            .then(res => res.json())
            .then(data => setSocialLinks(data))
            .catch(console.error);

        // Fetch profile config
        fetch(`${config.API_URL}/public/config/profile`)
            .then(res => res.json())
            .then(data => setProfile(data || {}))
            .catch(console.error);

        // Fetch about config
        fetch(`${config.API_URL}/public/config/about`)
            .then(res => res.json())
            .then(data => setAbout(data || {}))
            .catch(console.error);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            const response = await fetch(`${config.API_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al enviar el mensaje');
            }

            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            setStatus('error');
            setErrorMsg(error instanceof Error ? error.message : 'Error al enviar el mensaje');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Navbar */}
            <nav className="px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Code2 className="text-slate-900" size={20} />
                    </div>
                    <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Fernando
                    </span>
                </Link>

                <div className="flex items-center gap-4 sm:gap-6">
                    <Link to="/" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Inicio
                    </Link>
                    <Link to="/projects" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Proyectos
                    </Link>
                    <Link to="/about" className="text-slate-400 hover:text-white text-sm font-medium hidden sm:block">
                        Sobre Mí
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
                    Contacto
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl">
                    ¿Tienes un proyecto en mente? ¡Hablemos!
                </p>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left - Contact Info */}
                    <div className="space-y-8">
                        <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
                            <h2 className="text-xl font-bold mb-6">Conectemos</h2>

                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Estoy disponible para proyectos freelance, colaboraciones o simplemente para charlar sobre tecnología.
                            </p>

                            {/* Location */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-700/30 rounded-xl">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                    <MapPin size={18} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Ubicación</p>
                                    <p className="font-medium">{about.location || 'Tu Ciudad, País'}</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                    <Mail size={18} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Email</p>
                                    <a href={`mailto:${profile.email || 'tu@email.com'}`} className="font-medium hover:text-emerald-400 transition-colors">
                                        {profile.email || 'tu@email.com'}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
                            <h3 className="text-lg font-bold mb-6">Redes Sociales</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {socialLinks.length > 0 ? (
                                    socialLinks.map((social) => {
                                        const IconComponent = iconMap[social.icon.toLowerCase()] || Globe;
                                        return (
                                            <a
                                                key={social.id}
                                                href={social.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors group"
                                            >
                                                <IconComponent size={20} />
                                                <span className="font-medium">{social.name}</span>
                                            </a>
                                        );
                                    })
                                ) : (
                                    <p className="text-slate-500 col-span-2 text-center py-4">
                                        No hay redes configuradas
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right - Contact Form */}
                    <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
                        <h2 className="text-xl font-bold mb-6">Envíame un mensaje</h2>

                        {status === 'success' ? (
                            <div className="text-center py-12">
                                <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">¡Mensaje enviado!</h3>
                                <p className="text-slate-400 mb-6">
                                    Gracias por contactarme. Te responderé lo antes posible.
                                </p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    Enviar otro mensaje
                                </button>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="Tu nombre"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="tu@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Asunto</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="¿Sobre qué quieres hablar?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Mensaje</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                        placeholder="Cuéntame sobre tu proyecto..."
                                    />
                                </div>

                                {status === 'error' && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                        <AlertCircle size={16} />
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            Enviar Mensaje
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
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
