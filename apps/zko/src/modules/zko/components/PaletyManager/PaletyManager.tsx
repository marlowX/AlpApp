import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  InputNumber, 
  message, 
  Tooltip,
  Badge,
  Typography,
  Alert,
  Spin
} from 'antd';
import { 
  AppstoreOutlined, 
  SwapOutlined, 
  PlusOutlined, 
  MinusOutlined,
  ReloadOutlined,
  ColumnHeightOutlined
} from '@ant-design/icons';
import { PaletaPrzeniesFormatki } from './PaletaPrzeniesFormatki';
import { PaletaDetails } from './PaletaDetails';

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

interface PaletyManagerProps {
  zkoId: number;
  onRefresh?: () => void;
}

export const PaletyManager: React.FC<PaletyManagerProps> = ({ 
  zkoId, 
  onRefresh 
}) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaleta, setSelectedPaleta] = useState<Paleta | null>(null);
  const [przeniesModalVisible, setPrzeniesModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [sourcePaleta, setSourcePaleta] = useState<Paleta | null>(null);
  const [targetPaleta, setTargetPaleta] = useState<Paleta | null>(null);

  useEffect(() => {
    fetchPalety();
  }, [zkoId]);

  const fetchPalety = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pallets/zko/${zkoId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPalety(data.palety || []);
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd pobierania palet');
      }
    } catch (error) {
      console.error('Error fetching palety:', error);
      message.error('Błąd pobierania palet');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanujPalety = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pallets/zko/${zkoId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_wysokosc_mm: 1440,
          max_formatek_na_palete: 200,
          grubosc_plyty: 18
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Zaplanowano palety');
          fetchPalety();
          onRefresh?.();
        } else {
          message.warning(result.komunikat || 'Nie udało się zaplanować palet');
        }
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd planowania palet');
      }
    } catch (error) {
      console.error('Error planning palety:', error);
      message.error('Błąd planowania palet');
    } finally {
      setLoading(false);
    }
  };

  const handleZmienIloscPalet = () => {
    let newCount = palety.length;
    
    Modal.confirm({
      title: 'Zmień ilość palet',
      content: (
        <div>
          <Text>Obecna ilość palet: <strong>{palety.length}</strong></Text>
          <br /><br />
          <Text>Nowa ilość:</Text>
          <InputNumber 
            min={1} 
            max={50} 
            defaultValue={palety.length}
            onChange={(value) => {
              newCount = value || palety.length;
            }}
            style={{ width: '100%', marginTop: 8 }}
          />
          <br /><br />
          <Alert
            message="Uwaga"
            description="Zmiana ilości palet spowoduje reorganizację formatek."
            type="warning"
            showIcon
          />
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/pallets/zko/${zkoId}/change-quantity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nowa_ilosc: newCount })
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.sukces) {
              message.success(result.komunikat || 'Zmieniono ilość palet');
              fetchPalety();
              onRefresh?.();
            } else {
              message.warning(result.komunikat || 'Nie udało się zmienić ilości palet');
            }
          } else {
            const error = await response.json();
            message.error(error.error || 'Błąd zmiany ilości palet');
          }
        } catch (error) {
          console.error('Error changing pallet quantity:', error);
          message.error('Błąd zmiany ilości palet');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePrzeniesFormatki = (source: Paleta, target?: Paleta) => {
    if (!target) {
      // Znajdź pierwszą inną paletę
      const otherPalety = palety.filter(p => p.id !== source.id);
      if (otherPalety.length === 0) {
        message.warning('Brak innych palet do przeniesienia formatek');
        return;
      }
      target = otherPalety[0];
    }
    
    setSourcePaleta(source);
    setTargetPaleta(target);
    setPrzeniesModalVisible(true);
  };

  const handleZamknijPalete = async (paletaId: number) => {
    try {
      const response = await fetch(`/api/pallets/${paletaId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: 'system',
          uwagi: 'Zamknięcie palety z poziomu aplikacji'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Zamknięto paletę');
          fetchPalety();
        } else {
          message.warning(result.komunikat || 'Nie udało się zamknąć palety');
        }
      }
    } catch (error) {
      console.error('Error closing pallet:', error);
      message.error('Błąd zamykania palety');
    }
  };

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

  const columns = [
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
      align: 'center' as const,
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
              onClick={() => {
                setSelectedPaleta(record);
                setDetailsModalVisible(true);
              }}
            >
              Podgląd
            </Button>
          </Tooltip>
          <Tooltip title="Przenieś formatki">
            <Button 
              size="small" 
              icon={<SwapOutlined />}
              onClick={() => handlePrzeniesFormatki(record)}
              disabled={!record.ilosc_formatek || record.ilosc_formatek === 0}
            />
          </Tooltip>
          {record.status?.toLowerCase() === 'otwarta' && (
            <Tooltip title="Zamknij paletę">
              <Button
                size="small"
                type="link"
                danger
                onClick={() => {
                  Modal.confirm({
                    title: 'Zamknięcie palety',
                    content: `Czy na pewno chcesz zamknąć paletę ${record.numer_palety || `PAL-${record.id}`}?`,
                    okText: 'Zamknij',
                    cancelText: 'Anuluj',
                    onOk: () => handleZamknijPalete(record.id)
                  });
                }}
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
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Zarządzanie paletami</Text>
          {loading && <Spin size="small" />}
        </Space>
      }
      extra={
        <Space>
          <Button 
            onClick={handlePlanujPalety}
            icon={<AppstoreOutlined />}
            type="primary"
            loading={loading}
          >
            Planuj automatycznie
          </Button>
          <Button 
            onClick={handleZmienIloscPalet}
            icon={palety.length > 0 ? <MinusOutlined /> : <PlusOutlined />}
            disabled={loading}
          >
            Zmień ilość
          </Button>
          <Button 
            onClick={fetchPalety}
            icon={<ReloadOutlined />}
            loading={loading}
          >
            Odśwież
          </Button>
        </Space>
      }
    >
      {palety.length === 0 ? (
        <Alert
          message="Brak palet"
          description={
            <div>
              <p>Palety zostaną utworzone automatycznie po dodaniu pozycji do ZKO.</p>
              <p>Możesz też utworzyć je ręcznie klikając "Planuj automatycznie".</p>
            </div>
          }
          type="info"
          showIcon
          action={
            <Space direction="vertical">
              <Button 
                onClick={handlePlanujPalety} 
                type="primary"
                loading={loading}
              >
                Utwórz palety
              </Button>
            </Space>
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={palety}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
          />
          
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#fafafa', 
            borderRadius: 4,
            border: '1px solid #d9d9d9'
          }}>
            <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
              <Text strong>Podsumowanie:</Text>
              <Text>Ilość palet: <strong>{palety.length}</strong></Text>
              <Text>
                Łącznie formatek: <strong>
                  {palety.reduce((sum, p) => sum + (p.ilosc_formatek || 0), 0)}
                </strong>
              </Text>
              <Text>
                Średnia wysokość: <strong>
                  {Math.round(
                    palety.reduce((sum, p) => sum + (p.wysokosc_stosu || 0), 0) / 
                    (palety.length || 1)
                  )} mm
                </strong>
              </Text>
              <Text>
                Max wysokość: <strong style={{ 
                  color: Math.max(...palety.map(p => p.wysokosc_stosu || 0)) > 1440 ? '#ff4d4f' : 'inherit' 
                }}>
                  {Math.max(...palety.map(p => p.wysokosc_stosu || 0))} mm
                </strong>
              </Text>
            </Space>
          </div>
        </>
      )}

      {/* Modal przenoszenia formatek */}
      {sourcePaleta && targetPaleta && (
        <PaletaPrzeniesFormatki
          visible={przeniesModalVisible}
          sourcePaleta={sourcePaleta}
          targetPaleta={targetPaleta}
          palety={palety}
          onClose={() => {
            setPrzeniesModalVisible(false);
            setSourcePaleta(null);
            setTargetPaleta(null);
          }}
          onSuccess={() => {
            setPrzeniesModalVisible(false);
            setSourcePaleta(null);
            setTargetPaleta(null);
            fetchPalety();
            onRefresh?.();
          }}
        />
      )}

      {/* Modal szczegółów palety */}
      {selectedPaleta && (
        <PaletaDetails
          visible={detailsModalVisible}
          paleta={selectedPaleta}
          onClose={() => {
            setDetailsModalVisible(false);
            setSelectedPaleta(null);
          }}
        />
      )}
    </Card>
  );
};