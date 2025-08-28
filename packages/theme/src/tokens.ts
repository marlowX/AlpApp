import { ThemeConfig } from 'antd';

// ===========================
// Podstawowe tokeny designu
// ===========================
export const baseTokens = {
  // Kolory główne
  colorPrimary: '#1890ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#f5222d',
  colorInfo: '#1890ff',
  colorLink: '#1890ff',
  
  // Kolory neutralne
  colorTextBase: '#000000',
  colorBgBase: '#ffffff',
  
  // Typografia
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: 14,
  fontSizeHeading1: 38,
  fontSizeHeading2: 30,
  fontSizeHeading3: 24,
  fontSizeHeading4: 20,
  fontSizeHeading5: 16,
  fontSizeLG: 16,
  fontSizeSM: 12,
  fontSizeXL: 20,
  
  // Line Heights
  lineHeight: 1.5714,
  lineHeightLG: 1.5,
  lineHeightSM: 1.6667,
  lineHeightHeading1: 1.2105,
  lineHeightHeading2: 1.2667,
  lineHeightHeading3: 1.3333,
  lineHeightHeading4: 1.4,
  lineHeightHeading5: 1.5,
  
  // Spacing (marginesy i paddingi)
  marginXXS: 4,
  marginXS: 8,
  marginSM: 12,
  margin: 16,
  marginMD: 20,
  marginLG: 24,
  marginXL: 32,
  marginXXL: 48,
  
  paddingXXS: 4,
  paddingXS: 8,
  paddingSM: 12,
  padding: 16,
  paddingMD: 20,
  paddingLG: 24,
  paddingXL: 32,
  
  // Border radius
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusSM: 4,
  borderRadiusXS: 2,
  
  // Control sizes
  controlHeight: 36,
  controlHeightLG: 40,
  controlHeightSM: 32,
  controlHeightXS: 24,
  
  // Animacje
  motionUnit: 0.01,
  motionBase: 0,
  motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  motionEaseIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
  motionEaseInBack: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
  motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  
  // Box shadows
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  
  // Inne
  screenXS: 480,
  screenSM: 576,
  screenMD: 768,
  screenLG: 992,
  screenXL: 1200,
  screenXXL: 1600,
};

// ===========================
// Motyw jasny
// ===========================
export const lightTheme: ThemeConfig = {
  token: {
    ...baseTokens,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgElevated: '#ffffff',
    colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',
    
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',
    
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    
    colorFill: 'rgba(0, 0, 0, 0.15)',
    colorFillSecondary: 'rgba(0, 0, 0, 0.06)',
    colorFillTertiary: 'rgba(0, 0, 0, 0.04)',
    colorFillQuaternary: 'rgba(0, 0, 0, 0.02)',
  },
  components: {
    // Konfiguracja Table
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0, 0, 0, 0.88)',
      headerSortActiveBg: '#f0f0f0',
      headerSortHoverBg: '#e6e6e6',
      rowHoverBg: '#fafafa',
      rowSelectedBg: '#e6f4ff',
      rowSelectedHoverBg: '#bae0ff',
      fontSize: 14,
      padding: 16,
      paddingXS: 8,
      paddingSM: 12,
      paddingXXS: 4,
      borderRadius: 8,
      footerBg: '#fafafa',
      footerColor: 'rgba(0, 0, 0, 0.88)',
      cellFontSize: 14,
      cellPaddingInline: 16,
      cellPaddingBlock: 16,
      cellPaddingInlineMD: 12,
      cellPaddingBlockMD: 12,
      cellPaddingInlineSM: 8,
      cellPaddingBlockSM: 8,
      expandIconBg: '#ffffff',
      filterDropdownBg: '#ffffff',
      stickyScrollBarBg: 'rgba(0, 0, 0, 0.3)',
    },
    
    // Konfiguracja Button
    Button: {
      controlHeight: 36,
      fontSize: 14,
      borderRadius: 6,
      paddingContentHorizontal: 15,
      colorPrimaryHover: '#40a9ff',
      colorPrimaryActive: '#096dd9',
      colorTextLightSolid: '#ffffff',
      primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      defaultBorderColor: '#d9d9d9',
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      dangerShadow: '0 2px 0 rgba(255, 38, 5, 0.06)',
      primaryColor: '#fff',
    },
    
    // Konfiguracja Card
    Card: {
      paddingLG: 24,
      padding: 20,
      paddingSM: 16,
      paddingXS: 12,
      headerBg: '#fafafa',
      headerFontSize: 16,
      headerFontSizeSM: 14,
      headerHeight: 60,
      headerHeightSM: 48,
      actionsBg: '#ffffff',
      actionsLiMargin: '12px 0',
      tabsMarginBottom: -25,
      extraColor: 'rgba(0, 0, 0, 0.45)',
    },
    
    // Konfiguracja Form
    Form: {
      labelFontSize: 14,
      labelHeight: 32,
      labelColonMarginInlineStart: 2,
      labelColonMarginInlineEnd: 8,
      itemMarginBottom: 24,
      verticalLabelPadding: '0 0 8px',
      verticalLabelMargin: 0,
    },
    
    // Konfiguracja Input
    Input: {
      controlHeight: 36,
      fontSize: 14,
      paddingInline: 11,
      paddingInlineLG: 15,
      paddingInlineSM: 7,
      paddingBlock: 4,
      paddingBlockLG: 7,
      paddingBlockSM: 0,
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      colorBorder: '#d9d9d9',
      colorBgContainer: '#ffffff',
      activeBorderColor: '#40a9ff',
      hoverBorderColor: '#40a9ff',
      activeShadow: '0 0 0 2px rgba(5, 145, 255, 0.1)',
    },
    
    // Konfiguracja Select
    Select: {
      controlHeight: 36,
      fontSize: 14,
      optionHeight: 32,
      optionFontSize: 14,
      optionPadding: '5px 12px',
      optionSelectedBg: '#e6f4ff',
      optionActiveBg: '#f5f5f5',
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
    },
    
    // Konfiguracja Modal
    Modal: {
      headerBg: '#ffffff',
      titleFontSize: 18,
      titleLineHeight: 1.5,
      padding: 24,
      paddingLG: 32,
      paddingMD: 24,
      paddingContentHorizontalLG: 32,
      paddingSM: 16,
      paddingXS: 12,
      footerBg: '#ffffff',
      footerBorderStyle: 'solid',
      footerBorderWidth: 1,
      footerBorderRadius: '0 0 8px 8px',
      footerPaddingBlock: 12,
      footerPaddingInline: 24,
    },
    
    // Konfiguracja Layout
    Layout: {
      headerBg: '#001529',
      headerHeight: 64,
      headerPadding: '0 24px',
      headerColor: '#ffffff',
      footerBg: '#f0f2f5',
      footerPadding: '24px 50px',
      siderBg: '#001529',
      triggerBg: '#002140',
      triggerColor: '#ffffff',
      triggerHeight: 48,
      lightSiderBg: '#ffffff',
      lightTriggerBg: '#ffffff',
      lightTriggerColor: 'rgba(0, 0, 0, 0.88)',
      bodyBg: '#f0f0f0',
    },
    
    // Konfiguracja Menu
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemSelectedBg: '#1890ff',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemHoverBg: 'transparent',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverColor: '#ffffff',
      darkItemDisabledColor: 'rgba(255, 255, 255, 0.25)',
      itemBg: '#ffffff',
      itemColor: 'rgba(0, 0, 0, 0.88)',
      itemHoverBg: '#f5f5f5',
      itemHoverColor: 'rgba(0, 0, 0, 0.88)',
      itemSelectedBg: '#e6f4ff',
      itemSelectedColor: '#1890ff',
      itemActiveBg: '#e6f4ff',
      itemMarginInline: 4,
      itemBorderRadius: 8,
      subMenuItemBg: 'rgba(0, 0, 0, 0.02)',
      horizontalItemSelectedBg: '#ffffff',
      horizontalItemSelectedColor: '#1890ff',
      horizontalItemHoverBg: 'transparent',
      horizontalItemBorderRadius: 0,
      popupBg: '#ffffff',
    },
    
    // Konfiguracja Tabs
    Tabs: {
      cardBg: '#fafafa',
      cardHeight: 40,
      cardPadding: '8px 16px',
      cardPaddingSM: '6px 12px',
      cardPaddingLG: '8px 20px',
      titleFontSize: 14,
      titleFontSizeLG: 16,
      titleFontSizeSM: 14,
      inkBarColor: '#1890ff',
      horizontalMargin: '0 0 16px 0',
      horizontalItemGutter: 32,
      horizontalItemMargin: '0 0 0 32px',
      horizontalItemMarginRTL: '0 32px 0 0',
      horizontalItemPadding: '12px 0',
      horizontalItemPaddingSM: '8px 0',
      horizontalItemPaddingLG: '16px 0',
      verticalItemMargin: '16px 0 0 0',
      verticalItemPadding: '8px 24px',
      itemActiveColor: '#1890ff',
      itemHoverColor: '#40a9ff',
      itemSelectedColor: '#1890ff',
      cardGutter: 2,
    },
  },
};

// ===========================
// Motyw ciemny
// ===========================
export const darkTheme: ThemeConfig = {
  token: {
    ...baseTokens,
    colorBgBase: '#141414',
    colorTextBase: '#ffffff',
    
    colorBgContainer: '#1f1f1f',
    colorBgLayout: '#141414',
    colorBgElevated: '#262626',
    colorBgSpotlight: 'rgba(255, 255, 255, 0.85)',
    
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
    
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',
    
    colorFill: 'rgba(255, 255, 255, 0.18)',
    colorFillSecondary: 'rgba(255, 255, 255, 0.12)',
    colorFillTertiary: 'rgba(255, 255, 255, 0.08)',
    colorFillQuaternary: 'rgba(255, 255, 255, 0.04)',
    
    colorPrimary: '#177ddc',
    colorSuccess: '#49aa19',
    colorWarning: '#d89614',
    colorError: '#a61d24',
    colorInfo: '#177ddc',
    colorLink: '#177ddc',
  },
  algorithm: 'dark' as any, // Ant Design dark algorithm
  components: {
    // Dark theme components config - dziedziczy z light theme z modyfikacjami
    Table: {
      headerBg: '#1f1f1f',
      headerColor: 'rgba(255, 255, 255, 0.85)',
      rowHoverBg: '#262626',
      rowSelectedBg: '#112545',
      rowSelectedHoverBg: '#0e4980',
    },
    
    Layout: {
      headerBg: '#141414',
      siderBg: '#141414',
      triggerBg: '#262626',
    },
  },
};

export default {
  baseTokens,
  lightTheme,
  darkTheme,
};
