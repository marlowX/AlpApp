import React from 'react';
import { Table, Space, Tag, Button, Badge, Tooltip, Modal, Typography, Popconfirm } from 'antd';
import { 
  SwapOutlined, 
  ColumnHeightOutlined, 
  InfoCircleOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface FormatkaDetail {
  formatka_id: number;
  ilosc: number;
  nazwa?: string;
  dlugosc?: number;
  szerokosc?: number;
  kolor?: string;
  pozycja_id?: number;
}

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek?: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu?: number;
  kolory_na_palecie?: string;
  formatki_ids?: number[];
  formatki_szczegoly?: FormatkaDetail[];
  formatki?: any[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  przeznaczenie?: string;
  pozycja_id?: number;
  pozycje_info?: string;
}

interface PaletyTableProps {
  palety: Paleta[];
  loading: boolean;
  onViewDetails: (paleta: Paleta) => void;
  onTransferFormatki?: (paleta: Paleta) => void;
  onClosePaleta?: (paletaId: number) => void;
  onDelete?: (paletaId: number) => void;
  deletingId?: number | null;
  renderFormatkiColumn?: (paleta: Paleta) => React.ReactNode;
}

export const PaletyTable: React.FC<PaletyTableProps> = ({
  palety,
  loading,
  onViewDetails,
  onTransferFormatki,
  onClosePaleta,
  onDelete,
  deletingId,
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

  const getPrzeznaczenieBadge = (przeznaczenie?: string) => {
    if (!przeznaczenie) return null;
    
    const icons: Record<string, string> = {
      'MAGAZYN': '📦',
      'OKLEINIARKA': '🎨',
      'WIERCENIE': '🔧',
      'CIECIE': '✂️',
      'WYSYLKA': '📤'
    };
    
    const colors: Record<string, string> = {
      'MAGAZYN': 'blue',
      'OKLEINIARKA': 'purple',
      'WIERCENIE': 'orange',
      'CIECIE': 'cyan',
      'WYSYLKA': 'green'
    };
    
    return (
      <Tag color={colors[przeznaczenie] || 'default'}>
        {icons[przeznaczenie] || ''} {przeznaczenie}
      </Tag>
    );
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

  // Funkcja obliczająca wagę na podstawie formatek - ZABEZPIECZONA
  const calculateWeight = (paleta: Paleta): number => {
    try {
      // Jeśli mamy wagę z API, zwróć ją
      const wagaZApi = parseFloat(String(paleta.waga_kg || 0));
      if (!isNaN(wagaZApi) && wagaZApi > 0) {
        return wagaZApi;
      }
      
      // Jeśli mamy formatki, oblicz wagę
      if (paleta.formatki && Array.isArray(paleta.formatki)) {
        let totalWeight = 0;
        paleta.formatki.forEach((f: any) => {
          const sztuk = parseInt(String(f.ilosc || f.sztuk || 0));
          const dlugosc = parseFloat(String(f.dlugosc || 0));
          const szerokosc = parseFloat(String(f.szerokosc || 0));
          
          // Zakładamy wagę 12.6 kg/m² dla płyty 18mm
          const powierzchnia = (dlugosc * szerokosc) / 1000000; // m²
          const wagaSztuki = powierzchnia * 12.6; // kg
          
          if (!isNaN(wagaSztuki) && !isNaN(sztuk)) {
            totalWeight += sztuk * wagaSztuki;
          }
        });
        
        if (totalWeight > 0) {
          return totalWeight;
        }
      }
      
      // Domyślna waga na podstawie ilości formatek (przybliżenie)
      const sztuk = parseInt(String(paleta.sztuk_total || paleta.ilosc_formatek || 0));
      if (!isNaN(sztuk) && sztuk > 0) {
        return sztuk * 0.5; // Zakładamy średnio 0.5 kg na formatkę
      }
      
      return 0;
    } catch (error) {
      console.error('Error calculating weight:', error);
      return 0;
    }
  };

  const renderFormatkiInfo = (paleta: Paleta) => {
    if (renderFormatkiColumn) {
      return renderFormatkiColumn(paleta);
    }

    const sztuk = paleta.sztuk_total || paleta.ilosc_formatek || 0;
    
    // Sprawdź różne warianty danych formatek
    const formatki = paleta.formatki_szczegoly || paleta.formatki || [];
    
    // Informacja o pozycjach
    let pozycjeInfo = '';
    if (paleta.pozycje_info) {
      pozycjeInfo = paleta.pozycje_info;
    } else if (paleta.pozycja_id) {
      pozycjeInfo = `Pozycja: ${paleta.pozycja_id}`;
    } else if (formatki.length > 0) {
      const pozycje = [...new Set(formatki.map((f: any) => f.pozycja_id).filter(Boolean))];
      if (pozycje.length > 0) {
        pozycjeInfo = `Pozycje: ${pozycje.join(', ')}`;
      }
    }
    
    if (formatki.length > 0) {
      return (
        <Tooltip
          title={
            <div>
              {pozycjeInfo && <div style={{ marginBottom: 8 }}><strong>{pozycjeInfo}</strong></div>}
              <strong>Szczegóły formatek:</strong>
              {formatki.map((f: any, index: number) => (
                <div key={f.formatka_id || index}>
                  {f.nazwa || `Formatka ${f.formatka_id || index + 1}`}: <strong>{f.ilosc || f.sztuk || 0}</strong> szt.
                  {f.pozycja_id && <Text type="secondary"> (poz. {f.pozycja_id})</Text>}
                </div>
              ))}
            </div>
          }
        >
          <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
            <Badge 
              count={sztuk} 
              overflowCount={999}
              style={{ backgroundColor: sztuk > 0 ? '#1890ff' : '#d9d9d9' }}
            />
            {pozycjeInfo && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {pozycjeInfo.length > 15 ? pozycjeInfo.substring(0, 15) + '...' : pozycjeInfo}
              </Text>
            )}
          </Space>
        </Tooltip>
      );
    }

    return (
      <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
        <Badge 
          count={sztuk} 
          overflowCount={999}
          style={{ backgroundColor: sztuk > 0 ? '#1890ff' : '#d9d9d9' }}
        />
        {pozycjeInfo && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {pozycjeInfo}
          </Text>
        )}
      </Space>
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
            {getPrzeznaczenieBadge(record.przeznaczenie)}
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
          {(status || 'PRZYGOTOWANE').toUpperCase()}
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
        
        return (
          <Space size={4} wrap>
            {uniqueKolory.map(k => 
              <Tag key={k} color="blue" style={{ margin: 2 }}>
                {k}
              </Tag>
            )}
          </Space>
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
      render: (wysokosc: any) => {
        const value = parseInt(String(wysokosc || 36)); // Domyślnie 36mm (2 warstwy po 18mm)
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
      key: 'waga_calculated',
      render: (_: any, record: Paleta) => {
        const waga = calculateWeight(record);
        const wagaNum = parseFloat(String(waga || 0));
        
        if (isNaN(wagaNum)) {
          return <Text type="secondary">-</Text>;
        }
        
        const color = wagaNum > 700 ? '#ff4d4f' : wagaNum > 600 ? '#faad14' : '#52c41a';
        
        return (
          <Tooltip title={record.waga_kg ? 'Waga z systemu' : 'Waga obliczona'}>
            <Text style={{ color }}>
              {wagaNum.toFixed(1)} kg
            </Text>
          </Tooltip>
        );
      }
    },
    {
      title: 'Wykorzystanie',
      dataIndex: 'procent_wykorzystania',
      key: 'procent_wykorzystania',
      render: (procent: any, record: Paleta) => {
        let procentNum = parseFloat(String(procent || 0));
        
        // Jeśli brak procentu, oblicz na podstawie wagi
        if (!procent || isNaN(procentNum)) {
          const waga = calculateWeight(record);
          procentNum = Math.min(100, Math.round((waga / 700) * 100));
        }
        
        if (isNaN(procentNum)) {
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
      width: 150,
      render: (_: any, record: Paleta) => {
        const sztuk = record.sztuk_total || record.ilosc_formatek || 0;
        
        return (
          <Space size="small">
            <Tooltip title="Szczegóły">
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(record)}
              />
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
            
            {onDelete && (
              <Popconfirm
                title="Czy na pewno usunąć paletę?"
                description={`Paleta ${record.numer_palety || `PAL-${record.id}`} zostanie trwale usunięta`}
                onConfirm={() => onDelete(record.id)}
                okText="Usuń"
                cancelText="Anuluj"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Usuń paletę">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingId === record.id}
                  />
                </Tooltip>
              </Popconfirm>
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
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Łącznie ${total} palet`,
        pageSizeOptions: ['10', '20', '50', '100']
      }}
      size="middle"
    />
  );
};