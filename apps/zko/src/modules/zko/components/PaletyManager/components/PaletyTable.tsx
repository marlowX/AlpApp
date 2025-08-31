import React from 'react';
import { Table, Button, Space, Tag, Tooltip, Popconfirm, Typography, Badge, Progress } from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  EditOutlined,
  BgColorsOutlined,
  NumberOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface FormatkaDetail {
  formatka_id: number;
  pozycja_id?: number;
  ilosc: number;
  nazwa: string;
  dlugosc?: number;
  szerokosc?: number;
  kolor?: string;
  nazwa_plyty?: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  pozycja_id?: number;
  pozycje_lista?: string;
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
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (paletaId: number) => void;
  deletingId?: number | null;
  renderFormatkiColumn?: (paleta: Paleta) => React.ReactNode;
}

export const PaletyTable: React.FC<PaletyTableProps> = ({
  palety,
  loading,
  onViewDetails,
  onEdit,
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

    // Grupuj formatki według pozycji
    const formatkiByPozycja = formatki.reduce((acc, f) => {
      const pozId = f.pozycja_id || 'unknown';
      if (!acc[pozId]) {
        acc[pozId] = [];
      }
      acc[pozId].push(f);
      return acc;
    }, {} as Record<string, FormatkaDetail[]>);

    // Wyświetl wszystkie formatki zgrupowane według pozycji
    const allFormatki: JSX.Element[] = [];
    let totalCount = 0;
    
    Object.entries(formatkiByPozycja).forEach(([pozycjaId, pozFormatki]) => {
      // Dodaj nagłówek pozycji jeśli jest więcej niż jedna pozycja
      if (Object.keys(formatkiByPozycja).length > 1 && pozycjaId !== 'unknown') {
        allFormatki.push(
          <div key={`header-${pozycjaId}`} style={{ marginTop: totalCount > 0 ? 8 : 0, marginBottom: 4 }}>
            <Tag 
              color="blue" 
              style={{ 
                fontSize: 11, 
                padding: '0 6px',
                margin: 0
              }}
            >
              <NumberOutlined style={{ fontSize: 10, marginRight: 2 }} />
              Pozycja {pozycjaId}
            </Tag>
          </div>
        );
      }
      
      // Sortuj formatki według wymiarów (największe najpierw)
      const sortedFormatki = pozFormatki.sort((a, b) => {
        const aSize = (a.dlugosc || 0) * (a.szerokosc || 0);
        const bSize = (b.dlugosc || 0) * (b.szerokosc || 0);
        return bSize - aSize;
      });
      
      // Wyświetl formatki
      sortedFormatki.forEach((f) => {
        // Formatuj nazwę formatki - preferuj wymiary
        let formatkaName = '';
        if (f.dlugosc && f.szerokosc) {
          // Usuń .00 z wymiarów dla lepszej czytelności
          const dl = Number(f.dlugosc).toFixed(0);
          const sz = Number(f.szerokosc).toFixed(0);
          formatkaName = `${dl}×${sz}`;
        } else if (f.nazwa) {
          // Wyciągnij wymiary z nazwy jeśli są (np. "800x180 - WOTAN" -> "800×180")
          const match = f.nazwa.match(/(\d+)x(\d+)/i);
          if (match) {
            formatkaName = `${match[1]}×${match[2]}`;
          } else {
            formatkaName = f.nazwa;
          }
        } else {
          formatkaName = 'Formatka';
        }
        
        allFormatki.push(
          <div 
            key={`${pozycjaId}-${f.formatka_id}-${totalCount}`} 
            style={{ 
              fontSize: 12, 
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Text strong style={{ minWidth: '80px' }}>{formatkaName}</Text>
            <Text type="secondary">→</Text>
            <Text strong style={{ color: '#1890ff' }}>{f.ilosc} szt.</Text>
          </div>
        );
        totalCount++;
      });
    });

    // Oblicz łączną sumę sztuk
    const totalSztuk = formatki.reduce((sum, f) => sum + (f.ilosc || 0), 0);

    return (
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {allFormatki}
        </div>
        {formatki.length > 0 && (
          <div style={{ 
            marginTop: 6, 
            paddingTop: 6, 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text strong style={{ fontSize: 11, color: '#52c41a' }}>
              Σ {totalSztuk} szt.
            </Text>
            <Text type="secondary" style={{ fontSize: 10 }}>
              {formatki.length} typów
            </Text>
          </div>
        )}
      </Space>
    );
  };

  const columns: ColumnsType<Paleta> = [
    {
      title: 'Paleta',
      dataIndex: 'numer_palety',
      key: 'numer_palety',
      width: 150,
      fixed: 'left',
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
      title: 'Pozycje',
      key: 'pozycje',
      width: 100,
      render: (_, record: Paleta) => {
        if (!record.pozycje_lista) {
          return <Text type="secondary">-</Text>;
        }
        
        // Parsuj listę pozycji (np. "Poz.62, Poz.63")
        const pozycje = record.pozycje_lista.split(',').map(p => p.trim());
        
        return (
          <Space direction="vertical" size={2}>
            {pozycje.map((poz, idx) => (
              <Tag 
                key={idx}
                color="blue" 
                style={{ 
                  fontSize: 11,
                  margin: 0,
                  padding: '0 6px'
                }}
              >
                <NumberOutlined style={{ fontSize: 10, marginRight: 2 }} />
                {poz}
              </Tag>
            ))}
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
        
        const koloryArray = kolory.split(',').map(k => k.trim()).filter(k => k);
        return (
          <Space size={4} wrap>
            {koloryArray.map((kolor, index) => (
              <Tag key={index} style={{ fontSize: 11 }}>
                <BgColorsOutlined style={{ fontSize: 10, marginRight: 2 }} />
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
      width: 250,
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
      width: 120,
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
          {onEdit && (
            <Tooltip title="Edytuj paletę">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          )}
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
      scroll={{ x: 'max-content' }}
      size="small"
      style={{ width: '100%' }}
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