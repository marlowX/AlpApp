import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${props => props.theme.token?.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};
    font-size: ${props => props.theme.token?.fontSize || 14}px;
    line-height: ${props => props.theme.token?.lineHeight || 1.5714};
    color: ${props => props.theme.token?.colorText || 'rgba(0, 0, 0, 0.88)'};
    background-color: ${props => props.theme.token?.colorBgLayout || '#f5f5f5'};
    transition: background-color 0.3s ease;
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.token?.colorBgContainer || '#ffffff'};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.token?.colorFill || 'rgba(0, 0, 0, 0.15)'};
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.token?.colorFillSecondary || 'rgba(0, 0, 0, 0.25)'};
    }
  }

  /* Selection */
  ::selection {
    background-color: ${props => props.theme.token?.colorPrimary || '#1890ff'}40;
    color: ${props => props.theme.token?.colorText || 'rgba(0, 0, 0, 0.88)'};
  }

  /* Focus styles */
  :focus-visible {
    outline: 2px solid ${props => props.theme.token?.colorPrimary || '#1890ff'};
    outline-offset: 2px;
  }

  /* Ant Design overrides for better integration */
  .ant-layout {
    background: ${props => props.theme.token?.colorBgLayout || '#f5f5f5'};
  }

  .ant-layout-content {
    padding: 24px;
    min-height: calc(100vh - 64px - 69px); /* header - footer */
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  /* Utility classes */
  .fade-in {
    animation: fadeIn 0.3s ease;
  }

  .slide-in {
    animation: slideInRight 0.3s ease;
  }

  /* Custom table hover effect */
  .ant-table-tbody > tr {
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateX(2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  /* Card hover effect */
  .ant-card {
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  /* Button loading state */
  .ant-btn-loading {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Status colors utility classes */
  .status-active {
    color: ${props => props.theme.token?.colorSuccess || '#52c41a'};
  }

  .status-inactive {
    color: ${props => props.theme.token?.colorTextTertiary || 'rgba(0, 0, 0, 0.45)'};
  }

  .status-warning {
    color: ${props => props.theme.token?.colorWarning || '#faad14'};
  }

  .status-error {
    color: ${props => props.theme.token?.colorError || '#f5222d'};
  }

  /* Print styles */
  @media print {
    body {
      background: white;
      color: black;
    }

    .no-print {
      display: none !important;
    }
  }

  /* Responsive utilities */
  @media (max-width: 768px) {
    .ant-layout-content {
      padding: 16px;
    }
    
    .hide-mobile {
      display: none;
    }
  }

  @media (min-width: 769px) {
    .show-mobile-only {
      display: none;
    }
  }
`;

export default GlobalStyles;
