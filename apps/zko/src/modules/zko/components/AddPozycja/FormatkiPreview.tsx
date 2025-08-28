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
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Wymiary (D×S)',
      key: 'wymiary',
      render: (record: Formatka) => (
        <Text code>{record.dlugosc}×{record.szerokosc}</Text>
      )
    },
    {
      title: 'Szt/płytę',
      dataIndex: 'ilosc_sztuk',
      key: 'ilosc_sztuk',
      align: 'center' as const,
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>{value}</Text>
      )
    },
    {
      title: 'Typ',
      dataIndex: 'typ_plyty',
      key: 'typ_plyty',
      render: (typ: string) => (
        <Text type={typ === 'laminat' ? undefined : 'secondary'}>
          {typ}
        </Text>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={formatki}
      rowKey="nazwa_formatki"
      size="small"
      pagination={false}
      scroll={{ y: 200 }}
      title={() => (
        <Text strong>
          {title} ({formatki.length})
        </Text>
      )}
    />
  );
};
