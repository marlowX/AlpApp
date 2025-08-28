import React from 'react';
import { Alert, Typography, Divider } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { FormatkiPreview } from './FormatkiPreview';
import type { Rozkroj } from './types';

const { Text, Title } = Typography;

interface RozkrojPreviewProps {
  rozkroj: Rozkroj;
}

export const RozkrojPreview: React.FC<RozkrojPreviewProps> = ({ rozkroj }) => {
  return (
    <div style={{ background: '#f6ffed', padding: 16, borderRadius: 8 }}>
      <Title level={5} style={{ marginTop: 0 }}>
        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
        Wybrany rozkrój: {rozkroj.kod_rozkroju}
      </Title>
      
      <div style={{ marginBottom: 16 }}>
        <Text>{rozkroj.opis}</Text>
        <br />
        <Text type="secondary">Rozmiar płyty: {rozkroj.rozmiar_plyty}</Text>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <FormatkiPreview 
        formatki={rozkroj.formatki} 
        title="Formatki w rozkroju"
      />
    </div>
  );
};
