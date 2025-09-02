import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Badge, Empty, Spin, Alert, message, Button, Space, Tooltip } from 'antd';
import { CheckCircleOutlined, WarningOutlined, InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import type { Rozkroj } from '../types';

const { Text, Title } = Typography;

interface Step1RozkrojProps {
  rozkroje: Rozkroj[];
  loading: boolean;
  selectedRozkrojId: number | null;
  onChange: (value: number) => void;
}

const Step1Rozkroj: React.FC<Step1RozkrojProps> = ({ 
  rozkroje,
  loading,
  selectedRozkrojId,
  onChange
}) => {
  const [selectedRozkroj, setSelectedRozkroj] = useState<Rozkroj | null>(null);

  useEffect(() => {
    // Znajdź wybrany rozkrój
    if (selectedRozkrojId && rozkroje.length > 0) {
      const found = rozkroje.find(r => r.id === selectedRozkrojId);
      setSelectedRozkroj(found || null);
    } else {
      setSelectedRozkroj(null);
    }
  }, [selectedRozkrojId, rozkroje]);

  const handleSelect = (rozkrojId: number) => {
    const rozkroj = rozkroje.find(r => r.id === rozkrojId);
    
    // Sprawdź czy rozkrój ma formatki
    if (rozkroj && (!rozkroj.formatki || rozkroj.formatki.length === 0)) {
      message.warning('Ten rozkrój nie ma zdefiniowanych formatek. Wybierz inny rozkrój.');
      return;
    }
    
    onChange(rozkrojId);
  };

  const handleSaveAndNext = () => {
    if (!selectedRozkrojId) {
      message.warning('Wybierz rozkrój przed przejściem dalej');
      return;
    }
    // Nie ma już onNext, więc tylko zapisujemy
    message.success('Rozkrój wybrany - przejdź do następnego kroku');
  };

  // Podziel rozkroje na te z formatkami i bez
  const rozkrojeZFormatkami = rozkroje.filter(r => r.formatki && r.formatki.length > 0);
  const rozkrojeBezFormatek = rozkroje.filter(r => !r.formatki || r.formatki.length === 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (rozkroje.length === 0) {
    return (
      <Empty 
        description="Brak dostępnych rozkrojów"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      {/* Sekcja z wybranym rozkrojem - ZAWSZE NA GÓRZE */}
      {selectedRozkroj && (
        <Card 
          style={{ 
            marginBottom: 16, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
          styles={{
            body: { padding: '16px' }
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text style={{ color: 'white', fontSize: '12px', opacity: 0.9 }}>
                  WYBRANY ROZKRÓJ
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div>
                    <Title level={4} style={{ margin: 0, color: 'white' }}>
                      {selectedRozkroj.kod_rozkroju}
                    </Title>
                    <Text style={{ color: 'white', opacity: 0.9 }}>
                      {selectedRozkroj.rozmiar_plyty} • {selectedRozkroj.formatki?.length || 0} formatek
                    </Text>
                  </div>
                </div>
                {selectedRozkroj.formatki && selectedRozkroj.formatki.length > 0 && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: '8px', 
                    background: 'rgba(255,255,255,0.1)', 
                    borderRadius: '4px' 
                  }}>
                    <Text style={{ color: 'white', fontSize: '12px' }}>
                      Formatki: {selectedRozkroj.formatki.map(f => 
                        `${f.wymiary} (${f.ilosc_sztuk} szt.)`
                      ).join(' • ')}
                    </Text>
                  </div>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  size="large"
                  onClick={() => onChange(null as any)}
                  style={{ minWidth: 100 }}
                >
                  Zmień
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={handleSaveAndNext}
                  style={{ 
                    minWidth: 150,
                    background: '#52c41a',
                    borderColor: '#52c41a'
                  }}
                >
                  Zapisz i dalej
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Alert informacyjny */}
      {!selectedRozkrojId && (
        <Alert
          message="Wybierz rozkrój"
          description="Rozkrój określa jak będą pocięte płyty. Rozkroje z zieloną ikoną mają zdefiniowane formatki."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Ostrzeżenie o rozkrojach bez formatek */}
      {rozkrojeBezFormatek.length > 0 && (
        <Alert
          message={`Uwaga: ${rozkrojeBezFormatek.length} rozkrojów nie ma zdefiniowanych formatek`}
          description="Rozkroje bez formatek są nieaktywne i nie mogą być wybrane."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Lista rozkrojów z formatkami */}
      <Title level={5} style={{ marginBottom: 16 }}>
        Dostępne rozkroje ({rozkrojeZFormatkami.length})
      </Title>
      
      <Row gutter={[16, 16]}>
        {rozkrojeZFormatkami.map((rozkroj) => {
          const isSelected = selectedRozkrojId === rozkroj.id;
          const formatCount = rozkroj.formatki?.length || 0;
          
          return (
            <Col key={rozkroj.id} xs={24} sm={12} md={8} lg={8} xl={6}>
              <Card
                hoverable
                onClick={() => handleSelect(rozkroj.id)}
                style={{
                  border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  background: isSelected ? '#e6f7ff' : '#fff',
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.3s'
                }}
                styles={{
                  body: { padding: '12px' }
                }}
              >
                <div style={{ position: 'relative' }}>
                  {isSelected && (
                    <CheckCircleOutlined 
                      style={{ 
                        position: 'absolute', 
                        top: -5, 
                        right: -5, 
                        fontSize: 20, 
                        color: '#1890ff' 
                      }} 
                    />
                  )}
                  
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        {rozkroj.kod_rozkroju}
                      </Text>
                      <Badge 
                        count={`${formatCount} formatek`} 
                        style={{ 
                          backgroundColor: '#52c41a',
                          fontSize: '10px',
                          height: '18px',
                          lineHeight: '18px',
                          padding: '0 6px'
                        }} 
                      />
                    </div>
                    
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {rozkroj.rozmiar_plyty}
                    </Text>
                    
                    {rozkroj.formatki && rozkroj.formatki.length > 0 && (
                      <div style={{ 
                        marginTop: 8, 
                        padding: '4px 8px', 
                        background: '#f0f0f0', 
                        borderRadius: '4px' 
                      }}>
                        <Text style={{ fontSize: '11px', color: '#666' }}>
                          Formatki:
                        </Text>
                        {rozkroj.formatki.slice(0, 3).map((f, idx) => (
                          <div key={idx}>
                            <Text style={{ fontSize: '10px' }}>
                              • {f.wymiary} - {f.ilosc_sztuk} szt.
                            </Text>
                          </div>
                        ))}
                        {rozkroj.formatki.length > 3 && (
                          <Text style={{ fontSize: '10px', fontStyle: 'italic' }}>
                            ...i {rozkroj.formatki.length - 3} więcej
                          </Text>
                        )}
                      </div>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Sekcja z rozkrojami bez formatek (nieaktywne) */}
      {rozkrojeBezFormatek.length > 0 && (
        <>
          <Title level={5} style={{ marginTop: 32, marginBottom: 16, color: '#999' }}>
            Rozkroje bez formatek ({rozkrojeBezFormatek.length}) - nieaktywne
          </Title>
          
          <Row gutter={[16, 16]}>
            {rozkrojeBezFormatek.map((rozkroj) => (
              <Col key={rozkroj.id} xs={24} sm={12} md={8} lg={8} xl={6}>
                <Tooltip title="Ten rozkrój nie ma zdefiniowanych formatek i nie może być wybrany">
                  <Card
                    style={{
                      border: '1px solid #f0f0f0',
                      background: '#fafafa',
                      cursor: 'not-allowed',
                      height: '100%',
                      opacity: 0.6
                    }}
                    styles={{
                      body: { padding: '12px' }
                    }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: '16px', color: '#999' }}>
                          {rozkroj.kod_rozkroju}
                        </Text>
                        <Badge 
                          count={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <WarningOutlined />
                              0 formatek
                            </span>
                          }
                          style={{ 
                            backgroundColor: '#ff4d4f',
                            fontSize: '10px',
                            height: '18px',
                            lineHeight: '18px',
                            padding: '0 6px'
                          }} 
                        />
                      </div>
                      
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {rozkroj.rozmiar_plyty}
                      </Text>
                      
                      <div style={{ 
                        marginTop: 8, 
                        padding: '4px 8px', 
                        background: '#fff2e8', 
                        borderRadius: '4px',
                        border: '1px solid #ffbb96'
                      }}>
                        <Text style={{ fontSize: '11px', color: '#ff7a45' }}>
                          ⚠️ Brak zdefiniowanych formatek
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Dolny przycisk zapisz - tylko gdy jest wybrany rozkrój */}
      {selectedRozkrojId && (
        <div style={{ 
          marginTop: 32, 
          padding: '16px', 
          background: '#f5f5f5', 
          borderRadius: '8px',
          textAlign: 'center' 
        }}>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSaveAndNext}
            style={{ minWidth: 200 }}
          >
            Zapisz i przejdź dalej
          </Button>
        </div>
      )}
    </div>
  );
};

export { Step1Rozkroj };
