import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  pathname: string;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
  pathname: '/',
  searchParams: new URLSearchParams()
});

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getPathFromHashOrUrl = (): string => {
    if (typeof window === 'undefined') return '/';
    const realSearch = window.location.search;
    if (realSearch) {
      const params = new URLSearchParams(realSearch);
      const start = params.get('start');
      if (start) {
        const hash = `/activate?code=${encodeURIComponent(start)}`;
        window.location.hash = hash;
        return hash;
      }
    }
    if (window.location.hash) {
      return window.location.hash.slice(1) || '/';
    }
    return window.location.pathname || '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getPathFromHashOrUrl);

  const navigate = useCallback((path: string) => {
    if (typeof window === 'undefined') return;
    const targetHash = path.startsWith('/') ? path : `/${path}`;
    if (window.location.hash.slice(1) === targetHash) {
      setCurrentPath(targetHash);
    } else {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getPathFromHashOrUrl());
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const [pathname, searchStr] = currentPath.split('?');
  const searchParams = new URLSearchParams(searchStr || '');

  return (
    <RouterContext.Provider value={{ currentPath, navigate, pathname, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);
