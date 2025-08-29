import React from 'react';
import { Space, Tag, Typography } from 'antd';
import type { KolorPlyty } from '../types';

const { Text } = Typography;

interface ParametryColumnProps {
  kolor: KolorPlyty;
}

export const ParametryColumn: React.FC<ParametryColumnProps> = ({ kolor }) => {
  if (!kolor?.kolor) {
    return <Text type="secondary" style={{ fontSize: '11px' }}>Wybierz płytę</Text>;
  }
  
  const stockColor = (kolor.stan_magazynowy || 0) > 20 ? '#52c41a' : 
                    (kolor.stan_magazynowy || 0) > 5 ? '#faad14' : '#ff4d4f';
  
  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <Text strong style={{ fontSize: '11px' }}>
        Grubość: {kolor.grubosc}mm
      </Text>
      <Text 
        style={{ 
          fontSize: '11px',
          color: stockColor,
          fontWeight: 500
        }}
      >
        Stan: {kolor.stan_magazynowy || 0} szt.
      </Text>
      {(kolor.grubosc || 0) >= 18 && (
        <Tag size="small" color="orange" style={{ fontSize: '10px' }}>
          MAX 5 szt.
        </Tag>
      )}
    </Space>
  );
};