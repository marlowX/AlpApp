/**
 * @fileoverview Globalne ustawienia wyglądu i stylów dla modułu PaletyZko
 * @module PaletyZko/styles/theme
 */

// ========== KOLORY ==========
export const colors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#1890ff',
  
  // Kolory tła
  bgPrimary: '#ffffff',
  bgSecondary: '#fafafa',
  bgTertiary: '#f0f2f5',
  bgHover: '#e6f7ff',
  
  // Kolory tekstu
  textPrimary: '#262626',
  textSecondary: '#8c8c8c',
  textDisabled: '#bfbfbf',
  textWhite: '#ffffff',
  
  // Kolory granic
  borderBase: '#d9d9d9',
  borderLight: '#e8e8e8',
  borderDark: '#bfbfbf',
  
  // Kolory statusów palet
  paletaOpen: '#52c41a',
  paletaClosed: '#faad14',
  paletaReady: '#1890ff',
  paletaEmpty: '#d9d9d9',
};

// ========== WYMIARY ==========
export const dimensions = {
  // Przyciski
  buttonHeightSmall: 24,
  buttonHeightBase: 28,
  buttonHeightLarge: 32,
  buttonPaddingHorizontal: 12,
  buttonBorderRadius: 4,
  
  // Karty i kontenery
  cardPadding: 12,
  cardBorderRadius: 8,
  cardShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
  cardHoverShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  
  // Odstępy
  spacingXs: 4,
  spacingSm: 8,
  spacingMd: 12,
  spacingLg: 16,
  spacingXl: 24,
  
  // Ikony
  iconSizeSmall: 14,
  iconSizeBase: 16,
  iconSizeLarge: 20,
  iconSizeXLarge: 24,
  
  // Fonty
  fontSizeSmall: 12,
  fontSizeBase: 14,
  fontSizeLarge: 16,
  fontSizeTitle: 18,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  
  // Wysokości nagłówków
  headerHeightSmall: 32,
  headerHeightBase: 40,
  headerHeightLarge: 48,
};

// ========== STYLE KOMPONENTÓW ==========
export const componentStyles = {
  // Style dla przycisków
  button: {
    base: {
      height: dimensions.buttonHeightBase,
      padding: `0 ${dimensions.buttonPaddingHorizontal}px`,
      borderRadius: dimensions.buttonBorderRadius,
      fontSize: dimensions.fontSizeBase,
      fontWeight: dimensions.fontWeightMedium,
      transition: 'all 0.2s ease',
    },
    small: {
      height: dimensions.buttonHeightSmall,
      padding: `0 ${dimensions.spacingSm}px`,
      fontSize: dimensions.fontSizeSmall,
    },
    large: {
      height: dimensions.buttonHeightLarge,
      padding: `0 ${dimensions.spacingLg}px`,
      fontSize: dimensions.fontSizeLarge,
    },
    icon: {
      width: dimensions.buttonHeightBase,
      padding: 0,
    }
  },
  
  // Style dla kart
  card: {
    base: {
      borderRadius: dimensions.cardBorderRadius,
      boxShadow: dimensions.cardShadow,
      backgroundColor: colors.bgPrimary,
      border: `1px solid ${colors.borderLight}`,
      overflow: 'hidden',
    },
    compact: {
      padding: dimensions.cardPadding,
    },
    hover: {
      boxShadow: dimensions.cardHoverShadow,
      borderColor: colors.primary,
    }
  },
  
  // Style dla kafelków pozycji
  positionTile: {
    base: {
      padding: dimensions.spacingMd,
      borderRadius: dimensions.cardBorderRadius,
      border: `1px solid ${colors.borderBase}`,
      backgroundColor: colors.bgPrimary,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: 80,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: dimensions.spacingXs,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.bgHover,
      boxShadow: `0 0 0 2px ${colors.primary}20`,
    },
    hover: {
      borderColor: colors.primary,
      boxShadow: dimensions.cardHoverShadow,
    }
  },
  
  // Style dla palet
  paleta: {
    base: {
      borderRadius: dimensions.cardBorderRadius,
      padding: dimensions.cardPadding,
      backgroundColor: colors.bgPrimary,
      border: `2px solid ${colors.borderBase}`,
      minHeight: 120,
      transition: 'all 0.2s ease',
    },
    empty: {
      borderStyle: 'dashed',
      backgroundColor: colors.bgSecondary,
      borderColor: colors.borderLight,
    },
    dragOver: {
      borderColor: colors.primary,
      backgroundColor: colors.bgHover,
      boxShadow: `0 0 0 3px ${colors.primary}30`,
    },
    closed: {
      opacity: 0.8,
      borderColor: colors.warning,
    }
  },
  
  // Style dla formatek
  formatka: {
    base: {
      padding: `${dimensions.spacingSm}px ${dimensions.spacingMd}px`,
      borderRadius: dimensions.buttonBorderRadius,
      border: `1px solid ${colors.borderBase}`,
      backgroundColor: colors.bgPrimary,
      cursor: 'grab',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 36,
      fontSize: dimensions.fontSizeBase,
    },
    dragging: {
      opacity: 0.5,
      cursor: 'grabbing',
    },
    hover: {
      borderColor: colors.primary,
      backgroundColor: colors.bgHover,
    }
  },
  
  // Style dla nagłówków
  header: {
    base: {
      height: dimensions.headerHeightBase,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `0 ${dimensions.spacingMd}px`,
      borderBottom: `1px solid ${colors.borderLight}`,
      backgroundColor: colors.bgSecondary,
    },
    compact: {
      height: dimensions.headerHeightSmall,
      padding: `0 ${dimensions.spacingSm}px`,
    }
  },
  
  // Style dla znaczników (tagów)
  tag: {
    base: {
      padding: `0 ${dimensions.spacingSm}px`,
      height: 20,
      lineHeight: '20px',
      fontSize: dimensions.fontSizeSmall,
      borderRadius: 2,
      border: 'none',
      fontWeight: dimensions.fontWeightMedium,
    }
  },
  
  // Style dla progress barów
  progress: {
    base: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.borderLight,
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
      transition: 'width 0.3s ease',
      borderRadius: 4,
    }
  },
  
  // Style dla pustych stanów
  empty: {
    base: {
      padding: `${dimensions.spacingXl * 2}px ${dimensions.spacingXl}px`,
      textAlign: 'center' as const,
      color: colors.textSecondary,
    },
    icon: {
      fontSize: 48,
      color: colors.borderBase,
      marginBottom: dimensions.spacingMd,
    }
  }
};

// ========== FUNKCJE POMOCNICZE ==========
export const styleHelpers = {
  // Funkcja do obliczania procentu wypełnienia
  getCompletionColor: (percent: number): string => {
    if (percent >= 100) return colors.success;
    if (percent >= 75) return colors.warning;
    if (percent >= 50) return colors.info;
    return colors.borderBase;
  },
  
  // Funkcja do określania koloru statusu
  getStatusColor: (status: string): string => {
    switch(status) {
      case 'otwarta': return colors.paletaOpen;
      case 'zamknieta': return colors.paletaClosed;
      case 'gotowa_do_transportu': return colors.paletaReady;
      default: return colors.borderBase;
    }
  },
  
  // Funkcja do tworzenia cienia
  createShadow: (level: 'low' | 'medium' | 'high'): string => {
    switch(level) {
      case 'low': return '0 1px 2px rgba(0, 0, 0, 0.08)';
      case 'medium': return '0 2px 8px rgba(0, 0, 0, 0.12)';
      case 'high': return '0 4px 16px rgba(0, 0, 0, 0.16)';
    }
  }
};

// ========== MEDIA QUERIES ==========
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export const mediaQueries = {
  xs: `@media (max-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
};

export default {
  colors,
  dimensions,
  componentStyles,
  styleHelpers,
  breakpoints,
  mediaQueries,
};