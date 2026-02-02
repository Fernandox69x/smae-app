import React from 'react';

interface DualCurrencyProps {
    amount: number;
    currency: 'NIO' | 'USD' | string;
    exchangeRate: number;
    displayCurrency: 'NIO' | 'USD' | string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showSymbol?: boolean;
}

/**
 * DualCurrency Component
 * 
 * Displays a monetary value with its converted equivalent.
 * - Shows original value first (in its native currency)
 * - Shows converted value next to it
 * - Highlights the active display currency
 * 
 * @example
 * // Amount is in NIO, display is NIO: "C$ 1,000 ($27.40)"
 * // Amount is in USD, display is NIO: "$100 (C$ 3,650)"
 */
export default function DualCurrency({
    amount,
    currency,
    exchangeRate,
    displayCurrency,
    size = 'md',
    className = '',
    showSymbol = true
}: DualCurrencyProps) {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const isNative = currency === displayCurrency;

    // Calculate converted value
    const convertedAmount = currency === 'USD'
        ? absAmount * exchangeRate  // USD to NIO
        : absAmount / exchangeRate; // NIO to USD

    // Format numbers
    const formatNumber = (num: number) => num.toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Get currency symbols
    const getSymbol = (curr: string) => curr === 'USD' ? '$' : 'C$';

    // Size classes
    const sizeClasses = {
        sm: { primary: 'text-sm font-medium', secondary: 'text-xs' },
        md: { primary: 'text-base font-semibold', secondary: 'text-sm' },
        lg: { primary: 'text-xl font-bold', secondary: 'text-base' }
    };

    const { primary, secondary } = sizeClasses[size];

    // Original value (with negative sign if applicable)
    const originalSymbol = showSymbol ? getSymbol(currency) : '';
    const negativeSign = isNegative ? '-' : '';
    const originalValue = `${negativeSign}${originalSymbol} ${formatNumber(absAmount)}`;

    // Converted value (with negative sign if applicable)
    const convertedSymbol = getSymbol(currency === 'USD' ? 'NIO' : 'USD');
    const convertedValue = `${negativeSign}${convertedSymbol} ${formatNumber(convertedAmount)}`;

    // Color logic: negative = red, otherwise use className or default
    const colorClass = isNegative ? 'text-red-400' : '';

    return (
        <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
            {/* Original value - always shown first with emphasis */}
            <span className={`${primary} ${colorClass || (isNative ? 'text-white' : 'text-slate-300')}`}>
                {originalValue}
            </span>

            {/* Converted value - shown in parentheses */}
            <span className={`${secondary} ${isNegative ? 'text-red-400/60' : 'text-slate-500'}`}>
                ({convertedValue})
            </span>
        </span>
    );
}

// Helper hook to get currency settings
export function useCurrencySettings() {
    const [settings, setSettings] = React.useState({
        exchangeRate: 36.50,
        displayCurrency: 'NIO' as 'NIO' | 'USD'
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                // Import config dynamically to avoid circular deps
                const { config } = await import('../../../config');
                const res = await fetch(`${config.API_URL}/flowcontrol/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        exchangeRate: Number(data.exchangeRate) || 36.50,
                        displayCurrency: data.displayCurrency || 'NIO'
                    });
                }
            } catch (err) {
                console.error('Error fetching currency settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    return { ...settings, loading };
}
