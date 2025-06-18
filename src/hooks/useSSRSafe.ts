import { useState, useEffect } from 'react';

/**
 * Hook para detectar se estamos em ambiente de hidratação
 */
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook para valores SSR-safe que só são aplicados após hidratação
 */
export function useSSRSafeValue<T>(
  clientValue: T,
  serverValue: T = clientValue
): T {
  const isHydrated = useIsHydrated();
  return isHydrated ? clientValue : serverValue;
}

/**
 * Hook para localStorage SSR-safe
 */
export function useSSRSafeLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const isHydrated = useIsHydrated();
  
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Failed to save to localStorage for key "${key}":`, error);
      }
    }
  };

  return [value, setStoredValue];
}

/**
 * Hook para sessionStorage SSR-safe
 */
export function useSSRSafeSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const isHydrated = useIsHydrated();
  
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    
    if (isHydrated && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Failed to save to sessionStorage for key "${key}":`, error);
      }
    }
  };

  return [value, setStoredValue];
}

/**
 * Hook para media queries SSR-safe
 */
export function useSSRSafeMediaQuery(query: string): boolean {
  const isHydrated = useIsHydrated();
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => { mediaQuery.removeEventListener('change', handler); };
  }, [query, isHydrated]);

  return isHydrated ? matches : false;
}

/**
 * Hook para criar refs SSR-safe
 */
export function useSSRSafeRef<T>(initialValue: T | null = null) {
  const isHydrated = useIsHydrated();
  const [ref, setRef] = useState<T | null>(initialValue);

  const setSSRSafeRef = (value: T | null) => {
    if (isHydrated) {
      setRef(value);
    }
  };

  return [ref, setSSRSafeRef] as const;
}

/**
 * Hook para eventos do window SSR-safe
 */
export function useSSRSafeWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const isHydrated = useIsHydrated();

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    window.addEventListener(type, listener, options);
    return () => { window.removeEventListener(type, listener, options); };
  }, [type, listener, options, isHydrated]);
}

/**
 * Hook para theme SSR-safe (evita flash of unstyled content)
 */
export function useSSRSafeTheme(defaultTheme: 'light' | 'dark' = 'light') {
  const [theme, setThemeState] = useSSRSafeLocalStorage('theme', defaultTheme);
  const isHydrated = useIsHydrated();

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    
    if (isHydrated && typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    }
  };

  // Aplicar tema no DOM quando hidratado
  useEffect(() => {
    if (isHydrated && typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [isHydrated, theme]);

  return [theme, setTheme] as const;
} 