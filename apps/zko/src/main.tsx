import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/antd-fixes.css';

// UWAGA: Tymczasowo wyłączamy StrictMode - może powodować problemy z Ant Design 5
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
