import { useState } from 'react';
import { Upload, Play, Mic, Camera, FileText } from 'lucide-react';
import { LEVELS } from '@domain/constants/levels';
import { useSelectedSkill, useSkills } from '../../hooks/useSkills';
import { EvidenceType } from '@domain/types';

interface EvidenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (evidence: string) => void;
}

const EVIDENCE_ICONS: Record<EvidenceType, React.ReactNode> = {
    Video: <Play size={14} />,
    Audio: <Mic size={14} />,
    Imagen: <Camera size={14} />,
    Texto: <FileText size={14} />,
};

/**
 * Modal para registrar evidencia de validación
 */
export function EvidenceModal({ isOpen, onClose, onConfirm }: EvidenceModalProps) {
    const [evidenceText, setEvidenceText] = useState('');
    const { selectedSkill } = useSelectedSkill();
    const { levelUpSkill } = useSkills();

    if (!isOpen || !selectedSkill) return null;

    const nextLevel = LEVELS[selectedSkill.level + 1];

    const handleConfirm = () => {
        if (!evidenceText.trim()) {
            alert('La evidencia es obligatoria según la metodología.');
            return;
        }

        const result = levelUpSkill(selectedSkill.id);

        if (result.success) {
            onConfirm(evidenceText);
            setEvidenceText('');
        } else if (result.error) {
            alert(result.error);
        }
    };

    const handleClose = () => {
        setEvidenceText('');
        onClose();
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Validación Requerida</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Para pasar al nivel <strong>{nextLevel?.label}</strong>, la metodología exige un
                    registro tangible.
                </p>

                <div className="space-y-4 mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase">
                        Bitácora / Notas del Intento
                    </label>
                    <textarea
                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="Describe qué hiciste, qué falló o adjunta enlaces a tu video/foto..."
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(Object.keys(EVIDENCE_ICONS) as EvidenceType[]).map((type) => (
                        <button
                            key={type}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded hover:bg-slate-700 text-xs text-slate-300 border border-slate-700"
                        >
                            {EVIDENCE_ICONS[type]}
                            {type}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <Upload size={18} />
                        Registrar y Subir Nivel
                    </button>
                </div>
            </div>
        </div>
    );
}
