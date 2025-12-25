import { useState, useEffect } from 'react';

export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T) => void] {
    // Initialize with default value to match server-side rendering
    const [state, setState] = useState<T>(initialValue);
    const [isHydrated, setIsHydrated] = useState(false);

    // Read from localStorage once on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setState(JSON.parse(item));
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
        }
        setIsHydrated(true);
    }, [key]);

    // Write to localStorage when state changes, but only after hydration
    useEffect(() => {
        if (!isHydrated) return;

        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error writing localStorage key "${key}":`, error);
        }
    }, [key, state, isHydrated]);

    return [state, setState];
}
