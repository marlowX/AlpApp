/**
 * @fileoverview Globalne ustawienia wyglądu - styl ERP minimalistyczny
 * @module PaletyZko/styles/theme
 */

// ========== KOLORY ERP - Szaro-czarno-biały ==========
export const colors = {
  // Kolory główne - minimalistyczne
  primary: '#1890ff',      // Niebieski - informacje
  success: '#52c41a',      // Zielony - progres/sukces  
  warning: '#faad14',      // Pomarańczowy - ostrzeżenia (opcjonalnie)
  error: '#ff4d4f',        // Czerwony - błędy/braki
  info: '#1890ff',         // Niebieski - informacje
  
  // Kolory tła - odcienie szarości
  bgPrimary: '#ffffff',    // Białe tło główne
  bgSecondary: '#fafafa',  // Bardzo jasny szary
  bgTertiary: '#f5f5f5',   // Jasny szary
  bgHover: '#f0f0f0',      // Szary przy hover
  
  // Kolory tekstu - czarno-szare
  textPrimary: '#262626',   // Prawie czarny
  textSecondary: '#8c8c8c', // Średni szary
  textTertiary: '#bfbfbf',  // Jasny szary
  textDisabled: '#d9d9d9',  // Bardzo jasny szary
  textWhite: '#ffffff',      // Biały
  
  // Kolory granic - subtelne
  borderBase: '#f0f0f0',    // Bardzo jasna granica
  borderLight: '#fafafa',   // Prawie niewidoczna
  borderDark: '#d9d9d9',    // Jasnoszara
  borderHover: '#bfbfbf',   // Szara przy hover
  
  // Kolory statusów - tylko funkcjonalne
  statusGreen: '#52c41a',   // Zielony - OK/postęp
  statusRed: '#ff4d4f',     // Czerwony - błąd/brak
  statusBlue: '#1890ff',    // Niebieski - info
  statusGray: '#d9d9d9',    // Szary - nieaktywny
};

// ========== WYMIARY - Kompaktowe ==========
export const dimensions = {
  // Przyciski - niskie
  buttonHeightSmall: 22,
  buttonHeightBase: 26,
  buttonHeightLarge: 30,
  buttonPaddingHorizontal: 10,
  buttonBorderRadius: 3,
  
  // Karty i kontenery - minimalistyczne
  cardPadding: 10,
  cardBorderRadius: 6,
  cardShadow: 'none',  // Bez cieni dla czystego wyglądu
  cardBorder: '1px solid #f0f0f0',
  
  // Odstępy - zmniejszone
  spacingXs: 4,
  spacingSm: 6,
  spacingMd: 10,
  spacingLg: 14,
  spacingXl: 20,
  
  // Ikony - małe
  iconSizeSmall: 12,
  iconSizeBase: 14,
  iconSizeLarge: 16,
  iconSizeXLarge: 20,
  
  // Fonty - kompaktowe
  fontSizeSmall: 11,
  fontSizeBase: 12,
  fontSizeLarge: 14,
  fontSizeTitle: 16,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  
  // Wysokości nagłówków - niskie
  headerHeightSmall: 28,
  headerHeightBase: 32,
  headerHeightLarge: 40,
};

// ========== STYLE KOMPONENTÓW ==========
export const componentStyles = {
  // Style dla przycisków - płaskie, bez cieni
  button: {
    base: {
      height: dimensions.buttonHeightBase,
      padding: `0 ${dimensions.buttonPaddingHorizontal}px`,
      borderRadius: dimensions.buttonBorderRadius,
      fontSize: dimensions.fontSizeBase,
      fontWeight: dimensions.fontWeightNormal,
      transition: 'all 0.15s ease',
      border: '1px solid #d9d9d9',
      background: '#ffffff',
      color: '#595959',
      boxShadow: 'none',
    },
    small: {
      height: dimensions.buttonHeightSmall,
      padding: `0 ${dimensions.spacingSm}px`,
      fontSize: dimensions.fontSizeSmall,
    },
    primary: {
      background: colors.primary,
      borderColor: colors.primary,
      color: colors.textWhite,
    },
    success: {
      background: colors.success,
      borderColor: colors.success,
      color: colors.textWhite,
    },
    danger: {
      background: colors.error,
      borderColor: colors.error,
      color: colors.textWhite,
    }
  },
  
  // Style dla kart - płaskie, z subtelnymi granicami
  card: {
    base: {
      borderRadius: dimensions.cardBorderRadius,
      backgroundColor: colors.bgPrimary,
      border: dimensions.cardBorder,
      boxShadow: 'none',
      overflow: 'hidden',
    },
    compact: {
      padding: dimensions.cardPadding,
    },
    hover: {
      borderColor: colors.borderHover,
    }
  },
  
  // Style dla kafelków pozycji - z ramkami
  positionTile: {
    base: {
      padding: dimensions.spacingMd,
      borderRadius: dimensions.cardBorderRadius,
      border: '1px solid #e8e8e8',
      backgroundColor: colors.bgPrimary,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      minHeight: 70,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: dimensions.spacingXs,
      boxShadow: 'none',
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: '#f0f9ff',
      borderWidth: '2px',
    },
    hover: {
      borderColor: colors.borderHover,
      backgroundColor: colors.bgHover,
    }
  },
  
  // Style dla palet - wyraźne ramki
  paleta: {
    base: {
      borderRadius: dimensions.cardBorderRadius,
      padding: dimensions.cardPadding,
      backgroundColor: colors.bgPrimary,
      border: '1px solid #e8e8e8',
      minHeight: 100,
      transition: 'all 0.15s ease',
      boxShadow: 'none',
    },
    empty: {
      borderStyle: 'dashed',
      backgroundColor: colors.bgSecondary,
      borderColor: colors.borderDark,
    },
    dragOver: {
      borderColor: colors.primary,
      backgroundColor: '#f0f9ff',
      borderWidth: '2px',
    },
    closed: {
      opacity: 0.9,
      borderColor: colors.warning,
      backgroundColor: '#fffbe6',
    }
  },
  
  // Style dla formatek
  formatka: {
    base: {
      padding: `${dimensions.spacingSm}px ${dimensions.spacingMd}px`,
      borderRadius: dimensions.buttonBorderRadius,
      border: '1px solid #e8e8e8',
      backgroundColor: colors.bgPrimary,
      cursor: 'grab',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
      fontSize: dimensions.fontSizeBase,
    },
    dragging: {
      opacity: 0.5,
      cursor: 'grabbing',
    },
    hover: {
      borderColor: colors.borderHover,
      backgroundColor: colors.bgHover,
    }
  },
  
  // Style dla nagłówków - kompaktowe
  header: {
    base: {
      height: dimensions.headerHeightBase,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `0 ${dimensions.spacingMd}px`,
      borderBottom: '1px solid #f0f0f0',
      backgroundColor: colors.bgSecondary,
      fontSize: dimensions.fontSizeBase,
    },
    compact: {
      height: dimensions.headerHeightSmall,
      padding: `0 ${dimensions.spacingSm}px`,
      fontSize: dimensions.fontSizeSmall,
    }
  },
  
  // Style dla znaczników (tagów)
  tag: {
    base: {
      padding: `0 ${dimensions.spacingSm}px`,
      height: 18,
      lineHeight: '18px',
      fontSize: dimensions.fontSizeSmall,
      borderRadius: 2,
      border: '1px solid #e8e8e8',
      fontWeight: dimensions.fontWeightNormal,
      background: '#fafafa',
      color: '#595959',
    }
  },
  
  // Style dla progress barów - funkcjonalne kolory
  progress: {
    base: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#f0f0f0',
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
      transition: 'width 0.3s ease',
      borderRadius: 3,
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
      fontSize: 40,
      color: colors.borderDark,
      marginBottom: dimensions.spacingMd,
    }
  }
};

// ========== FUNKCJE POMOCNICZE ==========
export const styleHelpers = {
  // Funkcja do obliczania koloru postępu - tylko zielony/szary/czerwony
  getCompletionColor: (percent: number): string => {
    if (percent >= 100) return colors.statusGreen;
    if (percent >= 75) return colors.statusGreen;
    if (percent >= 50) return colors.primary;
    if (percent > 0) return colors.borderDark;
    return colors.statusRed;
  },
  
  // Funkcja do określania koloru statusu
  getStatusColor: (status: string): string => {
    switch(status) {
      case 'otwarta': return colors.statusGreen;
      case 'zamknieta': return colors.warning;
      case 'gotowa_do_transportu': return colors.primary;
      case 'error': return colors.statusRed;
      default: return colors.statusGray;
    }
  },
  
  // Brak cieni - płaski design
  createShadow: (): string => {
    return 'none';
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