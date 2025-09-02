import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Badge, Empty, Spin, Alert, message, Tooltip } from 'antd';
import { CheckCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
    
    // Sprawdź czy rozkrój ma formatki
    if (rozkroj && (!rozkroj.formatki || rozkroj.formatki.length === 0)) {
      message.warning('Ten rozkrój nie ma zdefiniowanych formatek. Wybierz inny rozkrój.');
      return;
    }
    
    onChange(rozkrojId);
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
      {/* Alert informacyjny */}
      <Alert
        message="Krok 1: Wybór rozkroju"
        description="Wybierz rozkrój, który określa jak będą pocięte płyty. Rozkroje z zieloną ikoną mają zdefiniowane formatki."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />
      
      {/* Ostrzeżenie o rozkrojach bez formatek - tylko jeśli są */}
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
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                styles={{
                  body: { padding: '12px' }
                }}
              >
                {/* Ptaszek wyboru - w prawym górnym rogu */}
                {isSelected && (
                  <CheckCircleOutlined 
                    style={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      fontSize: 20, 
                      color: '#1890ff',
                      zIndex: 10
                    }} 
                  />
                )}
                
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {/* Nagłówek z nazwą i badge */}
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
                  
                  {/* Rozmiar płyty */}
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {rozkroj.rozmiar_plyty}
                  </Text>
                  
                  {/* Opis rozkroju - PRZYWRÓCONE */}
                  {rozkroj.opis && (
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      {rozkroj.opis}
                    </Text>
                  )}
                  
                  {/* Lista formatek */}
                  {rozkroj.formatki && rozkroj.formatki.length > 0 && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: '6px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      <Text strong style={{ fontSize: '11px', color: '#595959' }}>
                        Formatki:
                      </Text>
                      {rozkroj.formatki.slice(0, 4).map((f, idx) => {
                        const wymiary = `${f.dlugosc}×${f.szerokosc}`;
                        return (
                          <div key={idx} style={{ marginLeft: 8 }}>
                            <Text style={{ fontSize: '11px', color: '#595959' }}>
                              • {wymiary} - {f.ilosc_sztuk} szt.
                            </Text>
                          </div>
                        );
                      })}
                      {rozkroj.formatki.length > 4 && (
                        <Text style={{ fontSize: '10px', fontStyle: 'italic', color: '#999', marginLeft: 8 }}>
                          ...i {rozkroj.formatki.length - 4} więcej
                        </Text>
                      )}
                    </div>
                  )}
                </Space>
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
                      
                      {rozkroj.opis && (
                        <Text style={{ fontSize: '12px', color: '#999' }}>
                          {rozkroj.opis}
                        </Text>
                      )}
                      
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
    </div>
  );
};

export { Step1Rozkroj };
