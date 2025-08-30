import React from 'react';
import { Card, Button, Space } from 'antd';
import { PlusOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';

interface PaletaActionsProps {
  paletCount: number;
  niepustePaletCount: number;
  saving: boolean;
  onAddPaleta: (przeznaczenie: string) => void;
  onSaveAll: () => void;
  onDeleteAll: () => void;
}

export const PaletaActions: React.FC<PaletaActionsProps> = ({
  paletCount,
  niepustePaletCount,
  saving,
  onAddPaleta,
  onSaveAll,
  onDeleteAll
}) => {
  return (
    <Card className="shadow-sm">
      <Space wrap>
        <Button
          icon={<PlusOutlined />}
          onClick={() => onAddPaleta('MAGAZYN')}
        >
          Nowa paleta - MAGAZYN
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => onAddPaleta('OKLEINIARKA')}
        >
          Nowa paleta - OKLEINIARKA
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => onAddPaleta('WIERCENIE')}
        >
          Nowa paleta - WIERCENIE
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => onAddPaleta('CIECIE')}
        >
          Nowa paleta - CIĘCIE
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => onAddPaleta('WYSYLKA')}
        >
          Nowa paleta - WYSYŁKA
        </Button>
        
        {paletCount > 0 && (
          <>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={onSaveAll}
              loading={saving}
            >
              Zapisz wszystkie ({niepustePaletCount})
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={onDeleteAll}
            >
              Usuń wszystkie
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
};
