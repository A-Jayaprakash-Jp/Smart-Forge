import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
    value: number;
    min?: number;
    ideal?: number;
    max?: number;
    criticalMax?: number;
    label: string;
    unit: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, min = 0, ideal = 70, max = 100, criticalMax = 120, label, unit }) => {
    const totalRange = (criticalMax * 1.1) - min;
    const valueAngle = Math.min(180, Math.max(0, ((value - min) / totalRange) * 180));
    
    const color = useMemo(() => {
        if (value > criticalMax || value < min) return '#C8102E'; // Red
        if (value > max) return '#F59E0B'; // Yellow
        return '#10B981'; // Green
    }, [value, min, max, criticalMax]);
    
    const getArc = (startAngle: number, endAngle: number) => {
        const start = polarToCartesian(50, 50, 40, endAngle);
        const end = polarToCartesian(50, 50, 40, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const idealAngle = ((ideal - min) / totalRange) * 180;

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 100 60" className="w-full">
                {/* Background track */}
                <path d={getArc(0, 180)} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" strokeLinecap="round" />
                
                {/* Value arc */}
                <motion.path
                    d={getArc(0, valueAngle)}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                />
                
                {/* Ideal marker */}
                <line
                    x1={polarToCartesian(50, 50, 34, idealAngle).x}
                    y1={polarToCartesian(50, 50, 34, idealAngle).y}
                    x2={polarToCartesian(50, 50, 46, idealAngle).x}
                    y2={polarToCartesian(50, 50, 46, idealAngle).y}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-400 dark:text-gray-500"
                />
                
                <text x="50" y="45" textAnchor="middle" className="text-2xl font-bold fill-current text-gray-800 dark:text-white">
                    {value.toFixed(0)}
                </text>
                 <text x="50" y="55" textAnchor="middle" className="text-xs font-semibold fill-current text-gray-500 dark:text-gray-400">
                    {unit}
                </text>
            </svg>
            <span className="mt-1 text-sm font-semibold text-center text-gray-600 dark:text-gray-300">{label}</span>
        </div>
    );
};

export default Gauge;