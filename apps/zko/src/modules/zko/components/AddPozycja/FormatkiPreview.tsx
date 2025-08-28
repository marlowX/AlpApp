import React from 'react';
import { Table, Typography } from 'antd';
import type { Formatka } from './types';

const { Text } = Typography;

interface FormatkiPreviewProps {
  formatki: Formatka[];
  title?: string;
}

export const FormatkiPreview: React.FC<FormatkiPreviewProps> = ({
  formatki,
  title = "Formatki w rozkroju"
}) => {
  
  const columns = [
    {
      title: 'Formatka',
      dataIndex: 'nazwa_formatki',
      key: 'nazwa_formatki',
      width: '30%',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Wymiary (D×S)',
      key: 'wymiary',
      width: '30%',
      render: (record: Formatka) => (
        <Text code>{record.dlugosc}×{record.szerokosc}</Text>
      )
    },
    {
      title: 'Szt/płytę',
      dataIndex: 'ilosc_sztuk',
      key: 'ilosc_sztuk',
      width: '20%',
      align: 'center' as const,
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>{value}</Text>
      )
    },
    {
      title: 'Typ',
      dataIndex: 'typ_plyty',
      key: 'typ_plyty',
      width: '20%',
      render: (typ: string) => (
        <Text type={typ === 'laminat' ? undefined : 'secondary'}>
          {typ || 'laminat'}
        </Text>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Text strong>
          {title} ({formatki.length})
        </Text>
      </div>
      <Table
        columns={columns}
        dataSource={formatki.map((f, index) => ({ ...f, key: index }))}
        size="small"
        pagination={false}
        // Usunięte scroll - to powodowało problem
        style={{ overflow: 'hidden' }}
        locale={{
          emptyText: 'Brak formatek w rozkroju'
        }}
      />
    </div>
  );
};
