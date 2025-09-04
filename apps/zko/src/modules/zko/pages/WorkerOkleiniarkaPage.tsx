import React from 'react';
import { WorkerViewOkleiniarka } from '../components/WorkerViews/WorkerViewOkleiniarka';
import { useNavigate } from 'react-router-dom';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';

const WorkerOkleiniarkaPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Górny pasek nawigacji */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '10px 20px', 
        borderBottom: '1px solid #e8e8e8',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            Powrót
          </Button>
          <Button 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/zko')}
          >
            Panel główny
          </Button>
        </Space>
      </div>

      {/* Główny widok */}
      <WorkerViewOkleiniarka />
    </div>
  );
};

export default WorkerOkleiniarkaPage;
