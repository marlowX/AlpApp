import React, { createContext, useContext, ReactNode, useState } from 'react';
import { ConfigProvider, App } from 'antd';
import plPL from 'antd/locale/pl_PL';

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

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const updateTokens = (tokens: Record<string, any>) => {
    setCustomTokens(prev => ({ ...prev, ...tokens }));
  };

  const resetTheme = () => {
    setCustomTokens({});
  };

  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    customTokens,
    updateTokens,
    resetTheme,
  };

  // MINIMALNY theme - tylko podstawowe kolory
  const minimalTheme = {
    token: {
      colorPrimary: '#1890ff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: 14,
    }
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        locale={plPL}
        theme={minimalTheme}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
