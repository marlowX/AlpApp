import React from 'react';
import { Table, Space, Tag, Button, Badge, Tooltip, Modal, Typography } from 'antd';
import { SwapOutlined, ColumnHeightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

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
  typ?: string;
  created_at?: string;
  updated_at?: string;
}

interface PaletyTableProps {
  palety: Paleta[];
  loading: boolean;
  onViewDetails: (paleta: Paleta) => void;
  onTransferFormatki: (paleta: Paleta) => void;
  onClosePaleta: (paletaId: number) => void;
}

export const PaletyTable: React.FC<PaletyTableProps> = ({
  palety,
  loading,
  onViewDetails,
  onTransferFormatki,
  onClosePaleta
}) => {
  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'otwarta': return 'processing';
      case 'zamknieta': return 'success';
      case 'wyslana': return 'warning';
      case 'przygotowanie': return 'default';
      case 'pakowanie': return 'processing';
      case 'zapakowana': return 'success';
      default: return 'default';
    }
  };

  const getWysokoscColor = (wysokosc: number) => {
    if (wysokosc > 1440) return '#ff4d4f'; // Za wysoka
    if (wysokosc > 1200) return '#faad14'; // Blisko limitu
    return '#52c41a'; // OK
  };

  const handleClosePaleta = (record: Paleta) => {
    Modal.confirm({
      title: 'Zamknięcie palety',
      content: `Czy na pewno chcesz zamknąć paletę ${record.numer_palety || `PAL-${record.id}`}?`,
      okText: 'Zamknij',
      cancelText: 'Anuluj',
      onOk: () => onClosePaleta(record.id)
    });
  };

  const columns: ColumnsType<Paleta> = [
    {
      title: 'Paleta',
      dataIndex: 'numer_palety',
      key: 'numer_palety',
      render: (text: string, record: Paleta) => (
        <Space direction="vertical" size="small">
          <Text strong>{text || `PAL-${record.id}`}</Text>
          <Space>
            <Tag>{record.typ || 'EURO'}</Tag>
            <Tag>{record.kierunek || 'wewnętrzny'}</Tag>
          </Space>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {(status || 'otwarta').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Kolory',
      dataIndex: 'kolory_na_palecie',
      key: 'kolory_na_palecie',
      render: (kolory: string) => (
        kolory ? kolory.split(',').map(k => 
          <Tag key={k} color="blue">{k.trim()}</Tag>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: 'Formatek',
      dataIndex: 'ilosc_formatek',
      key: 'ilosc_formatek',
      align: 'center',
      render: (ilosc: number) => (
        <Badge 
          count={ilosc || 0} 
          overflowCount={999}
          style={{ backgroundColor: ilosc > 0 ? '#1890ff' : '#d9d9d9' }}
        />
      )
    },
    {
      title: 'Wysokość stosu',
      dataIndex: 'wysokosc_stosu',
      key: 'wysokosc_stosu',
      render: (wysokosc: number) => {
        const value = wysokosc || 0;
        return (
          <Tooltip title={`${value > 1440 ? 'Za wysoka!' : value > 1200 ? 'Blisko limitu' : 'OK'}`}>
            <Space>
              <ColumnHeightOutlined style={{ color: getWysokoscColor(value) }} />
              <Text style={{ color: getWysokoscColor(value) }}>
                {value} mm
              </Text>
            </Space>
          </Tooltip>
        );
      }
    },
    {
      title: 'Akcje',
      key: 'actions',
      render: (_: any, record: Paleta) => (
        <Space>
          <Tooltip title="Szczegóły">
            <Button 
              size="small" 
              onClick={() => onViewDetails(record)}
            >
              Podgląd
            </Button>
          </Tooltip>
          <Tooltip title="Przenieś formatki">
            <Button 
              size="small" 
              icon={<SwapOutlined />}
              onClick={() => onTransferFormatki(record)}
              disabled={!record.ilosc_formatek || record.ilosc_formatek === 0}
            />
          </Tooltip>
          {record.status?.toLowerCase() === 'otwarta' && (
            <Tooltip title="Zamknij paletę">
              <Button
                size="small"
                type="link"
                danger
                onClick={() => handleClosePaleta(record)}
              >
                Zamknij
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={palety}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="middle"
    />
  );
};