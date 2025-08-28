import React from 'react';
import { Alert, Card, Space } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { FormatkiPreview } from './FormatkiPreview';
import type { Rozkroj } from './types';

interface RozkrojPreviewProps {
  rozkroj: Rozkroj;
}

export const RozkrojPreview: React.FC<RozkrojPreviewProps> = ({ rozkroj }) => {
  return (
    <>
      <Alert
        message={`Wybrany rozkrój: ${rozkroj.kod_rozkroju}`}
        description={
          <div>
            <div>{rozkroj.opis}</div>
            <div>Rozmiar płyty: {rozkroj.rozmiar_plyty}</div>
            <div>Formatek w rozkroju: {rozkroj.formatki.length}</div>
          </div>
        }
        type="info"
        style={{ marginBottom: 16 }}
        icon={<CheckCircleOutlined />}
      />

      <Card 
        title={
          <Space>
            <InfoCircleOutlined />
            Formatki w rozkroju ({rozkroj.formatki.length})
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <FormatkiPreview formatki={rozkroj.formatki} />
      </Card>
    </>
  );
};
