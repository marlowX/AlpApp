import React from 'react';
import { Table, Button, InputNumber, Typography } from 'antd';
import { DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { PlytySelector } from './PlytySelector';
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

  const columns = [
    {
      title: 'Kolor płyty',
      dataIndex: 'kolor',
      key: 'kolor',
      width: 300,
      render: (_: any, __: any, index: number) => (
        <PlytySelector
          plyty={plyty}
          loading={plytyLoading}
          searchText={searchText}
          onSearchChange={onSearchChange}
          value={kolorePlyty[index]?.kolor}
          onChange={(value) => onUpdateKolor(index, 'kolor', value)}
          placeholder="Wybierz kolor płyty"
        />
      ),
    },
    {
      title: 'Wybrana płyta',
      dataIndex: 'nazwa',
      key: 'nazwa',
      width: 180,
      render: (_: any, __: any, index: number) => {
        const kolor = kolorePlyty[index];
        
        return kolor?.kolor ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              <Text strong>{kolor.kolor}</Text>
            </div>
            <Text code style={{ fontSize: '11px' }}>{kolor.nazwa}</Text>
            <br />
            <Text style={{ fontSize: '10px' }}>
              Grubość: {kolor.grubosc}mm
            </Text>
            <br />
            <Text 
              style={{ 
                fontSize: '10px',
                color: (kolor.stan_magazynowy || 0) > 20 ? '#52c41a' : 
                       (kolor.stan_magazynowy || 0) > 5 ? '#faad14' : '#ff4d4f'
              }}
            >
              Stan: {kolor.stan_magazynowy || 0} szt.
            </Text>
          </div>
        ) : (
          <Text type="secondary">Nie wybrano</Text>
        );
      },
    },
    {
      title: 'Ilość płyt',
      dataIndex: 'ilosc',
      key: 'ilosc',
      width: 120,
      render: (_: any, __: any, index: number) => {
        const kolor = kolorePlyty[index];
        const maxPlyt = kolor?.kolor ? getMaxPlytForColor(kolor.kolor) : 5;
        const stanMagazynowy = kolor?.stan_magazynowy || 0;
        const currentValue = kolor?.ilosc || 1;
        
        return (
          <div>
            <InputNumber
              min={1}
              max={Math.min(maxPlyt, stanMagazynowy)}
              value={currentValue}
              onChange={(value) => onUpdateKolor(index, 'ilosc', value || 1)}
              style={{ width: '100%' }}
              status={currentValue > stanMagazynowy ? 'error' : undefined}
            />
            <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
              <div>max: {maxPlyt} (limit)</div>
              <div>dostępne: {stanMagazynowy}</div>
              {currentValue > stanMagazynowy && (
                <div style={{ color: '#ff4d4f' }}>
                  Przekroczono stan!
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Akcje',
      key: 'actions',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onRemoveKolor(index)}
          disabled={kolorePlyty.length === 1}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={kolorePlyty.map((item, index) => ({ ...item, key: index }))}
      pagination={false}
      size="small"
    />
  );
};
