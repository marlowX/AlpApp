import React from 'react';
import { Card, Row, Col, Typography, Badge, Empty, Spin, Alert, message, Tooltip, Space, Button } from 'antd';
import { CheckCircleOutlined, WarningOutlined, InfoCircleOutlined, ArrowRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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
  const handleSelect = (rozkrojId: number) => {
    const rozkroj = rozkroje.find(r => r.id === rozkrojId);
    
    if (rozkroj && (!rozkroj.formatki || rozkroj.formatki.length === 0)) {
      message.warning('Ten rozkrój nie ma zdefiniowanych formatek');
      return;
    }
    
    onChange(rozkrojId);
  };

  const rozkrojeZFormatkami = rozkroje.filter(r => r.formatki && r.formatki.length > 0);
  const rozkrojeBezFormatek = rozkroje.filter(r => !r.formatki || r.formatki.length === 0);
  const selectedRozkroj = rozkroje.find(r => r.id === selectedRozkrojId);

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
      {/* Kompaktowy nagłówek z wybranym rozkrojem */}
      <div style={{ 
        marginBottom: 16, 
        padding: '12px 16px', 
        background: selectedRozkroj ? '#f6ffed' : '#f5f5f5',
        borderRadius: '8px',
        border: selectedRozkroj ? '1px solid #b7eb8f' : '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {selectedRozkroj ? (
            <>
              <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              <div>
                <Text strong style={{ fontSize: '14px' }}>
                  Wybrany: {selectedRozkroj.kod_rozkroju}
                </Text>
                <Text style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                  {selectedRozkroj.rozmiar_plyty} • {selectedRozkroj.formatki?.length || 0} formatek
                </Text>
              </div>
            </>
          ) : (
            <>
              <InfoCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <Text style={{ fontSize: '14px' }}>Wybierz rozkrój z listy poniżej</Text>
            </>
          )}
          
          {/* Mała ikona pomocy z tooltip */}
          <Tooltip 
            title={
              <div style={{ fontSize: '12px' }}>
                <div>• Rozkrój określa jak będą pocięte płyty</div>
                <div>• Wybierz rozkrój z zieloną ikoną (ma formatki)</div>
                <div>• Rozkroje bez formatek są nieaktywne</div>
              </div>
            }
          >
            <QuestionCircleOutlined style={{ fontSize: 14, color: '#999', cursor: 'help' }} />
          </Tooltip>
        </div>

        {/* Przycisk do następnego kroku - tylko gdy wybrany */}
        {selectedRozkroj && (
          <Button 
            type="primary" 
            icon={<ArrowRightOutlined />}
            onClick={() => message.success('Przejdź do następnego kroku')}
          >
            Dalej
          </Button>
        )}
      </div>
      
      {/* Kompaktowe ostrzeżenie - tylko jeśli są rozkroje bez formatek */}
      {rozkrojeBezFormatek.length > 0 && (
        <div style={{ 
          marginBottom: 12, 
          padding: '8px 12px', 
          background: '#fff7e6',
          borderRadius: '4px',
          border: '1px solid #ffd591',
          fontSize: '12px',
          color: '#fa8c16'
        }}>
          <WarningOutlined style={{ marginRight: 6 }} />
          {rozkrojeBezFormatek.length} rozkrojów bez formatek (nieaktywne)
        </div>
      )}

      {/* Lista rozkrojów */}
      <Title level={5} style={{ marginBottom: 12, fontSize: '14px' }}>
        Dostępne rozkroje ({rozkrojeZFormatkami.length})
      </Title>
      
      <Row gutter={[12, 12]}>
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
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                styles={{
                  body: { padding: '10px' }
                }}
              >
                {isSelected && (
                  <CheckCircleOutlined 
                    style={{ 
                      position: 'absolute', 
                      top: 6, 
                      right: 6, 
                      fontSize: 18, 
                      color: '#1890ff',
                      zIndex: 10
                    }} 
                  />
                )}
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {rozkroj.kod_rozkroju}
                    </Text>
                    <Badge 
                      count={`${formatCount} formatek`} 
                      style={{ 
                        backgroundColor: '#52c41a',
                        fontSize: '10px',
                        height: '16px',
                        lineHeight: '16px',
                        padding: '0 4px'
                      }} 
                    />
                  </div>
                  
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {rozkroj.rozmiar_plyty}
                  </Text>
                  
                  {rozkroj.opis && (
                    <div style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: '11px', color: '#666' }}>
                        {rozkroj.opis}
                      </Text>
                    </div>
                  )}
                  
                  {rozkroj.formatki && rozkroj.formatki.length > 0 && (
                    <div style={{ 
                      marginTop: 6, 
                      padding: '4px 6px', 
                      background: '#f5f5f5', 
                      borderRadius: '3px',
                      fontSize: '10px'
                    }}>
                      <Text style={{ fontSize: '10px', color: '#666' }}>
                        Formatki:
                      </Text>
                      {rozkroj.formatki.slice(0, 3).map((f, idx) => (
                        <div key={idx} style={{ marginLeft: 6 }}>
                          <Text style={{ fontSize: '10px', color: '#666' }}>
                            • {f.dlugosc}×{f.szerokosc} - {f.ilosc_sztuk} szt.
                          </Text>
                        </div>
                      ))}
                      {rozkroj.formatki.length > 3 && (
                        <Text style={{ fontSize: '9px', fontStyle: 'italic', color: '#999', marginLeft: 6 }}>
                          ...+{rozkroj.formatki.length - 3}
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Rozkroje bez formatek - bardziej kompaktowe */}
      {rozkrojeBezFormatek.length > 0 && (
        <>
          <Title level={5} style={{ marginTop: 24, marginBottom: 12, color: '#999', fontSize: '13px' }}>
            Nieaktywne (bez formatek)
          </Title>
          
          <Row gutter={[12, 12]}>
            {rozkrojeBezFormatek.map((rozkroj) => (
              <Col key={rozkroj.id} xs={24} sm={12} md={8} lg={8} xl={6}>
                <Card
                  style={{
                    border: '1px solid #f0f0f0',
                    background: '#fafafa',
                    cursor: 'not-allowed',
                    height: '100%',
                    opacity: 0.5
                  }}
                  styles={{
                    body: { padding: '8px' }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: '13px', color: '#999' }}>
                      {rozkroj.kod_rozkroju}
                    </Text>
                    <WarningOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
                  </div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {rozkroj.rozmiar_plyty}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

export { Step1Rozkroj };
