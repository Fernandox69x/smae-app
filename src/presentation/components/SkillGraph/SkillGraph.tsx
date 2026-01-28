import { useState, useRef, useEffect, useMemo } from 'react';
import { useSkills } from '../../hooks/useSkills';
import { useSkillContext } from '../../context/SkillContext';
import { SkillNode } from './SkillNode';
import { layoutService } from '../../../application/services/LayoutService';

/**
 * Componente del grafo de skills (DAG)
 * Muestra las conexiones y nodos de habilidades con layout automático y panning
 */
export function SkillGraph() {
    const { skills } = useSkills();
    const { getRequirementsInfo } = useSkillContext();

    // Layout automático
    const positionedSkills = useMemo(() => {
        return layoutService.calculateLayout([...skills]);
    }, [skills]);

    // Estado para el Panning
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Centrar el grafo al inicio
    useEffect(() => {
        if (containerRef.current) {
            const { clientWidth } = containerRef.current;
            setOffset({ x: clientWidth / 2, y: 100 });
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Solo click izquierdo
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;

        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Estilo del contenedor transformado
    const graphStyle = {
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 relative bg-slate-900 overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Grid Background que se mueve con el offset */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '100px 100px',
                    transform: `translate(${offset.x % 100}px, ${offset.y % 100}px)`,
                }}
            />

            <div className="absolute inset-0" style={graphStyle}>
                {/* SVG CONNECTIONS */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0">
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" opacity="0.5" />
                        </marker>
                    </defs>

                    {positionedSkills.map((skill) =>
                        skill.requirements.map((reqId) => {
                            const parent = positionedSkills.find(s => s.id === reqId);
                            if (!parent) return null;

                            // Usar currentLevel si existe, sino level
                            const parentLevel = (parent as any).currentLevel ?? parent.level;
                            const childLevel = (skill as any).currentLevel ?? skill.level;
                            const isParentReinforcement = (parent as any).isReinforcement ?? false;

                            // Estados de la dependencia
                            const parentCompleted = parentLevel >= 4; // Padre en maestría
                            const parentInProgress = parentLevel >= 1 && parentLevel < 4;
                            const childStarted = childLevel >= 1;

                            // Colores según estado
                            let lineStroke = '#475569'; // Gris por defecto (bloqueado)
                            let strokeOpacity = 0.2;
                            let strokeDash = '5,5';

                            if (isParentReinforcement) {
                                lineStroke = parentCompleted ? '#ef4444' : '#f87171'; // Rojo sólido si pasó, tenue si no
                                strokeOpacity = parentCompleted ? 0.6 : 0.4;
                                strokeDash = parentCompleted ? '0' : '3,3';
                            } else if (parentCompleted) {
                                lineStroke = '#10b981'; // Verde - desbloqueado
                                strokeOpacity = 0.6;
                                strokeDash = '0';
                            } else if (parentInProgress && childStarted) {
                                lineStroke = '#3b82f6'; // Azul - ambos en progreso
                                strokeOpacity = 0.4;
                                strokeDash = '0';
                            } else if (parentInProgress) {
                                lineStroke = '#f59e0b'; // Naranja - padre en progreso
                                strokeOpacity = 0.3;
                                strokeDash = '3,3';
                            }

                            return (
                                <g key={`${reqId}-${skill.id}`}>
                                    <path
                                        d={`M ${parent.x} ${parent.y} C ${parent.x} ${(parent.y + skill.y) / 2}, ${skill.x} ${(parent.y + skill.y) / 2}, ${skill.x} ${skill.y}`}
                                        stroke={lineStroke}
                                        strokeWidth="2"
                                        fill="none"
                                        strokeOpacity={strokeOpacity}
                                        strokeDasharray={strokeDash}
                                        className="transition-all duration-500"
                                    />
                                </g>
                            );
                        })
                    )}
                </svg>

                {/* NODES */}
                {positionedSkills.map((skill) => {
                    const { isUnlocked } = getRequirementsInfo(skill.id);
                    return (
                        <SkillNode
                            key={skill.id}
                            skill={skill}
                            isUnlocked={isUnlocked}
                        />
                    );
                })}
            </div>

            {/* Instrucción flotante */}
            <div className="absolute bottom-6 left-6 px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-700 text-slate-400 text-xs shadow-xl pointer-events-none">
                Botón izquierdo para mover el mapa • Click en nodo para detalle
            </div>
        </div>
    );
}
