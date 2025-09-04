import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
// Import bezpośrednio komponentu, nie jako default
import ZKODetailsPage from '../pages/ZKODetailsPage';

/**
 * Strona szczegółów ZKO dla operatora piły
 * Wykorzystuje istniejący komponent ZKODetailsPage
 */
const WorkerZKODetailsPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div>
      <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/worker/pila')}
          >
            Powrót do panelu piły
          </Button>
        </Space>
      </div>
      
      {/* Używamy istniejącego komponentu szczegółów ZKO */}
      <ZKODetailsPage />
    </div>
  );
};

export default WorkerZKODetailsPage;