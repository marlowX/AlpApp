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
      'przygotowanie': 'orange',
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

    if (!przeznaczenie) return <Tag color="default">📋 Nie określono</Tag>;

    return (
      <Tag color={colors[przeznaczenie] || 'default'}>
        {icons[przeznaczenie]} {przeznaczenie}
      </Tag>
    );
  };

  const renderFormatki = (paleta: Paleta) => {
    const formatki = paleta.formatki || paleta.formatki_szczegoly || [];
    
    if (formatki.length === 0) {
      return <Text type="secondary" style={{ fontSize: 11 }}>Brak formatek</Text>;
    }

    // Grupuj formatki po kolorach
    const formatkiByColor = formatki.reduce((acc, f) => {
      const key = f.kolor || 'Bez koloru';
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {} as Record<string, FormatkaDetail[]>);

    const colorKeys = Object.keys(formatkiByColor);
    const firstColors = colorKeys.slice(0, 2);
    const remainingColors = colorKeys.length - 2;
    
    const totalSztuk = formatki.reduce((sum, f) => sum + f.ilosc, 0);

    return (
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        {/* Pokaż pierwsze 2 kolory */}
        {firstColors.map(color => {
          const colorFormatki = formatkiByColor[color];
          const colorTotal = colorFormatki.reduce((sum, f) => sum + f.ilosc, 0);
          
          return (
            <div key={color} style={{ marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <BgColorsOutlined style={{ fontSize: 10, color: '#666' }} />
                <Text strong style={{ fontSize: 11 }}>
                  {color}:
                </Text>
                <Text style={{ fontSize: 11, color: '#1890ff' }}>
                  {colorTotal} szt.
                </Text>
              </div>
              {/* Pokaż pierwsze 2 formatki tego koloru */}
              {colorFormatki.slice(0, 2).map((f, idx) => (
                <div key={f.formatka_id || idx} style={{ marginLeft: 14, fontSize: 10, color: '#666' }}>
                  {f.nazwa}: {f.ilosc} szt.
                </div>
              ))}
              {colorFormatki.length > 2 && (
                <div style={{ marginLeft: 14, fontSize: 10, color: '#999' }}>
                  +{colorFormatki.length - 2} więcej...
                </div>
              )}
            </div>
          );
        })}
        
        {remainingColors > 0 && (
          <Text type="secondary" style={{ fontSize: 10 }}>
            +{remainingColors} kolorów więcej...
          </Text>
        )}
        
        {/* Podsumowanie */}
        <div style={{ 
          marginTop: 4, 
          paddingTop: 4, 
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Text strong style={{ fontSize: 11, color: '#1890ff' }}>
            Razem:
          </Text>
          <Text strong style={{ fontSize: 11, color: '#1890ff' }}>
            {totalSztuk} szt.
          </Text>
        </div>
      </Space>
    );
  };

  const columns: ColumnsType<Paleta> = [
    {
      title: 'Nr Palety',
      dataIndex: 'numer_palety',
      key: 'numer_palety',
      width: 140,
      render: (text: string, record: Paleta) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 12 }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>
            ID: {record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Pozycja',
      key: 'pozycja',
      width: 150,
      render: (_, record: Paleta) => {
        // NAPRAWIONE: Pokaż dokładne informacje o pozycji
        if (!record.pozycja_id) {
          return <Text type="secondary" style={{ fontSize: 11 }}>Nie określono</Text>;
        }
        
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            {/* Numer pozycji z badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge 
                count={record.numer_pozycji || record.pozycja_id} 
                style={{ 
                  backgroundColor: '#52c41a',
                  fontSize: '10px',
                  height: '18px',
                  lineHeight: '18px',
                  minWidth: '18px'
                }}
              />
              <Text strong style={{ fontSize: 12, color: '#1890ff' }}>
                #{record.numer_pozycji || record.pozycja_id}
              </Text>
            </div>
            
            {/* Nazwa płyty */}
            {record.nazwa_plyty && (
              <Text style={{ fontSize: 11, lineHeight: '14px' }}>
                {record.nazwa_plyty.length > 20 ? 
                  `${record.nazwa_plyty.substring(0, 20)}...` : 
                  record.nazwa_plyty
                }
              </Text>
            )}
            
            {/* Kolor płyty */}
            {record.kolor_plyty && (
              <Tag style={{ 
                fontSize: 9, 
                margin: 0, 
                padding: '0 4px',
                lineHeight: '16px',
                marginTop: 2
              }}>
                <BgColorsOutlined style={{ fontSize: 8 }} /> {record.kolor_plyty}
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
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontSize: 10 }}>
          {status?.replace(/_/g, ' ')?.toUpperCase() || 'NIEZNANY'}
        </Tag>
      ),
    },
    {
      title: 'Przeznaczenie',
      key: 'przeznaczenie',
      width: 120,
      render: (_, record: Paleta) => getPrzeznaczenieBadge(record.przeznaczenie || record.kierunek),
    },
    {
      title: 'Formatki na palecie',
      key: 'formatki',
      width: 220,
      render: renderFormatkiColumn || renderFormatki,
    },
    {
      title: 'Wysokość',
      dataIndex: 'wysokosc_stosu',
      key: 'wysokosc',
      width: 90,
      render: (wysokosc: number) => {
        const wysokoscNum = Number(wysokosc) || 0;
        const percent = Math.round((wysokoscNum / 1440) * 100);
        
        return (
          <Space direction="vertical" size={2} align="center">
            <Text style={{ fontSize: 11 }}>{wysokoscNum} mm</Text>
            <Progress 
              percent={percent} 
              size="small" 
              showInfo={false}
              strokeWidth={6}
              strokeColor={wysokoscNum > 1440 ? '#ff4d4f' : wysokoscNum > 1200 ? '#faad14' : '#52c41a'}
              style={{ width: 60 }}
            />
            <Text style={{ fontSize: 9, color: '#666' }}>{percent}%</Text>
          </Space>
        );
      },
    },
    {
      title: 'Waga',
      dataIndex: 'waga_kg',
      key: 'waga',
      width: 90,
      render: (waga?: number | string) => {
        if (!waga && waga !== 0) return <Text type="secondary">-</Text>;
        
        const wagaNum = Number(waga);
        if (!Number.isFinite(wagaNum)) return <Text type="secondary">-</Text>;
        
        const percent = Math.round((wagaNum / 700) * 100);
        
        return (
          <Space direction="vertical" size={2} align="center">
            <Text style={{ fontSize: 11 }}>{wagaNum.toFixed(1)} kg</Text>
            <Progress 
              percent={percent} 
              size="small" 
              showInfo={false}
              strokeWidth={6}
              strokeColor={wagaNum > 700 ? '#ff4d4f' : wagaNum > 500 ? '#faad14' : '#52c41a'}
              style={{ width: 60 }}
            />
            <Text style={{ fontSize: 9, color: '#666' }}>{percent}%</Text>
          </Space>
        );
      },
    },
    {
      title: 'Akcje',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record: Paleta) => (
        <Space size="small" direction="vertical">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetails(record)}
            style={{ fontSize: 10, height: 24, padding: '0 8px' }}
          >
            Zobacz
          </Button>
          {onDelete && (
            <Popconfirm
              title="Usunąć paletę?"
              description={`Czy na pewno usunąć paletę ${record.numer_palety}?`}
              onConfirm={() => onDelete(record.id)}
              okText="Usuń"
              cancelText="Anuluj"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
                style={{ fontSize: 10, height: 24, padding: '0 8px' }}
              >
                Usuń
              </Button>
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
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} z ${total} palet`,
        pageSizeOptions: ['5', '10', '20', '50']
      }}
      scroll={{ x: 1200 }}
      size="small"
      summary={() => (
        palety.length > 0 ? (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text strong style={{ color: '#1890ff' }}>
                  📊 Podsumowanie ({palety.length} palet)
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <Text strong style={{ color: '#52c41a' }}>
                  {totalSztuk} szt.
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <Text strong style={{ color: '#faad14' }}>
                  {totalWysokosc} mm
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                <Text strong style={{ color: '#1890ff' }}>
                  {totalWaga.toFixed(1)} kg
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} />
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      )}
    />
  );
};