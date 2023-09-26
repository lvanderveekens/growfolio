import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, fallbackValue: T) {
    const [value, setValue] = useState(() => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallbackValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [value]);

    return [value, setValue] as const;
}