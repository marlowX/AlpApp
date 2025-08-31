import React from 'react';
import { Table, Button, Space, Tag, Tooltip, Popconfirm, Typography, Badge, Progress } from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  AppstoreOutlined,
  FileTextOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface FormatkaDetail {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  kolor?: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  pozycja_id?: number;
  numer_pozycji?: number;
  nazwa_plyty?: string;
  kolor_plyty?: string;
  przeznaczenie?: string;
  kierunek?: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  waga_kg?: number;
  kolory_na_palecie: string;
  formatki_szczegoly?: FormatkaDetail[];
  formatki?: FormatkaDetail[];
  procent_wykorzystania?: number;
}

interface PaletyTableProps {
  palety: Paleta[];
  loading: boolean;
  onViewDetails: (paleta: Paleta) => void;
  onDelete?: (paletaId: number) => void;
  deletingId?: number | null;
  renderFormatkiColumn?: (paleta: Paleta) => React.ReactNode;
}

export const PaletyTable: React.FC<PaletyTableProps> = ({
  palety,
  loading,
  onViewDetails,
  onDelete,
  deletingId,
  renderFormatkiColumn
}) => {
  
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'PRZYGOTOWANE': 'blue',
      'W_PRODUKCJI': 'orange',
      'WYPRODUKOWANE': 'green',
      'WYSLANE': 'purple',
      'DOSTARCZONE': 'cyan'
    };
    return statusColors[status] || 'default';
  };

  const getPrzeznaczenieBadge = (przeznaczenie?: string) => {
    const icons: Record<string, string> = {
      'MAGAZYN': '📦',
      'OKLEINIARKA': '🎨',
      'WIERCENIE': '🔧',
      'CIECIE': '✂️',
      'WYSYLKA': '🚚'
    };
    
    const colors: Record<string, string> = {
      'MAGAZYN': 'blue',
      'OKLEINIARKA': 'orange',
      'WIERCENIE': 'purple',
      'CIECIE': 'red',
      'WYSYLKA': 'green'
    };

    if (!przeznaczenie) return null;

    return (
      <Tag color={colors[przeznaczenie] || 'default'}>
        {icons[przeznaczenie]} {przeznaczenie}
      </Tag>
    );
  };

  const renderFormatki = (paleta: Paleta) => {
    const formatki = paleta.formatki || paleta.formatki_szczegoly || [];
    
    if (formatki.length === 0) {
      return <Text type="secondary">Brak formatek</Text>;
    }

    // Pokaż pierwsze 3 formatki
    const visibleFormatki = formatki.slice(0, 3);
    const remainingCount = formatki.length - 3;

    return (
      <Space direction="vertical" size={0}>
        {visibleFormatki.map((f, index) => (
          <div key={f.formatka_id || index} style={{ fontSize: 12 }}>
            <Text>{f.nazwa}: </Text>
            <Text strong>{f.ilosc} szt.</Text>
            {f.kolor && (
              <Tag 
                style={{ 
                  marginLeft: 4, 
                  fontSize: 10,
                  padding: '0 4px',
                  lineHeight: '16px'
                }}
              >
                {f.kolor}
              </Tag>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            +{remainingCount} więcej...
          </Text>
        )}
        <div style={{ marginTop: 4 }}>
          <Text strong style={{ fontSize: 11, color: '#1890ff' }}>
            Razem: {paleta.sztuk_total || paleta.ilosc_formatek || 0} szt.
          </Text>
        </div>
      </Space>
    );
  };

  const columns: ColumnsType<Paleta> = [
    {
      title: 'Paleta',
      dataIndex: 'numer_palety',
      key: 'numer_palety',
      width: 150,
      render: (text: string, record: Paleta) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 12 }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            ID: {record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Pozycja',
      key: 'pozycja',
      width: 120,
      render: (_, record: Paleta) => {
        if (!record.pozycja_id) {
          return <Text type="secondary">-</Text>;
        }
        
        return (
          <Space direction="vertical" size={0}>
            <Badge 
              count={record.numer_pozycji || record.pozycja_id} 
              style={{ backgroundColor: '#52c41a' }}
            />
            {record.nazwa_plyty && (
              <Text style={{ fontSize: 11 }}>{record.nazwa_plyty}</Text>
            )}
            {record.kolor_plyty && (
              <Tag style={{ fontSize: 10, margin: 0 }}>
                <BgColorsOutlined /> {record.kolor_plyty}
              </Tag>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status?.replace(/_/g, ' ') || 'NIEZNANY'}
        </Tag>
      ),
    },
    {
      title: 'Przeznaczenie',
      key: 'przeznaczenie',
      width: 130,
      render: (_, record: Paleta) => getPrzeznaczenieBadge(record.przeznaczenie || record.kierunek),
    },
    {
      title: 'Kolory',
      dataIndex: 'kolory_na_palecie',
      key: 'kolory',
      width: 150,
      render: (kolory: string) => {
        if (!kolory) return <Text type="secondary">-</Text>;
        
        const koloryArray = kolory.split(',').map(k => k.trim());
        return (
          <Space size={4} wrap>
            {koloryArray.map((kolor, index) => (
              <Tag key={index} style={{ fontSize: 11 }}>
                {kolor}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Formatki',
      key: 'formatki',
      width: 200,
      render: renderFormatkiColumn || renderFormatki,
    },
    {
      title: 'Wysokość',
      dataIndex: 'wysokosc_stosu',
      key: 'wysokosc',
      width: 100,
      render: (wysokosc: number) => {
        const wysokoscNum = Number(wysokosc) || 0;
        return (
          <Space direction="vertical" size={0}>
            <Text>{wysokoscNum} mm</Text>
            <Progress 
              percent={Math.round((wysokoscNum / 1440) * 100)} 
              size="small" 
              showInfo={false}
              strokeColor={wysokoscNum > 1440 ? '#ff4d4f' : '#52c41a'}
            />
          </Space>
        );
      },
    },
    {
      title: 'Waga',
      dataIndex: 'waga_kg',
      key: 'waga',
      width: 100,
      render: (waga?: number | string) => {
        if (!waga && waga !== 0) return <Text type="secondary">-</Text>;
        
        const wagaNum = Number(waga);
        if (!Number.isFinite(wagaNum)) return <Text type="secondary">-</Text>;
        
        return (
          <Space direction="vertical" size={0}>
            <Text>{wagaNum.toFixed(1)} kg</Text>
            <Progress 
              percent={Math.round((wagaNum / 700) * 100)} 
              size="small" 
              showInfo={false}
              strokeColor={wagaNum > 700 ? '#ff4d4f' : '#52c41a'}
            />
          </Space>
        );
      },
    },
    {
      title: 'Wykorzystanie',
      key: 'wykorzystanie',
      width: 100,
      render: (_, record: Paleta) => {
        const percent = Number(record.procent_wykorzystania) || 0;
        return (
          <Space direction="vertical" size={0} align="center">
            <Text strong>{percent}%</Text>
            <Progress 
              type="circle" 
              percent={percent} 
              width={40}
              strokeColor={
                percent >= 80 ? '#52c41a' :
                percent >= 50 ? '#faad14' : '#ff4d4f'
              }
            />
          </Space>
        );
      },
    },
    {
      title: 'Akcje',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record: Paleta) => (
        <Space size="small">
          <Tooltip title="Zobacz szczegóły">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
            />
          </Tooltip>
          {onDelete && (
            <Popconfirm
              title="Czy na pewno usunąć tę paletę?"
              onConfirm={() => onDelete(record.id)}
              okText="Usuń"
              cancelText="Anuluj"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Oblicz sumy dla podsumowania - z zabezpieczeniem przed NaN
  const totalSztuk = palety.reduce((sum, p) => {
    const val = Number(p.sztuk_total || p.ilosc_formatek || 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);
  
  const totalWysokosc = palety.reduce((sum, p) => {
    const val = Number(p.wysokosc_stosu || 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);
  
  const totalWaga = palety.reduce((sum, p) => {
    const val = Number(p.waga_kg || 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);

  return (
    <Table
      columns={columns}
      dataSource={palety}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Łącznie ${total} palet`,
      }}
      scroll={{ x: 1300 }}
      size="small"
      summary={() => (
        palety.length > 0 ? (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6}>
                <Text strong>Podsumowanie</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                <Text strong>
                  {totalSztuk} szt.
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <Text strong>
                  {totalWysokosc} mm
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8}>
                <Text strong>
                  {totalWaga.toFixed(1)} kg
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} />
              <Table.Summary.Cell index={10} />
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      )}
    />
  );
};