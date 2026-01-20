import React, { createContext, useContext, useState, useEffect } from 'react';

interface LogoContextType {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    return savedLogo ? savedLogo : null;
  });

  useEffect(() => {
    if (logoUrl) {
      localStorage.setItem('companyLogo', logoUrl);
    }
  }, [logoUrl]);

  return (
    <LogoContext.Provider value={{ logoUrl, setLogoUrl }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
}