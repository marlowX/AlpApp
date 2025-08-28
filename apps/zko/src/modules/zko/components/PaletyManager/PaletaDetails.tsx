import React from 'react';
import { Modal, Descriptions, Tag, Space, Typography, Table } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  ilosc_formatek: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids: number[];
}

interface PaletaDetailsProps {
  visible: boolean;
  paleta: Paleta;
  onClose: () => void;
}

export const PaletaDetails: React.FC<PaletaDetailsProps> = ({
  visible,
  paleta,
  onClose
}) => {
  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          Szczegóły palety: {paleta.numer_palety}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Numer palety" span={1}>
          {paleta.numer_palety}
        </Descriptions.Item>
        <Descriptions.Item label="Status" span={1}>
          <Tag>{paleta.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Kierunek układania" span={1}>
          {paleta.kierunek}
        </Descriptions.Item>
        <Descriptions.Item label="Ilość formatek" span={1}>
          {paleta.ilosc_formatek}
        </Descriptions.Item>
        <Descriptions.Item label="Wysokość stosu" span={1}>
          {paleta.wysokosc_stosu} mm
        </Descriptions.Item>
        <Descriptions.Item label="Kolory na palecie" span={1}>
          {paleta.kolory_na_palecie || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="ID formatek" span={2}>
          {paleta.formatki_ids?.length > 0 ? (
            <Text code>{paleta.formatki_ids.join(', ')}</Text>
          ) : (
            <Text type="secondary">Brak formatek</Text>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};
