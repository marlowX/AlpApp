import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './layout/Layout';
import { ZKOModernListPage } from './modules/zko/pages/ZKOModernListPage';
import { ZKOListPage } from './modules/zko/pages/ZKOListPage';
import { ZKODetailsPage } from './modules/zko/pages/ZKODetailsPage';
import { ZKOEditPage } from './modules/zko/pages/ZKOEditPage';
import { ZKOCreatePage } from './modules/zko/pages/ZKOCreatePage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { WorkflowPage } from './modules/workflow/pages/WorkflowPage';
import { CuttingPage } from './modules/production/pages/CuttingPage';
import WorkerPilaPage from './modules/zko/pages/WorkerPilaPage';
import WorkerOkleiniarkaPage from './modules/zko/pages/WorkerOkleiniarkaPage';
import WorkerZKODetailsPage from './modules/zko/pages/WorkerZKODetailsPage';

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="zko">
            <Route index element={<ZKOModernListPage />} />
            <Route path="list" element={<ZKOListPage />} />
            <Route path="new" element={<ZKOCreatePage />} />
            <Route path=":id" element={<ZKODetailsPage />} />
            <Route path=":id/edit" element={<ZKOEditPage />} />
            <Route path=":id/workflow" element={<WorkflowPage />} />
          </Route>
          <Route path="production">
            <Route path="cutting" element={<CuttingPage />} />
          </Route>
          <Route path="workflow" element={<WorkflowPage />} />
          
          {/* Widoki dla pracowników */}
          <Route path="worker">
            <Route path="pila" element={<WorkerPilaPage />} />
            <Route path="okleiniarka" element={<WorkerOkleiniarkaPage />} />
            {/* Szczegóły ZKO dla operatora - DODANE! */}
            <Route path="zko/:id" element={<WorkerZKODetailsPage />} />
            {/* Przyszłe widoki:
            <Route path="wiertarka" element={<WorkerWiertarkaPage />} />
            <Route path="magazyn" element={<WorkerMagazynPage />} />
            <Route path="kompletowanie" element={<WorkerKompletowaniePage />} />
            */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};