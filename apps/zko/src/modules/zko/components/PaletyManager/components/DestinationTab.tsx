import React from 'react';
import { 
  Alert,
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag
} from 'antd';
import { ToolOutlined } from '@ant-design/icons';

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: any[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  przeznaczenie?: string;
}

interface DestinationTabProps {
  palety: Paleta[];
}

export const DestinationTab: React.FC<DestinationTabProps> = ({ palety }) => {
  const destinations: Record<string, { color: string; icon: string }> = {
    'MAGAZYN': { color: 'blue', icon: '📦' },
    'OKLEINIARKA': { color: 'orange', icon: '🎨' },
    'WIERCENIE': { color: 'purple', icon: '🔧' },
    'CIECIE': { color: 'red', icon: '✂️' },
    'WYSYLKA': { color: 'green', icon: '✅' }
  };

  return (
    <>
      <Alert
        message="Przeznaczenie palet"
        description="Przegląd palet według ich przeznaczenia w procesie produkcyjnym."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      {/* Grupowanie palet według przeznaczenia */}
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="📦 Magazyn" 
              value={palety.filter(p => p.przeznaczenie === 'MAGAZYN').length}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="🎨 Okleiniarka" 
              value={palety.filter(p => p.przeznaczenie === 'OKLEINIARKA').length}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="🔧 Wiercenie" 
              value={palety.filter(p => p.przeznaczenie === 'WIERCENIE').length}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="✂️ Cięcie" 
              value={palety.filter(p => p.przeznaczenie === 'CIECIE').length}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Lista palet z przeznaczeniem */}
      <Table
        style={{ marginTop: 16 }}
        dataSource={palety}
        rowKey="id"
        columns={[
          {
            title: 'Numer palety',
            dataIndex: 'numer_palety',
            key: 'numer_palety',
          },
          {
            title: 'Przeznaczenie',
            dataIndex: 'przeznaczenie',
            key: 'przeznaczenie',
            render: (val) => {
              const dest = destinations[val] || { color: 'default', icon: '❓' };
              return <Tag color={dest.color}>{dest.icon} {val || 'Nieoznaczona'}</Tag>;
            }
          },
          {
            title: 'Formatek',
            dataIndex: 'ilosc_formatek',
            key: 'ilosc_formatek',
            render: (val) => `${val} szt.`
          },
          {
            title: 'Waga',
            dataIndex: 'waga_kg',
            key: 'waga_kg',
            render: (val) => val ? `${val.toFixed(1)} kg` : '-'
          },
          {
            title: 'Kolory',
            dataIndex: 'kolory_na_palecie',
            key: 'kolory_na_palecie',
            render: (val) => val || '-'
          }
        ]}
        pagination={false}
      />
    </>
  );
};