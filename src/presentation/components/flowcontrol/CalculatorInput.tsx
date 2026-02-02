import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface CalculatorInputProps {
    value: number | string;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * Input de moneda con calculadora integrada
 * Acepta expresiones matemáticas: 100/3, 500*0.15, 1000-200, 50+20
 */
export function CalculatorInput({
    value,
    onChange,
    placeholder = '0.00',
    className = '',
    disabled = false
}: CalculatorInputProps) {
    const [inputValue, setInputValue] = useState<string>(value?.toString() || '');
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        // Update input when value changes externally
        if (typeof value === 'number' && !isNaN(value)) {
            setInputValue(value.toString());
        }
    }, [value]);

    const evaluateExpression = (expr: string): number | null => {
        // Only allow safe math characters: numbers, +, -, *, /, ., (, ), spaces
        const safePattern = /^[\d\s+\-*/.()]+$/;
        if (!safePattern.test(expr)) {
            return null;
        }

        try {
            // Remove spaces and evaluate
            const cleanExpr = expr.replace(/\s/g, '');
            // Using Function instead of eval for slightly better safety
            const result = new Function(`return ${cleanExpr}`)();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return Math.round(result * 100) / 100; // Round to 2 decimals
            }
            return null;
        } catch {
            return null;
        }
    };

    const handleBlur = () => {
        const result = evaluateExpression(inputValue);
        if (result !== null) {
            setInputValue(result.toString());
            onChange(result);
            setIsCalculating(false);
        } else if (inputValue === '') {
            onChange(0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        // Check if it's an expression (contains operators)
        setIsCalculating(/[+\-*/]/.test(val));
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white 
                    focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                    ${isCalculating ? 'border-amber-500' : ''} 
                    ${className}`}
            />
            {isCalculating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Calculator size={16} className="text-amber-400" />
                </div>
            )}
        </div>
    );
}
