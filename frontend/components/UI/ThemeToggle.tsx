'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from './Button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" />;
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Moon size={20} className="text-zinc-100" />
            ) : (
                <Sun size={20} className="text-zinc-900" />
            )}
        </Button>
    );
}
