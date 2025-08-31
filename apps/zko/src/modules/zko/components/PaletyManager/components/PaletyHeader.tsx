/**
 * @fileoverview Komponent nagłówka dla PaletyManager
 * @module PaletyHeader
 * 
 * UWAGA: Maksymalnie 300 linii kodu na plik!
 * Jeśli plik przekracza limit, należy go rozbić na podkomponenty.
 */

import React from 'react';
import { Space, Typography, Badge, Spin, Button, Popconfirm } from 'antd';
import { 
  AppstoreOutlined, 
  ReloadOutlined, 
  SyncOutlined,
  ClearOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface PaletyHeaderProps {
  paletyCount: number;
  loading: boolean;
  modularLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onDeleteAll: () => void;
}

export const PaletyHeader: React.FC<PaletyHeaderProps> = ({
  paletyCount,
  loading,
  modularLoading,
  refreshing,
  onRefresh,
  onDeleteAll
}) => {
  return {
    title: (
      <Space>
        <AppstoreOutlined />
        <Text strong>Zarządzanie paletami</Text>
        {paletyCount > 0 && (
          <Badge count={paletyCount} style={{ backgroundColor: '#52c41a' }} />
        )}
        {(loading || modularLoading || refreshing) && <Spin size="small" />}
      </Space>
    ),
    extra: (
      <Space>
        <Button 
          icon={refreshing ? <SyncOutlined spin /> : <ReloadOutlined />} 
          onClick={onRefresh}
          loading={refreshing}
          type={refreshing ? 'primary' : 'default'}
        >
          {refreshing ? 'Odświeżanie...' : 'Odśwież'}
        </Button>
        {paletyCount > 0 && (
          <Popconfirm
            title="Czy na pewno usunąć wszystkie palety?"
            description={`Zostanie usuniętych ${paletyCount} palet`}
            onConfirm={onDeleteAll}
            okText="Usuń wszystkie"
            cancelText="Anuluj"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger
              icon={<ClearOutlined />}
              loading={loading}
            >
              Usuń wszystkie palety
            </Button>
          </Popconfirm>
        )}
      </Space>
    )
  };
};