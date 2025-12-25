import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
    return (
        <div className="w-full group">
            {label && (
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    className={`
                        w-full rounded-xl border bg-white px-4 py-3 text-sm transition-all duration-200
                        placeholder-zinc-400 
                        focus:outline-none focus:ring-4
                        dark:bg-zinc-900/50 dark:text-white
                        ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30'
                            : 'border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-50 dark:focus:ring-blue-900/30'
                        }
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && <p className="mt-1.5 text-xs font-medium text-red-500 animate-fade-in flex items-center gap-1">
                ⚠️ {error}
            </p>}
            {!error && helperText && <p className="mt-1.5 text-xs text-zinc-500">{helperText}</p>}
        </div>
    );
}
