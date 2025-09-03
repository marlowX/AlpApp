import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InboxOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import './ZKOListStats.css';

interface ZKOListStatsProps {
  zkoList: any[];
}

export const ZKOListStats: React.FC<ZKOListStatsProps> = ({ zkoList }) => {
  // Oblicz statystyki na podstawie danych
  const stats = {
    total: zkoList.length,
    nowe: zkoList.filter(z => z.status === 'nowe').length,
    wRealizacji: zkoList.filter(z => 
      z.status !== 'nowe' && 
      z.status !== 'ZAKONCZONE' && 
      z.status !== 'ANULOWANE'
    ).length,
    zakonczone: zkoList.filter(z => z.status === 'ZAKONCZONE').length,
    wysokiPriorytet: zkoList.filter(z => z.priorytet <= 2).length,
    // Sumuj statystyki ze wszystkich ZKO
    totalPalety: zkoList.reduce((sum, z) => sum + (z.palety_count || 0), 0),
    totalFormatki: zkoList.reduce((sum, z) => sum + (z.formatki_total || 0), 0),
    totalPlyty: zkoList.reduce((sum, z) => sum + (z.plyty_total || 0), 0),
    totalWaga: zkoList.reduce((sum, z) => sum + (Number(z.waga_total) || 0), 0),
  };

  // Formatowanie liczb
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="zko-stats-bar">
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card" size="small">
            <Statistic
              title="Wszystkie"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card stat-new" size="small">
            <Statistic
              title="Nowe"
              value={stats.nowe}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: 20, color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card stat-progress" size="small">
            <Statistic
              title="W realizacji"
              value={stats.wRealizacji}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: 20, color: '#fa8c16' }}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card stat-done" size="small">
            <Statistic
              title="Zakończone"
              value={stats.zakonczone}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: 20, color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card stat-priority" size="small">
            <Statistic
              title="Pilne"
              value={stats.wysokiPriorytet}
              prefix={<WarningOutlined />}
              valueStyle={{ fontSize: 20, color: '#f5222d' }}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card" size="small">
            <Statistic
              title="Palety"
              value={formatNumber(stats.totalPalety)}
              prefix={<InboxOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card" size="small">
            <Statistic
              title="Formatki"
              value={formatNumber(stats.totalFormatki)}
              prefix={<AppstoreOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        
        <Col xs={12} sm={8} md={3}>
          <Card className="stat-card" size="small">
            <Statistic
              title="Waga [t]"
              value={(stats.totalWaga / 1000).toFixed(1)}
              prefix={<span>⚖️</span>}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ZKOListStats;