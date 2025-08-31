import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Badge, 
  Space,
  Spin,
  Alert,
  Progress,
  Tooltip,
  Button
} from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined,
  AppstoreOutlined,
  BoxPlotOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface Pozycja {
  id: number;
  numer_pozycji: number;
  nazwa_plyty: string;
  kolor_plyty: string;
  symbol_plyty: string;
  ilosc_plyt: number;
  formatki_count?: number;
  formatki_total_sztuk?: number;
  formatki_na_paletach?: number;
  formatki_dostepne?: number;
  palety_count?: number;
}

interface PozycjaSelectorProps {
  zkoId: number;
  selectedPozycjaId?: number;
  onSelect: (pozycjaId: number) => void;
  loading?: boolean;
}

export const PozycjaSelector: React.FC<PozycjaSelectorProps> = ({
  zkoId,
  selectedPozycjaId,
  onSelect,
  loading = false
}) => {
  const [pozycje, setPozycje] = useState<Pozycja[]>([]);
  const [loadingPozycje, setLoadingPozycje] = useState(false);
  const [pozycjeStats, setPozycjeStats] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchPozycje();
  }, [zkoId]);

  const fetchPozycje = async () => {
    try {
      setLoadingPozycje(true);
      
      // Pobierz pozycje
      const response = await fetch(`/api/zko/${zkoId}/pozycje`);
      if (response.ok) {
        const data = await response.json();
        setPozycje(data.pozycje || []);
        
        // Pobierz statystyki palet dla każdej pozycji
        await fetchPozycjeStats(data.pozycje || []);
        
        // Auto-select jeśli tylko jedna pozycja
        if (data.pozycje && data.pozycje.length === 1 && !selectedPozycjaId) {
          onSelect(data.pozycje[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching pozycje:', error);
    } finally {
      setLoadingPozycje(false);
    }
  };

  const fetchPozycjeStats = async (pozycjeList: Pozycja[]) => {
    const stats: Record<number, any> = {};
    
    for (const pozycja of pozycjeList) {
      try {
        // Pobierz informacje o formatkach i paletach dla pozycji
        const response = await fetch(`/api/pallets/position/${pozycja.id}/available-formatki`);
        if (response.ok) {
          const data = await response.json();
          stats[pozycja.id] = {
            formatki_total: data.podsumowanie?.formatki_total || 0,
            sztuk_planowanych: data.podsumowanie?.sztuk_planowanych || 0,
            sztuk_w_paletach: data.podsumowanie?.sztuk_w_paletach || 0,
            sztuk_dostepnych: data.podsumowanie?.sztuk_dostepnych || 0,
            procent_zapaletyzowania: data.podsumowanie?.sztuk_planowanych > 0 
              ? Math.round((data.podsumowanie.sztuk_w_paletach / data.podsumowanie.sztuk_planowanych) * 100)
              : 0
          };
        }
      } catch (error) {
        console.error(`Error fetching stats for pozycja ${pozycja.id}:`, error);
      }
    }
    
    setPozycjeStats(stats);
  };

  const getKolorBadge = (kolor: string) => {
    const colors: Record<string, string> = {
      'LANCELOT': '#8B4513',
      'ARTISAN': '#D2691E',
      'SONOMA': '#F4A460',
      'SUROWA': '#A0522D',
      'BIAŁY': '#F0F0F0',
      'CZARNY': '#000000'
    };
    
    const bgColor = colors[kolor?.toUpperCase()] || '#E0E0E0';
    const textColor = ['BIAŁY', 'SUROWA', 'SONOMA'].includes(kolor?.toUpperCase()) ? '#000' : '#FFF';
    
    return (
      <Tag 
        style={{ 
          backgroundColor: bgColor, 
          color: textColor,
          border: `1px solid ${bgColor === '#F0F0F0' ? '#ccc' : bgColor}`
        }}
      >
        {kolor}
      </Tag>
    );
  };

  if (loadingPozycje) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Spin tip="Ładowanie pozycji..." />
      </Card>
    );
  }

  if (pozycje.length === 0) {
    return (
      <Alert
        message="Brak pozycji"
        description="To ZKO nie ma jeszcze zdefiniowanych pozycji."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Wybierz pozycję do zarządzania paletami</Text>
          {selectedPozycjaId && (
            <Tag color="blue">Wybrana pozycja: {selectedPozycjaId}</Tag>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]}>
        {pozycje.map(pozycja => {
          const stats = pozycjeStats[pozycja.id] || {};
          const isSelected = selectedPozycjaId === pozycja.id;
          const isFullyPalletized = stats.procent_zapaletyzowania === 100;
          
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={pozycja.id}>
              <Card
                hoverable={!isFullyPalletized}
                onClick={() => !isFullyPalletized && onSelect(pozycja.id)}
                style={{
                  borderColor: isSelected ? '#1890ff' : undefined,
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isFullyPalletized ? '#f0f0f0' : undefined,
                  cursor: isFullyPalletized ? 'not-allowed' : 'pointer',
                  opacity: isFullyPalletized ? 0.7 : 1,
                  height: '100%'
                }}
                bodyStyle={{ padding: 12 }}
              >
                {/* Nagłówek */}
                <div style={{ marginBottom: 8 }}>
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Badge 
                      count={pozycja.numer_pozycji} 
                      style={{ backgroundColor: isSelected ? '#1890ff' : '#52c41a' }}
                    />
                    {isFullyPalletized && (
                      <Tooltip title="Wszystkie formatki są już na paletach">
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                      </Tooltip>
                    )}
                  </Space>
                </div>

                {/* Nazwa płyty */}
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 12 }}>
                    {pozycja.nazwa_plyty || pozycja.symbol_plyty}
                  </Text>
                </div>

                {/* Kolor */}
                <div style={{ marginBottom: 8 }}>
                  {getKolorBadge(pozycja.kolor_plyty)}
                </div>

                {/* Statystyki */}
                <div style={{ marginBottom: 8 }}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        <FileTextOutlined /> Formatki:
                      </Text>
                      <Text style={{ fontSize: 11 }}>
                        {stats.formatki_total || 0} typów
                      </Text>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        <BoxPlotOutlined /> Sztuki:
                      </Text>
                      <Text style={{ fontSize: 11 }}>
                        {stats.sztuk_planowanych || 0} szt.
                      </Text>
                    </div>

                    {stats.sztuk_w_paletach > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          📦 Na paletach:
                        </Text>
                        <Text strong style={{ fontSize: 11, color: '#52c41a' }}>
                          {stats.sztuk_w_paletach} szt.
                        </Text>
                      </div>
                    )}
                    
                    {stats.sztuk_dostepnych > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ⏳ Pozostało:
                        </Text>
                        <Text style={{ fontSize: 11, color: '#1890ff' }}>
                          {stats.sztuk_dostepnych} szt.
                        </Text>
                      </div>
                    )}
                  </Space>
                </div>

                {/* Progress bar */}
                {stats.sztuk_planowanych > 0 && (
                  <Tooltip title={`Zapaletyzowano ${stats.procent_zapaletyzowania}%`}>
                    <Progress 
                      percent={stats.procent_zapaletyzowania || 0}
                      size="small"
                      showInfo={false}
                      strokeColor={
                        stats.procent_zapaletyzowania === 100 ? '#52c41a' :
                        stats.procent_zapaletyzowania > 50 ? '#faad14' : '#1890ff'
                      }
                    />
                  </Tooltip>
                )}

                {/* Status */}
                {isFullyPalletized && (
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <Tag color="success" style={{ margin: 0 }}>
                      ✅ W pełni zapaletyzowane
                    </Tag>
                  </div>
                )}

                {isSelected && !isFullyPalletized && (
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <Tag color="blue" style={{ margin: 0 }}>
                      Wybrana pozycja
                    </Tag>
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Podsumowanie wybranej pozycji */}
      {selectedPozycjaId && pozycjeStats[selectedPozycjaId] && (
        <Alert
          message="Wybrana pozycja"
          description={
            <Space>
              <Text>Pozycja {pozycje.find(p => p.id === selectedPozycjaId)?.numer_pozycji}:</Text>
              <Text strong>{pozycje.find(p => p.id === selectedPozycjaId)?.nazwa_plyty}</Text>
              <Text>({pozycjeStats[selectedPozycjaId].sztuk_dostepnych} szt. do zapaletyzowania)</Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};