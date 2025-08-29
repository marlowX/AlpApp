import React from 'react';
import { Tag, Badge, Tooltip, Space, Typography } from 'antd';
import { ExpandOutlined, WarningOutlined } from '@ant-design/icons';
import type { KolorPlyty, Plyta } from '../types';

const { Text } = Typography;

interface WymiaryColumnProps {
  kolor: KolorPlyty;
  plyta: Plyta | undefined;
  wymiaryAnaliza: {
    najczestszyRozmiar: string | null;
    grupy: Map<string, number>;
  };
}

export const WymiaryColumn: React.FC<WymiaryColumnProps> = ({
  kolor,
  plyta,
  wymiaryAnaliza
}) => {
  if (!kolor?.kolor || !plyta) {
    return <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>;
  }
  
  const rozmiarKey = `${plyta.dlugosc || 0}x${plyta.szerokosc || 0}`;
  const isNajczestszy = rozmiarKey === wymiaryAnaliza.najczestszyRozmiar;
  const ileRoznychRozmiarow = wymiaryAnaliza.grupy.size;
  
  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Tooltip title={
        <div>
          <div>Długość: {plyta.dlugosc || 0} mm</div>
          <div>Szerokość: {plyta.szerokosc || 0} mm</div>
          {ileRoznychRozmiarow > 1 && (
            <div style={{ marginTop: 8 }}>
              {isNajczestszy ? 
                '✓ Najczęstszy rozmiar' : 
                '⚠ Inny rozmiar niż większość'}
            </div>
          )}
        </div>
      }>
        <Badge 
          dot={ileRoznychRozmiarow > 1 && !isNajczestszy}
          color="orange"
          offset={[-2, 2]}
        >
          <Tag 
            icon={<ExpandOutlined />}
            color={
              ileRoznychRozmiarow === 1 ? 'green' :
              isNajczestszy ? 'blue' : 'orange'
            }
            style={{ margin: 0, fontSize: '11px' }}
          >
            {plyta.dlugosc || 0} x {plyta.szerokosc || 0}
          </Tag>
        </Badge>
      </Tooltip>
      
      {ileRoznychRozmiarow > 1 && !isNajczestszy && (
        <Text type="warning" style={{ fontSize: '10px' }}>
          <WarningOutlined /> Inny rozmiar
        </Text>
      )}
    </Space>
  );
};