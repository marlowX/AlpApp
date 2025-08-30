import React from 'react';
import { Card, Button, Space } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';

interface PaletaHeaderProps {
  pozycjaId: number;
  loading: boolean;
  saving: boolean;
  onRefresh: () => void;
  onCreateAllRemaining: () => void;
}

export const PaletaHeader: React.FC<PaletaHeaderProps> = ({
  pozycjaId,
  loading,
  saving,
  onRefresh,
  onCreateAllRemaining
}) => {
  return (
    <Card className="shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Ręczne tworzenie palet (Pozycja: {pozycjaId})
        </h3>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            Odśwież
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateAllRemaining}
            loading={saving}
          >
            📦 Utwórz paletę ze wszystkimi
          </Button>
        </Space>
      </div>
    </Card>
  );
};
