import React from 'react';
import { Alert, Card, Space, Spin } from 'antd';
import { InfoCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { RozkrojSelector } from '../RozkrojSelector';
import { RozkrojPreview } from '../RozkrojPreview';
import type { Rozkroj } from '../types';

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
  const selectedRozkroj = rozkroje.find(r => r.id === selectedRozkrojId) || null;

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

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Ładowanie rozkrojów...</div>
          </div>
        </Card>
      ) : (
        <>
          <Card 
            title={
              <Space>
                <InfoCircleOutlined />
                Dostępne rozkroje ({rozkroje.length})
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <RozkrojSelector
              rozkroje={rozkroje}
              loading={loading}
              onChange={onChange}
              value={selectedRozkrojId}
            />
          </Card>

          {selectedRozkroj && (
            <Card style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              <RozkrojPreview rozkroj={selectedRozkroj} />
            </Card>
          )}

          {!selectedRozkrojId && !loading && (
            <Alert
              message="Wybierz rozkrój aby kontynuować"
              description="Po wybraniu rozkroju będziesz mógł przejść do następnego kroku"
              type="warning"
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}
    </div>
  );
};
