import React from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Space, Typography, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  SyncOutlined,
  WarningOutlined,
  TeamOutlined,
  BoxPlotOutlined,
  BgColorsOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import zkoApi from '../services/zkoApi';

const { Title, Text } = Typography;

export const ProductionDashboard: React.FC = () => {
  // Pobierz statystyki produkcji
  const { data: stats } = useQuery({
    queryKey: ['production-stats'],
    queryFn: async () => {
      // TODO: Dodać endpoint API
      return {
        dzisiaj: {
          nowe: 5,
          w_produkcji: 12,
          zakonczone: 8,
          formatki_wyprodukowane: 450,
          palety_zamkniete: 15
        },
        tydzien: {
          nowe: 35,
          w_produkcji: 42,
          zakonczone: 67,
          formatki_wyprodukowane: 3200,
          palety_zamkniete: 110
        },
        operatorzy: [
          { nazwa: 'Jan Kowalski', stanowisko: 'Piła', aktywne_zko: 3 },
          { nazwa: 'Adam Nowak', stanowisko: 'Oklejarka', aktywne_zko: 2 },
          { nazwa: 'Piotr Wiśniewski', stanowisko: 'Wiertarka', aktywne_zko: 4 }
        ],
        top_kolory: [
          { kolor: 'BIAŁY', ilosc: 120 },
          { kolor: 'DĄB SONOMA', ilosc: 95 },
          { kolor: 'GRAFIT', ilosc: 78 },
          { kolor: 'SZARY', ilosc: 65 },
          { kolor: 'CZARNY', ilosc: 45 }
        ]
      };
    },
    refetchInterval: 30000 // Odświeżaj co 30 sekund
  });

  const operatorColumns = [
    {
      title: 'Operator',
      dataIndex: 'nazwa',
      key: 'nazwa',
      render: (text: string) => (
        <Space>
          <TeamOutlined />
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Stanowisko',
      dataIndex: 'stanowisko',
      key: 'stanowisko',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Aktywne ZKO',
      dataIndex: 'aktywne_zko',
      key: 'aktywne_zko',
      align: 'center' as const,
      render: (value: number) => (
        <Tag color={value > 3 ? 'orange' : 'green'}>{value}</Tag>
      )
    }
  ];

  const kolorColumns = [
    {
      title: 'Kolor płyty',
      dataIndex: 'kolor',
      key: 'kolor',
      render: (text: string) => (
        <Space>
          <BgColorsOutlined />
          <Tag color="blue">{text}</Tag>
        </Space>
      )
    },
    {
      title: 'Ilość płyt',
      dataIndex: 'ilosc',
      key: 'ilosc',
      align: 'right' as const,
      render: (value: number) => <Text strong>{value}</Text>
    },
    {
      title: 'Udział',
      dataIndex: 'ilosc',
      key: 'udzial',
      align: 'right' as const,
      render: (value: number) => {
        const total = stats?.top_kolory.reduce((sum, k) => sum + k.ilosc, 0) || 1;
        const percent = Math.round((value / total) * 100);
        return <Progress percent={percent} size="small" strokeWidth={4} />;
      }
    }
  ];

  if (!stats) return null;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard Produkcji</Title>
      
      {/* Statystyki dzisiejsze */}
      <Card title="Dzisiaj" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Nowe ZKO"
              value={stats.dzisiaj.nowe}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="W produkcji"
              value={stats.dzisiaj.w_produkcji}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Zakończone"
              value={stats.dzisiaj.zakonczone}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Formatki wyprodukowane"
              value={stats.dzisiaj.formatki_wyprodukowane}
              prefix={<BoxPlotOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Statystyki tygodniowe */}
      <Card title="Ten tydzień" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Wszystkie ZKO"
              value={stats.tydzien.nowe + stats.tydzien.w_produkcji + stats.tydzien.zakonczone}
              suffix={
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  zleceń
                </Text>
              }
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Wskaźnik realizacji"
              value={Math.round((stats.tydzien.zakonczone / (stats.tydzien.zakonczone + stats.tydzien.w_produkcji)) * 100)}
              suffix="%"
              valueStyle={{ 
                color: stats.tydzien.zakonczone > 50 ? '#52c41a' : '#faad14' 
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Formatki łącznie"
              value={stats.tydzien.formatki_wyprodukowane}
              prefix={<BoxPlotOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Palety zamknięte"
              value={stats.tydzien.palety_zamkniete}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* Operatorzy */}
        <Col span={12}>
          <Card title="Aktywni operatorzy">
            <Table
              dataSource={stats.operatorzy}
              columns={operatorColumns}
              pagination={false}
              size="small"
              rowKey="nazwa"
            />
          </Card>
        </Col>

        {/* Top kolory */}
        <Col span={12}>
          <Card title="Najpopularniejsze kolory płyt">
            <Table
              dataSource={stats.top_kolory}
              columns={kolorColumns}
              pagination={false}
              size="small"
              rowKey="kolor"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
