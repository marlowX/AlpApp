import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/antd-fixes.css';

// Tymczasowo wyłączamy StrictMode dla debugowania problemów z Select
ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
