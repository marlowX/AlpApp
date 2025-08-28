import React from 'react';
import { Table, Button, InputNumber, Typography, Space, Card, Tag } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PlytySelectorV2 } from './PlytySelectorV2';
import type { KolorPlyty, Plyta } from './types';

const { Text } = Typography;

interface KolorePlytyTableProps {
  kolorePlyty: KolorPlyty[];
  plyty: Plyta[];
  plytyLoading?: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  onUpdateKolor: (index: number, field: string, value: any) => void;
  onRemoveKolor: (index: number) => void;
}

export const KolorePlytyTable: React.FC<KolorePlytyTableProps> = ({
  kolorePlyty,
  plyty,
  plytyLoading = false,
  searchText,
  onSearchChange,
  onUpdateKolor,
  onRemoveKolor
}) => {

  const getMaxPlytForColor = (kolor: string): number => {
    const plyta = plyty.find(p => p.kolor_nazwa === kolor);
    return plyta && plyta.grubosc >= 18 ? 5 : 50;
  };

  const handlePlytaChange = (index: number, plyta: Plyta | null) => {
    console.log('🔄 handlePlytaChange called:', { index, plyta, currentState: kolorePlyty });
    
    if (plyta) {
      console.log('✅ Wybrano płytę:', plyta.kolor_nazwa, plyta);
      // POPRAWKA: Aktualizuj wszystkie pola jedną operacją
      const updatedKolor = {
        kolor: plyta.kolor_nazwa,
        nazwa: plyta.nazwa,
        ilosc: kolorePlyty[index]?.ilosc || 1, // Zachowaj poprzednią ilość
        plyta_id: plyta.id,
        stan_magazynowy: plyta.stan_magazynowy,
        grubosc: plyta.grubosc
      };
      
      console.log('📦 Aktualizacja pełnego obiektu:', updatedKolor);
      // Użyj specjalnego pola do aktualizacji całego obiektu
      onUpdateKolor(index, '__FULL_UPDATE__', updatedKolor);
    } else {
      console.log('❌ Wyczyszczono płytę dla pozycji:', index);
      // Wyczyść wszystkie pola jednocześnie
      const clearedKolor = {
        kolor: '',
        nazwa: '',
        ilosc: 1,
        plyta_id: undefined,
        stan_magazynowy: undefined,
        grubosc: undefined
      };
      onUpdateKolor(index, '__FULL_UPDATE__', clearedKolor);
    }
  };

  const columns = [
    {
      title: (
        <Space>
          <InfoCircleOutlined />
          Wybór płyty
        </Space>
      ),
      dataIndex: 'kolor',
      key: 'kolor',
      width: 400,
      render: (_: any, __: any, index: number) => {
        const currentValue = kolorePlyty[index]?.kolor;
        console.log('🎯 Render selector for index:', index, 'current value:', currentValue);
        
        return (
          <PlytySelectorV2
            plyty={plyty}
            loading={plytyLoading}
            value={currentValue}
            onChange={(plyta) => {
              console.log('📝 PlytySelectorV2 onChange called:', { index, plyta });
              handlePlytaChange(index, plyta);
            }}
            placeholder={`Wybierz płytę dla pozycji ${index + 1}`}
          />
        );
      },
    },
    {
      title: 'Parametry',
      dataIndex: 'parametry',
      key: 'parametry',
      width: 160,
      render: (_: any, __: any, index: number) => {
        const kolor = kolorePlyty[index];
        
        if (!kolor?.kolor) {
          return <Text type="secondary">Wybierz płytę</Text>;
        }
        
        const stockColor = (kolor.stan_magazynowy || 0) > 20 ? '#52c41a' : 
                          (kolor.stan_magazynowy || 0) > 5 ? '#faad14' : '#ff4d4f';
        
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ fontSize: '12px' }}>
                Grubość: {kolor.grubosc}mm
              </Text>
            </div>
            <div>
              <Text 
                style={{ 
                  fontSize: '12px',
                  color: stockColor,
                  fontWeight: 500
                }}
              >
                Stan: {kolor.stan_magazynowy || 0} szt.
              </Text>
            </div>
            {(kolor.grubosc || 0) >= 18 && (
              <Tag size="small" color="orange">
                MAX 5 szt.
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Ilość płyt',
      dataIndex: 'ilosc',
      key: 'ilosc',
      width: 140,
      render: (_: any, __: any, index: number) => {
        const kolor = kolorePlyty[index];
        const maxPlyt = kolor?.kolor ? getMaxPlytForColor(kolor.kolor) : 5;
        const stanMagazynowy = kolor?.stan_magazynowy || 0;
        const currentValue = kolor?.ilosc || 1;
        
        const hasError = currentValue > stanMagazynowy;
        const exceedsLimit = currentValue > maxPlyt;
        
        return (
          <div>
            <InputNumber
              min={1}
              max={Math.min(maxPlyt, stanMagazynowy)}
              value={currentValue}
              onChange={(value) => onUpdateKolor(index, 'ilosc', value || 1)}
              style={{ width: '100%' }}
              status={hasError || exceedsLimit ? 'error' : undefined}
              disabled={!kolor?.kolor}
            />
            <div style={{ marginTop: 4 }}>
              {!kolor?.kolor ? (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Wybierz płytę
                </Text>
              ) : (
                <Space direction="vertical" size={0}>
                  <Text style={{ fontSize: '10px', color: '#666' }}>
                    Limit: {maxPlyt} szt.
                  </Text>
                  <Text style={{ fontSize: '10px', color: '#666' }}>
                    Dostępne: {stanMagazynowy}
                  </Text>
                  {hasError && (
                    <Text style={{ fontSize: '10px', color: '#ff4d4f' }}>
                      ⚠ Przekroczono stan!
                    </Text>
                  )}
                  {exceedsLimit && (
                    <Text style={{ fontSize: '10px', color: '#ff4d4f' }}>
                      ⚠ Za dużo płyt!
                    </Text>
                  )}
                </Space>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Akcje',
      key: 'actions',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <div style={{ textAlign: 'center' }}>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemoveKolor(index)}
            disabled={kolorePlyty.length === 1}
            title={kolorePlyty.length === 1 ? "Musi zostać przynajmniej jedna pozycja" : "Usuń pozycję"}
          />
          <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
            Pozycja {index + 1}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card size="small" title="Kolory płyt do rozkroju">
      <Table
        columns={columns}
        dataSource={kolorePlyty.map((item, index) => ({ ...item, key: index }))}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        locale={{
          emptyText: 'Brak wybranych płyt'
        }}
      />
      
      {kolorePlyty.length > 0 && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          backgroundColor: '#fafafa',
          borderRadius: 4
        }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>
              <strong>Łącznie pozycji:</strong> {kolorePlyty.length}
            </Text>
            <Text style={{ fontSize: '12px' }}>
              <strong>Łączna ilość płyt:</strong> {kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0)}
            </Text>
          </Space>
        </div>
      )}
      
      {/* Debug info w development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          backgroundColor: '#f0f0f0',
          borderRadius: 4,
          fontSize: '11px'
        }}>
          <strong>Debug - Kolory płyt:</strong>
          <pre style={{ fontSize: '10px', margin: 0 }}>
            {JSON.stringify(kolorePlyty, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
};
