import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Badge, Tag, Tooltip, message, Row, Col, Statistic } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  CheckCircleOutlined,
  ScissorOutlined,
  ReloadOutlined,
  ClockCircleOutlined
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
  ilosc_pozycji: number;
  ilosc_formatek: number;
}

export const WorkerViewPila: React.FC = () => {
  const [zkoList, setZkoList] = useState<ZKOItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [changingStatus, setChangingStatus] = useState<number | null>(null);
  const [stats, setStats] = useState({
    nowe: 0,
    w_ciecie: 0,
    dzis_zakonczono: 0
  });

  // Pobierz listę ZKO dla piły
  const fetchZKOForPila = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/zko/list?status=NOWE,CIECIE_START,CIECIE');
      const data = await response.json();
      setZkoList(data.items || []);
      
      // Oblicz statystyki
      const nowe = data.items.filter((z: ZKOItem) => z.status === 'NOWE').length;
      const w_ciecie = data.items.filter((z: ZKOItem) => 
        z.status === 'CIECIE_START' || z.status === 'CIECIE'
      ).length;
      
      setStats({
        nowe,
        w_ciecie,
        dzis_zakonczono: 0 // TODO: dodać endpoint dla statystyk dziennych
      });
    } catch (error) {
      message.error('Błąd pobierania listy ZKO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZKOForPila();
    // Odświeżaj co 30 sekund
    const interval = setInterval(fetchZKOForPila, 30000);
    return () => clearInterval(interval);
  }, []);

  // Szybka zmiana statusu
  const quickStatusChange = async (zkoId: number, currentStatus: string) => {
    setChangingStatus(zkoId);
    
    // Określ następny status
    let nextStatus = '';
    if (currentStatus === 'NOWE') {
      nextStatus = 'CIECIE_START';
    } else if (currentStatus === 'CIECIE_START' || currentStatus === 'CIECIE') {
      nextStatus = 'OTWARCIE_PALETY';
    }

    try {
      const response = await fetch('/api/zko/status/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zko_id: zkoId,
          nowy_etap_kod: nextStatus,
          operator: localStorage.getItem('operator_name') || 'Operator piły',
          lokalizacja: 'PIŁA',
          komentarz: `Szybka zmiana statusu - stanowisko piły`,
          uzytkownik: 'system'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.sukces) {
        message.success('Status zmieniony pomyślnie');
        fetchZKOForPila();
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
      case 'NOWE': return 'blue';
      case 'CIECIE_START': 
      case 'CIECIE': return 'processing';
      default: return 'default';
    }
  };

  // Określ akcję przycisku
  const getButtonAction = (status: string) => {
    switch(status) {
      case 'NOWE': 
        return { icon: <PlayCircleOutlined />, text: 'Rozpocznij cięcie', type: 'primary' };
      case 'CIECIE_START':
      case 'CIECIE':
        return { icon: <CheckCircleOutlined />, text: 'Zakończ cięcie', type: 'success' };
      default:
        return { icon: <PlayCircleOutlined />, text: 'Akcja', type: 'default' };
    }
  };

  return (
    <div className="worker-view-pila" style={{ padding: '24px' }}>
      {/* Nagłówek z statystykami */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Space>
              <ScissorOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div>
                <h2 style={{ margin: 0 }}>Stanowisko PIŁY</h2>
                <p style={{ margin: 0, color: '#888' }}>Panel operatora</p>
              </div>
            </Space>
          </Col>
          <Col span={6}>
            <Statistic 
              title="Oczekujące" 
              value={stats.nowe} 
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="W trakcie cięcia" 
              value={stats.w_ciecie} 
              prefix={<ScissorOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchZKOForPila}
              loading={loading}
            >
              Odśwież
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Lista ZKO */}
      <Row gutter={[16, 16]}>
        {zkoList.map(zko => {
          const buttonAction = getButtonAction(zko.status);
          const isChanging = changingStatus === zko.id;
          
          return (
            <Col key={zko.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                className={zko.status === 'CIECIE_START' ? 'active-cutting' : ''}
                style={{ 
                  borderLeft: `4px solid ${
                    zko.status === 'NOWE' ? '#1890ff' : 
                    zko.status.includes('CIECIE') ? '#52c41a' : '#d9d9d9'
                  }`
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {/* Nagłówek karty */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{zko.numer_zko}</h3>
                    <Tag color={getStatusColor(zko.status)}>{zko.status}</Tag>
                  </div>

                  {/* Informacje o ZKO */}
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    <div>Kooperant: <strong>{zko.kooperant}</strong></div>
                    <div>Formatek: <strong>{zko.ilosc_formatek || 0}</strong></div>
                    <div>Priorytet: <Badge count={zko.priorytet} style={{ backgroundColor: '#f50' }} /></div>
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
          <ScissorOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <h3 style={{ color: '#999', marginTop: 16 }}>
            Brak zleceń do cięcia
          </h3>
          <p style={{ color: '#999' }}>
            Wszystkie zlecenia zostały już pocięte lub czekają na inne operacje
          </p>
        </Card>
      )}

      {/* Style dla animacji */}
      <style jsx>{`
        .active-cutting {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default WorkerViewPila;
