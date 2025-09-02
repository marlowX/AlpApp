import React from 'react';
import { Empty, Card, Button, Tag, Typography, Space, Alert, Spin, Badge } from 'antd';
import { FileTextOutlined, CheckOutlined, WarningOutlined } from '@ant-design/icons';
import type { Rozkroj } from '../types';

const { Text } = Typography;

interface Step1RozkrojProps {
  rozkroje: Rozkroj[];
  loading: boolean;
  selectedRozkrojId: number | null;
  onChange: (rozkrojId: number) => void;
}

export const Step1Rozkroj: React.FC<Step1RozkrojProps> = ({
  rozkroje,
  loading,
  selectedRozkrojId,
  onChange
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Ładowanie rozkrojów..." />
      </div>
    );
  }

  if (!rozkroje || rozkroje.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Brak dostępnych rozkrojów"
        style={{ padding: '50px' }}
      >
        <Alert
          message="Najpierw dodaj rozkroje w module Rozkroje"
          type="info"
          showIcon
        />
      </Empty>
    );
  }

  // Filtruj rozkroje - tylko te które mają formatki
  const rozkrojeZFormatkami = rozkroje.filter(r => r.formatki && r.formatki.length > 0);
  const rozkrojeBezFormatek = rozkroje.filter(r => !r.formatki || r.formatki.length === 0);

  if (rozkrojeZFormatkami.length === 0) {
    return (
      <Alert
        message="Brak rozkrojów z formatkami"
        description={
          <Space direction="vertical">
            <Text>Wszystkie dostępne rozkroje ({rozkroje.length}) nie mają zdefiniowanych formatek.</Text>
            <Text>Edytuj rozkroje w module Rozkroje i dodaj formatki przed utworzeniem pozycji.</Text>
          </Space>
        }
        type="warning"
        showIcon
        icon={<WarningOutlined />}
      />
    );
  }

  return (
    <div>
      <Alert
        message="Krok 1: Wybór rozkroju"
        description="Wybierz rozkrój, który określa jak będą pocięte płyty. Rozkrój definiuje ilość i wymiary formatek."
        type="info"
        showIcon
        icon={<FileTextOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Rozkroje z formatkami */}
      <div style={{ marginBottom: rozkrojeBezFormatek.length > 0 ? 24 : 0 }}>
        <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>
          Dostępne rozkroje ({rozkrojeZFormatkami.length})
        </Text>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16 
        }}>
          {rozkrojeZFormatkami.map((rozkroj) => {
            const isSelected = selectedRozkrojId === rozkroj.id;
            const formatekCount = rozkroj.formatki?.length || 0;
            const totalSztuk = rozkroj.formatki?.reduce((sum, f) => sum + (f.ilosc_sztuk || 0), 0) || 0;
            
            return (
              <Card
                key={rozkroj.id}
                hoverable={!isSelected}
                onClick={() => onChange(rozkroj.id)}
                style={{
                  borderColor: isSelected ? '#1890ff' : undefined,
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isSelected ? '#f0f8ff' : undefined,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                bodyStyle={{ padding: 16 }}
              >
                {isSelected && (
                  <CheckOutlined 
                    style={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10, 
                      color: '#1890ff',
                      fontSize: 20
                    }} 
                  />
                )}
                
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {rozkroj.kod_rozkroju}
                    </Text>
                    <Badge 
                      count={formatekCount} 
                      style={{ backgroundColor: '#52c41a' }}
                      title={`${formatekCount} rodzajów formatek`}
                    />
                  </div>
                  
                  {rozkroj.opis && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {rozkroj.opis}
                    </Text>
                  )}
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {rozkroj.wymiary_plyty && (
                      <Tag color="blue">
                        Płyta: {rozkroj.wymiary_plyty}
                      </Tag>
                    )}
                    <Tag color="green">
                      {totalSztuk} formatek/płytę
                    </Tag>
                  </div>
                  
                  {/* Podgląd formatek */}
                  {formatekCount > 0 && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: 8, 
                      backgroundColor: '#fafafa',
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      <Text type="secondary">Formatki:</Text>
                      <div style={{ marginTop: 4 }}>
                        {rozkroj.formatki.slice(0, 3).map((f, idx) => (
                          <div key={idx}>
                            • {f.szerokosc}×{f.dlugosc} - {f.ilosc_sztuk} szt.
                          </div>
                        ))}
                        {formatekCount > 3 && (
                          <Text type="secondary">...i {formatekCount - 3} więcej</Text>
                        )}
                      </div>
                    </div>
                  )}
                </Space>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Rozkroje bez formatek - wyświetl jako wyszarzone */}
      {rozkrojeBezFormatek.length > 0 && (
        <div>
          <Alert
            message={`${rozkrojeBezFormatek.length} rozkrojów bez formatek`}
            description="Te rozkroje nie mogą być użyte, ponieważ nie mają zdefiniowanych formatek"
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
          
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ marginBottom: 8, color: '#999' }}>
              Pokaż rozkroje bez formatek ({rozkrojeBezFormatek.length})
            </summary>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
              opacity: 0.5
            }}>
              {rozkrojeBezFormatek.map((rozkroj) => (
                <Card
                  key={rozkroj.id}
                  style={{
                    cursor: 'not-allowed',
                    backgroundColor: '#f5f5f5'
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 16 }}>
                        {rozkroj.kod_rozkroju}
                      </Text>
                      <Tag color="red">Brak formatek</Tag>
                    </div>
                    
                    {rozkroj.opis && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {rozkroj.opis}
                      </Text>
                    )}
                    
                    <Alert
                      message="Rozkrój nie ma formatek"
                      type="error"
                      showIcon={false}
                      style={{ padding: '4px 8px', fontSize: 11 }}
                    />
                  </Space>
                </Card>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
