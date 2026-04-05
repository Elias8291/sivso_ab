import {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useState,
} from 'react';

const ThemeContext = createContext({
    isDarkMode: false,
    toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        const savedTheme = window.localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            return true;
        }
        if (savedTheme === 'light') {
            return false;
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', isDarkMode);
        root.style.colorScheme = isDarkMode ? 'dark' : 'light';
        window.localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = useCallback(() => {
        setIsDarkMode((current) => !current);
    }, []);

    const value = useMemo(
        () => ({
            isDarkMode,
            toggleTheme,
        }),
        [isDarkMode, toggleTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
