import React from 'react';
import { Row, Col, Card, Statistic, Alert } from 'antd';
import { AppstoreOutlined, WarningOutlined } from '@ant-design/icons';

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  ilosc_formatek: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids: number[];
}

interface PaletyStatsProps {
  palety: Paleta[];
}

export const PaletyStats: React.FC<PaletyStatsProps> = ({ palety }) => {
  // Oblicz statystyki
  const totalFormatek = palety.reduce((sum, p) => sum + (p.ilosc_formatek || 0), 0);
  const avgWysokosc = palety.length > 0 
    ? Math.round(palety.reduce((sum, p) => sum + (p.wysokosc_stosu || 0), 0) / palety.length)
    : 0;
  const maxWysokosc = Math.max(...palety.map(p => p.wysokosc_stosu || 0), 0);
  const paletyPrzekroczone = palety.filter(p => (p.wysokosc_stosu || 0) > 1440).length;

  return (
    <>
      {/* Statystyki */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Ilość palet"
              value={palety.length}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Łącznie formatek"
              value={totalFormatek}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Średnia wysokość"
              value={avgWysokosc}
              suffix="mm"
              valueStyle={{ color: avgWysokosc > 1200 ? '#faad14' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Max wysokość"
              value={maxWysokosc}
              suffix="mm"
              valueStyle={{ color: maxWysokosc > 1440 ? '#ff4d4f' : '#3f8600' }}
              prefix={maxWysokosc > 1440 ? <WarningOutlined /> : null}
            />
          </Card>
        </Col>
      </Row>

      {paletyPrzekroczone > 0 && (
        <Alert
          message={`Uwaga! ${paletyPrzekroczone} palet${paletyPrzekroczone > 1 ? 'y' : 'a'} przekracza maksymalną wysokość 1440mm`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
    </>
  );
};