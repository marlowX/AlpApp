import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import plPL from 'antd/locale/pl_PL';
import { lightTheme, darkTheme } from './tokens';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  customTokens: Record<string, any>;
  updateTokens: (tokens: Record<string, any>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultDark?: boolean;
  customTokens?: Record<string, any>;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultDark = false,
  customTokens: initialCustomTokens = {}
}) => {
  const [isDarkMode, setIsDarkMode] = useState(defaultDark);
  const [customTokens, setCustomTokens] = useState(initialCustomTokens);

  // Odczytaj preferencje z localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('alp-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Sprawdź preferencje systemowe
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    const savedTokens = localStorage.getItem('alp-custom-tokens');
    if (savedTokens) {
      try {
        setCustomTokens(JSON.parse(savedTokens));
      } catch (e) {
        console.error('Failed to parse custom tokens:', e);
      }
    }
  }, []);

  // Zapisz preferencje do localStorage
  useEffect(() => {
    localStorage.setItem('alp-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (Object.keys(customTokens).length > 0) {
      localStorage.setItem('alp-custom-tokens', JSON.stringify(customTokens));
    }
  }, [customTokens]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const updateTokens = (tokens: Record<string, any>) => {
    setCustomTokens(prev => ({ ...prev, ...tokens }));
  };

  const resetTheme = () => {
    setCustomTokens({});
    localStorage.removeItem('alp-custom-tokens');
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;
  
  // Merge custom tokens with theme
  const mergedTheme = {
    ...currentTheme,
    token: {
      ...currentTheme.token,
      ...customTokens,
    },
    algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
  };

  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    customTokens,
    updateTokens,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        locale={plPL}
        theme={mergedTheme}
      >
        <StyledThemeProvider theme={mergedTheme}>
          {children}
        </StyledThemeProvider>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
