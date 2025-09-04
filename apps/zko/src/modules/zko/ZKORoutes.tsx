import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// Lazy load pages
const ZKOListPage = lazy(() => import('./pages/ZKOListPage'));
const ZKODetailPage = lazy(() => import('./pages/ZKODetailPage'));
const ZKOCreatePage = lazy(() => import('./pages/ZKOCreatePage'));
const ZKOModernListPage = lazy(() => import('./pages/ZKOModernListPage'));
const WorkerPilaPage = lazy(() => import('./pages/WorkerPilaPage'));
const WorkerOkleinarkaPage = lazy(() => import('./pages/WorkerOkleinarkaPage'));
const WorkerWiertarkaPage = lazy(() => import('./pages/WorkerWiertarkaPage'));

const loadingIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

const ZKORoutes: React.FC = () => {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin indicator={loadingIcon} tip="Ładowanie..." size="large" />
      </div>
    }>
      <Routes>
        {/* Lista ZKO */}
        <Route path="/list" element={<ZKOListPage />} />
        
        {/* Nowoczesna lista ZKO */}
        <Route path="/modern-list" element={<ZKOModernListPage />} />
        
        {/* Szczegóły ZKO */}
        <Route path="/:id" element={<ZKODetailPage />} />
        
        {/* Tworzenie nowego ZKO */}
        <Route path="/create" element={<ZKOCreatePage />} />
        
        {/* Panele pracowników */}
        <Route path="/worker/pila" element={<WorkerPilaPage />} />
        <Route path="/worker/okleiniarka" element={<WorkerOkleinarkaPage />} />
        <Route path="/worker/wiertarka" element={<WorkerWiertarkaPage />} />
        
        {/* Domyślna ścieżka */}
        <Route path="/" element={<ZKOModernListPage />} />
      </Routes>
    </Suspense>
  );
};

export default ZKORoutes;