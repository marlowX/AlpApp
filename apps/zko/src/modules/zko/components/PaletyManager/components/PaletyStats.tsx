import React from 'react';
import { Card, Row, Col, Statistic, Space, Typography, Tag, Progress, Tooltip } from 'antd';
import { 
  AppstoreOutlined, 
  FileTextOutlined, 
  BoxPlotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface Paleta {
  id: number;
  numer_palety: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  waga_kg?: number;
  przeznaczenie?: string;
  kierunek?: string;
}

interface PaletyStatsProps {
  palety: Paleta[];
  pozycjaId?: number;
  loading?: boolean;
}

export const PaletyStats: React.FC<PaletyStatsProps> = ({
  palety,
  pozycjaId,
  loading = false
}) => {
  
  // Oblicz statystyki
  const totalPalet = palety.length;
  const totalSztuk = palety.reduce((sum, p) => {
    const val = Number(p.sztuk_total || p.ilosc_formatek || 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);
  
  const totalWysokosc = palety.reduce((sum, p) => {
    const val = Number(p.wysokosc_stosu || 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);
  
  const totalWaga = palety.reduce((sum, p) => {
    const val = Number(p.waga_kg || 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);

  // Statystyki według statusu
  const paletasByStatus = palety.reduce((acc, p) => {
    const status = p.status || 'nieznany';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Statystyki według przeznaczenia
  const paletasByPrzeznaczenie = palety.reduce((acc, p) => {
    const przeznaczenie = p.przeznaczenie || p.kierunek || 'nieokreślone';
    acc[przeznaczenie] = (acc[przeznaczenie] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Średnie wartości
  const sredniaWysokosc = totalPalet > 0 ? Math.round(totalWysokosc / totalPalet) : 0;
  const sredniaWaga = totalPalet > 0 ? Number((totalWaga / totalPalet).toFixed(1)) : 0;
  const sredniaFormatek = totalPalet > 0 ? Math.round(totalSztuk / totalPalet) : 0;

  // Wykorzystanie zasobów
  const wykorzystanieWysokosc = Math.round((sredniaWysokosc / 1440) * 100);
  const wykorzystanieWaga = Math.round((sredniaWaga / 700) * 100);

  // Ikony dla przeznaczenia
  const przeznaczenieIcons: Record<string, string> = {
    'MAGAZYN': '📦',
    'OKLEINIARKA': '🎨',
    'WIERCENIE': '🔧',
    'CIECIE': '✂️',
    'WYSYLKA': '🚚',
    'nieokreślone': '❓'
  };

  if (totalPalet === 0) {
    return (
      <Card 
        title={
          <Space>
            <AppstoreOutlined />
            <Text strong>Statystyki palet</Text>
            {pozycjaId && <Tag color="blue">Pozycja {pozycjaId}</Tag>}
          </Space>
        }
        loading={loading}
        style={{ marginBottom: 16 }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
          <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>Brak palet do wyświetlenia</div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Statystyki palet</Text>
          {pozycjaId && <Tag color="blue">Pozycja {pozycjaId}</Tag>}
          <Tag color="green">{totalPalet} palet</Tag>
        </Space>
      }
      loading={loading}
      style={{ marginBottom: 16 }}
    >
      {/* Podstawowe statystyki */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Łączna liczba palet"
            value={totalPalet}
            prefix={<AppstoreOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Łączna liczba formatek"
            value={totalSztuk}
            suffix="szt."
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Łączna wysokość"
            value={totalWysokosc}
            suffix="mm"
            prefix={<BoxPlotOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Łączna waga"
            value={totalWaga.toFixed(1)}
            suffix="kg"
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>

      {/* Średnie wartości */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
            <Statistic
              title="Średnio formatek na paletę"
              value={sredniaFormatek}
              suffix="szt."
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ backgroundColor: '#fff7e6' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Średnia wysokość palety</Text>
              <Text strong style={{ fontSize: 20, color: '#faad14' }}>
                {sredniaWysokosc} mm
              </Text>
              <Progress 
                percent={wykorzystanieWysokosc} 
                size="small" 
                strokeColor={wykorzystanieWysokosc > 90 ? '#ff4d4f' : '#faad14'}
                format={percent => `${percent}% max`}
              />
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ backgroundColor: '#f9f0ff' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Średnia waga palety</Text>
              <Text strong style={{ fontSize: 20, color: '#722ed1' }}>
                {sredniaWaga} kg
              </Text>
              <Progress 
                percent={wykorzystanieWaga} 
                size="small" 
                strokeColor={wykorzystanieWaga > 90 ? '#ff4d4f' : '#722ed1'}
                format={percent => `${percent}% max`}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Statystyki według statusu */}
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            size="small" 
            title={
              <Space>
                <CheckCircleOutlined />
                <Text strong>Status palet</Text>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(paletasByStatus).map(([status, count]) => {
                const percent = Math.round((count / totalPalet) * 100);
                const statusColors: Record<string, string> = {
                  'przygotowanie': 'orange',
                  'PRZYGOTOWANE': 'blue',
                  'W_PRODUKCJI': 'orange',
                  'WYPRODUKOWANE': 'green',
                  'WYSLANE': 'purple',
                  'DOSTARCZONE': 'cyan'
                };
                
                return (
                  <div key={status} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={statusColors[status] || 'default'}>
                        {status.replace(/_/g, ' ')}
                      </Tag>
                      <Text strong>{count} ({percent}%)</Text>
                    </div>
                    <Progress 
                      percent={percent} 
                      size="small" 
                      showInfo={false}
                      strokeColor={statusColors[status] || '#1890ff'}
                    />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            size="small" 
            title={
              <Space>
                <ClockCircleOutlined />
                <Text strong>Przeznaczenie palet</Text>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(paletasByPrzeznaczenie).map(([przeznaczenie, count]) => {
                const percent = Math.round((count / totalPalet) * 100);
                const colors: Record<string, string> = {
                  'MAGAZYN': 'blue',
                  'OKLEINIARKA': 'orange',
                  'WIERCENIE': 'purple',
                  'CIECIE': 'red',
                  'WYSYLKA': 'green',
                  'nieokreślone': 'default'
                };
                
                return (
                  <div key={przeznaczenie} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={colors[przeznaczenie] || 'default'}>
                        {przeznaczenieIcons[przeznaczenie]} {przeznaczenie}
                      </Tag>
                      <Text strong>{count} ({percent}%)</Text>
                    </div>
                    <Progress 
                      percent={percent} 
                      size="small" 
                      showInfo={false}
                      strokeColor={colors[przeznaczenie] === 'default' ? '#d9d9d9' : undefined}
                    />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Ostrzeżenia */}
      {(wykorzystanieWysokosc > 95 || wykorzystanieWaga > 95) && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff2e8', borderRadius: 6, border: '1px solid #ffb38a' }}>
          <Space direction="vertical">
            <Text strong style={{ color: '#d46b08' }}>⚠️ Ostrzeżenia:</Text>
            {wykorzystanieWysokosc > 95 && (
              <Text style={{ color: '#d46b08' }}>
                • Średnia wysokość palet przekracza 95% limitu ({sredniaWysokosc}/1440mm)
              </Text>
            )}
            {wykorzystanieWaga > 95 && (
              <Text style={{ color: '#d46b08' }}>
                • Średnia waga palet przekracza 95% limitu ({sredniaWaga}/700kg)
              </Text>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};