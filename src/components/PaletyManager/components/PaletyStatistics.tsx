import React from 'react';
import { Card, Row, Col, Statistic, Space, Tag } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { Paleta, Formatka, PaletaStats, PALLET_DESTINATIONS } from '../types';

interface PaletyStatisticsProps {
  palety: Paleta[];
  formatki: Formatka[];
  pozostaleIlosci: Record<number, number>;
  obliczStatystykiPalety: (paleta: Paleta) => PaletaStats;
}

export const PaletyStatistics: React.FC<PaletyStatisticsProps> = ({
  palety,
  formatki,
  pozostaleIlosci,
  obliczStatystykiPalety
}) => {
  const totalPrzypisane = formatki.reduce((sum, f) => {
    const planowane = f.ilosc_dostepna !== undefined ? f.ilosc_dostepna : f.ilosc_planowana;
    return sum + planowane - (pozostaleIlosci[f.id] || 0);
  }, 0);

  const totalPlanowane = formatki.reduce((sum, f) => 
    sum + (f.ilosc_dostepna !== undefined ? f.ilosc_dostepna : f.ilosc_planowana), 0
  );

  const totalWaga = palety.reduce((sum, p) => 
    sum + obliczStatystykiPalety(p).waga, 0
  );

  return (
    <Card style={{ marginTop: 16 }} size="small">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic 
            title="Palety utworzone" 
            value={palety.length}
            prefix={<AppstoreOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Formatki przypisane" 
            value={totalPrzypisane}
            suffix={`/ ${totalPlanowane}`}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Łączna waga" 
            value={totalWaga.toFixed(0)}
            suffix="kg"
          />
        </Col>
        <Col span={6}>
          <Space wrap>
            {Object.entries(PALLET_DESTINATIONS).map(([key, dest]) => {
              const count = palety.filter(p => p.przeznaczenie === key).length;
              if (count === 0) return null;
              return (
                <Tag key={key} color={dest.color}>
                  {dest.icon} {dest.label}: {count}
                </Tag>
              );
            })}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
