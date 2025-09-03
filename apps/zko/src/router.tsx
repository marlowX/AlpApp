import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './layout/Layout';
import { ZKOListPage } from './modules/zko/pages/ZKOListPage';
import { ZKODetailsPage } from './modules/zko/pages/ZKODetailsPage';
import { ZKOEditPage } from './modules/zko/pages/ZKOEditPage';
import { ZKOCreatePage } from './modules/zko/pages/ZKOCreatePage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { WorkflowPage } from './modules/workflow/pages/WorkflowPage';
import { CuttingPage } from './modules/production/pages/CuttingPage';
import { SelectTestPage } from './modules/zko/pages/SelectTestPage';
import { TestSelectPage } from './pages/TestSelectPage';

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="test-select" element={<SelectTestPage />} />
          <Route path="test-select-v2" element={<TestSelectPage />} />
          <Route path="zko">
            <Route index element={<ZKOListPage />} />
            <Route path="new" element={<ZKOCreatePage />} />
            <Route path=":id" element={<ZKODetailsPage />} />
            <Route path=":id/edit" element={<ZKOEditPage />} />
            <Route path=":id/workflow" element={<WorkflowPage />} />
          </Route>
          <Route path="production">
            <Route path="cutting" element={<CuttingPage />} />
          </Route>
          <Route path="workflow" element={<WorkflowPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
