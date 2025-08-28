import React from 'react';
import { Alert, Space } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

export const SystemInfoAlert: React.FC = () => {
  return (
    <Alert
      message="Informacje o limitach i systemie"
      description={
        <Space direction="vertical" size="small">
          <div>• <strong>Płyty ≥18mm:</strong> Maksymalnie 5 sztuk w pozycji (ograniczenie wagowe)</div>
          <div>• <strong>Płyty &lt;18mm:</strong> Limit do 50 sztuk w pozycji</div>
          <div>• <strong>Stan magazynowy:</strong> System automatycznie sprawdza dostępność</div>
          <div>• <strong>Duplikaty:</strong> Ten sam kolor może wystąpić tylko raz w pozycji</div>
          <div>• <strong>Backend:</strong> ZKO-SERVICE na porcie 5000 (PostgreSQL schema: zko)</div>
          <div>• <strong>Wyszukiwanie:</strong> Wpisz część nazwy - system znajdzie pasujące płyty</div>
        </Space>
      }
      type="info"
      showIcon
      icon={<InfoCircleOutlined />}
    />
  );
};
