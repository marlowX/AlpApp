import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Badge, Tag, message, Row, Col, Statistic, Alert } from 'antd';
import { 
  PlayCircleOutlined,
  CheckCircleOutlined,
  BgColorsOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ZKOItem {
  id: number;
  numer_zko: string;
  status: string;
  kooperant: string;
  priorytet: number;
  data_utworzenia: string;
  ilosc_formatek: number;
  ilosc_krawedzi?: number;
}

export const WorkerViewOkleiniarka: React.FC = () => {
  const [zkoList, setZkoList] = useState<ZKOItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [changingStatus, setChangingStatus] = useState<number | null>(null);
  const [stats, setStats] = useState({
    w_buforze: 0,
    w_oklejaniu: 0,
    dzis_zakonczono: 0
  });

  // Pobierz listę ZKO dla okleiniarki
  const fetchZKOForOkleiniarka = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/zko/list?status=BUFOR_OKLEINIARKA,OKLEJANIE_START,OKLEJANIE');
      const data = await response.json();
      setZkoList(data.items || []);
      
      // Oblicz statystyki
      const w_buforze = data.items.filter((z: ZKOItem) => 
        z.status === 'BUFOR_OKLEINIARKA'
      ).length;
      const w_oklejaniu = data.items.filter((z: ZKOItem) => 
        z.status === 'OKLEJANIE_START' || z.status === 'OKLEJANIE'
      ).length;
      
      setStats({
        w_buforze,
        w_oklejaniu,
        dzis_zakonczono: 0
      });
    } catch (error) {
      message.error('Błąd pobierania listy ZKO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZKOForOkleiniarka();
    const interval = setInterval(fetchZKOForOkleiniarka, 30000);
    return () => clearInterval(interval);
  }, []);

  // Szybka zmiana statusu
  const quickStatusChange = async (zkoId: number, currentStatus: string) => {
    setChangingStatus(zkoId);
    
    let nextStatus = '';
    if (currentStatus === 'BUFOR_OKLEINIARKA') {
      nextStatus = 'OKLEJANIE_START';
    } else if (currentStatus === 'OKLEJANIE_START' || currentStatus === 'OKLEJANIE') {
      nextStatus = 'BUFOR_WIERTARKA';
    }

    try {
      const response = await fetch('/api/zko/status/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zko_id: zkoId,
          nowy_etap_kod: nextStatus,
          operator: localStorage.getItem('operator_name') || 'Operator okleiniarki',
          lokalizacja: 'OKLEINIARKA',
          komentarz: `Szybka zmiana statusu - stanowisko okleiniarki`,
          uzytkownik: 'system'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.sukces) {
        message.success('Status zmieniony pomyślnie');
        fetchZKOForOkleiniarka();
      } else {
        message.error(data.komunikat || 'Błąd zmiany statusu');
      }
    } catch (error) {
      message.error('Błąd podczas zmiany statusu');
    } finally {
      setChangingStatus(null);
    }
  };

  // Określ kolor statusu
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'BUFOR_OKLEINIARKA': return 'orange';
      case 'OKLEJANIE_START':
      case 'OKLEJANIE': return 'processing';
      default: return 'default';
    }
  };

  // Określ akcję przycisku
  const getButtonAction = (status: string) => {
    switch(status) {
      case 'BUFOR_OKLEINIARKA': 
        return { 
          icon: <PlayCircleOutlined />, 
          text: 'Rozpocznij oklejanie', 
          type: 'primary' 
        };
      case 'OKLEJANIE_START':
      case 'OKLEJANIE':
        return { 
          icon: <CheckCircleOutlined />, 
          text: 'Zakończ oklejanie', 
          type: 'success' 
        };
      default:
        return { 
          icon: <PlayCircleOutlined />, 
          text: 'Akcja', 
          type: 'default' 
        };
    }
  };

  return (
    <div className="worker-view-okleiniarka" style={{ padding: '24px' }}>
      {/* Nagłówek z statystykami */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Space>
              <BgColorsOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <div>
                <h2 style={{ margin: 0 }}>Stanowisko OKLEINIARKI</h2>
                <p style={{ margin: 0, color: '#888' }}>Panel operatora</p>
              </div>
            </Space>
          </Col>
          <Col span={6}>
            <Statistic 
              title="W buforze" 
              value={stats.w_buforze} 
              prefix={<PauseCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="W oklejaniu" 
              value={stats.w_oklejaniu} 
              prefix={<BgColorsOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchZKOForOkleiniarka}
              loading={loading}
            >
              Odśwież
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Alert informacyjny */}
      {stats.w_buforze > 3 && (
        <Alert
          message="Wysoka liczba zleceń w buforze"
          description={`Masz ${stats.w_buforze} zleceń oczekujących na oklejanie. Rozważ przyśpieszenie pracy.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Lista ZKO */}
      <Row gutter={[16, 16]}>
        {zkoList.map(zko => {
          const buttonAction = getButtonAction(zko.status);
          const isChanging = changingStatus === zko.id;
          
          return (
            <Col key={zko.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                className={zko.status === 'OKLEJANIE_START' ? 'active-processing' : ''}
                style={{ 
                  borderLeft: `4px solid ${
                    zko.status === 'BUFOR_OKLEINIARKA' ? '#fa8c16' : 
                    zko.status.includes('OKLEJANIE') ? '#52c41a' : '#d9d9d9'
                  }`
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {/* Nagłówek karty */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>
                      {zko.numer_zko}
                    </h3>
                    <Tag color={getStatusColor(zko.status)}>
                      {zko.status}
                    </Tag>
                  </div>

                  {/* Informacje o ZKO */}
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    <div>Kooperant: <strong>{zko.kooperant}</strong></div>
                    <div>Formatek: <strong>{zko.ilosc_formatek || 0}</strong></div>
                    {zko.ilosc_krawedzi && (
                      <div>Krawędzi do oklejenia: <strong>{zko.ilosc_krawedzi}</strong></div>
                    )}
                    <div>
                      Priorytet: <Badge count={zko.priorytet} style={{ backgroundColor: '#f50' }} />
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {formatDistanceToNow(new Date(zko.data_utworzenia), { 
                        locale: pl, 
                        addSuffix: true 
                      })}
                    </div>
                  </div>

                  {/* Przycisk akcji */}
                  <Button
                    type={buttonAction.type as any}
                    icon={buttonAction.icon}
                    onClick={() => quickStatusChange(zko.id, zko.status)}
                    loading={isChanging}
                    block
                    size="large"
                    style={{ marginTop: '12px' }}
                  >
                    {buttonAction.text}
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Gdy brak zleceń */}
      {zkoList.length === 0 && !loading && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <BgColorsOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <h3 style={{ color: '#999', marginTop: 16 }}>
            Brak zleceń do oklejania
          </h3>
          <p style={{ color: '#999' }}>
            Wszystkie zlecenia zostały już oklejone lub czekają na inne operacje
          </p>
        </Card>
      )}

      {/* Style dla animacji */}
      <style jsx>{`
        .active-processing {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(250, 140, 22, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(250, 140, 22, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(250, 140, 22, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default WorkerViewOkleiniarka;
