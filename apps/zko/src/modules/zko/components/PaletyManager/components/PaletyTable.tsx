import React from 'react';
import { Table, Space, Tag, Button, Badge, Tooltip, Modal, Typography } from 'antd';
import { SwapOutlined, ColumnHeightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface FormatkaDetail {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  kolor: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: FormatkaDetail[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
}

interface PaletyTableProps {
  palety: Paleta[];
  loading: boolean;
  onViewDetails: (paleta: Paleta) => void;
  onTransferFormatki?: (paleta: Paleta) => void;
  onClosePaleta?: (paletaId: number) => void;
  renderFormatkiColumn?: (paleta: Paleta) => React.ReactNode;
}

export const PaletyTable: React.FC<PaletyTableProps> = ({
  palety,
  loading,
  onViewDetails,
  onTransferFormatki,
  onClosePaleta,
  renderFormatkiColumn
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
    if (wysokosc > 1440) return '#ff4d4f';
    if (wysokosc > 1200) return '#faad14';
    return '#52c41a';
  };

  const handleClosePaleta = (record: Paleta) => {
    Modal.confirm({
      title: 'Zamknięcie palety',
      content: `Czy na pewno chcesz zamknąć paletę ${record.numer_palety || `PAL-${record.id}`}?`,
      okText: 'Zamknij',
      cancelText: 'Anuluj',
      onOk: () => onClosePaleta?.(record.id)
    });
  };

  const renderFormatkiInfo = (paleta: Paleta) => {
    if (renderFormatkiColumn) {
      return renderFormatkiColumn(paleta);
    }

    const sztuk = paleta.sztuk_total || paleta.ilosc_formatek || 0;
    
    if (paleta.formatki_szczegoly && paleta.formatki_szczegoly.length > 0) {
      return (
        <Tooltip
          title={
            <div>
              <strong>Szczegóły formatek:</strong>
              {paleta.formatki_szczegoly.map((f: FormatkaDetail) => (
                <div key={f.formatka_id}>
                  {f.nazwa}: <strong>{f.ilosc}</strong> szt.
                </div>
              ))}
            </div>
          }
        >
          <Space>
            <Badge 
              count={sztuk} 
              overflowCount={999}
              style={{ backgroundColor: sztuk > 0 ? '#1890ff' : '#d9d9d9' }}
            />
            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
          </Space>
        </Tooltip>
      );
    }

    return (
      <Badge 
        count={sztuk} 
        overflowCount={999}
        style={{ backgroundColor: sztuk > 0 ? '#1890ff' : '#d9d9d9' }}
      />
    );
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
      render: (kolory: string) => {
        if (!kolory) return <Text type="secondary">-</Text>;
        
        const kolorList = kolory.split(',').map(k => {
          const parts = k.trim().split(' x');
          return parts[0];
        });
        
        const uniqueKolory = [...new Set(kolorList)];
        
        return uniqueKolory.map(k => 
          <Tag key={k} color="blue">{k}</Tag>
        );
      }
    },
    {
      title: 'Formatek',
      key: 'formatki',
      align: 'center',
      render: (_: any, record: Paleta) => renderFormatkiInfo(record)
    },
    {
      title: 'Wysokość',
      dataIndex: 'wysokosc_stosu',
      key: 'wysokosc_stosu',
      render: (wysokosc: number) => {
        const value = Number(wysokosc) || 0;
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
      title: 'Waga',
      dataIndex: 'waga_kg',
      key: 'waga_kg',
      render: (waga: any) => {
        // Konwertuj do liczby i sprawdź czy jest poprawna
        const wagaNum = Number(waga);
        if (!waga || isNaN(wagaNum)) return <Text type="secondary">-</Text>;
        
        const color = wagaNum > 700 ? '#ff4d4f' : wagaNum > 600 ? '#faad14' : '#52c41a';
        return (
          <Text style={{ color }}>
            {wagaNum.toFixed(1)} kg
          </Text>
        );
      }
    },
    {
      title: 'Wykorzystanie',
      dataIndex: 'procent_wykorzystania',
      key: 'procent_wykorzystania',
      render: (procent: any) => {
        const procentNum = Number(procent);
        if (procent === undefined || procent === null || isNaN(procentNum)) {
          return <Text type="secondary">-</Text>;
        }
        
        const color = procentNum < 50 ? '#ff4d4f' : procentNum < 75 ? '#faad14' : '#52c41a';
        return (
          <Text style={{ color }}>
            {Math.round(procentNum)}%
          </Text>
        );
      }
    },
    {
      title: 'Akcje',
      key: 'actions',
      render: (_: any, record: Paleta) => {
        const sztuk = record.sztuk_total || record.ilosc_formatek || 0;
        
        return (
          <Space>
            <Tooltip title="Szczegóły">
              <Button 
                size="small" 
                onClick={() => onViewDetails(record)}
              >
                Podgląd
              </Button>
            </Tooltip>
            {onTransferFormatki && (
              <Tooltip title="Przenieś formatki">
                <Button 
                  size="small" 
                  icon={<SwapOutlined />}
                  onClick={() => onTransferFormatki(record)}
                  disabled={sztuk === 0}
                />
              </Tooltip>
            )}
            {onClosePaleta && record.status?.toLowerCase() === 'otwarta' && (
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
        );
      }
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