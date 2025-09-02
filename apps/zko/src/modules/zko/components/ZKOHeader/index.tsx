import React from 'react';
import { Card, Row, Col, Typography, Space, Tag, Progress, Tooltip } from 'antd';
import {
  InfoCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface ZKOHeaderProps {
  zko: any;
  postepRealizacji: number;
}

export const ZKOHeader: React.FC<ZKOHeaderProps> = ({ zko, postepRealizacji }) => {
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'NOWE': 'blue',
      'W_REALIZACJI': 'processing',
      'ZAKONCZONE': 'success',
      'ANULOWANE': 'error',
      'WSTRZYMANE': 'warning'
    };
    return statusMap[status] || 'default';
  };

  const etapy = [
    { key: 'nowe', label: 'Nowe', icon: <FileTextOutlined />, opis: 'Zlecenie utworzone' },
    { key: 'ciecie', label: 'Cięcie', icon: '✂️', opis: 'Piła formatowa' },
    { key: 'oklejanie', label: 'Oklejanie', icon: '🎨', opis: 'Okleiniarki' },
    { key: 'wiercenie', label: 'Wiercenie', icon: '🔧', opis: 'Wiertarki' },
    { key: 'pakowanie', label: 'Pakowanie', icon: '📦', opis: 'Przygotowanie' },
    { key: 'zakonczone', label: 'Zakończone', icon: <CheckCircleOutlined />, opis: 'Gotowe' }
  ];

  const aktywnyEtap = Math.floor((postepRealizacji / 100) * etapy.length);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Informacje podstawowe - kompaktowy pasek */}
      <Card 
        size="small"
        styles={{ 
          body: { 
            padding: '8px 16px',
            background: '#fafafa'
          } 
        }}
        style={{ marginBottom: 8 }}
      >
        <Row gutter={[24, 0]} align="middle">
          <Col span={4}>
            <Space size="small">
              <InfoCircleOutlined style={{ fontSize: 14, color: '#1890ff' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Numer ZKO
                </Text>
                <Text strong style={{ fontSize: '13px' }}>
                  {zko.numer_zko}
                </Text>
              </div>
            </Space>
          </Col>

          <Col span={5}>
            <Space size="small">
              <TeamOutlined style={{ fontSize: 14, color: '#52c41a' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Kooperant
                </Text>
                <Text style={{ fontSize: '12px' }}>
                  {zko.kooperant_nazwa || 'Brak'}
                </Text>
              </div>
            </Space>
          </Col>

          <Col span={3}>
            <Space size="small">
              <FlagOutlined style={{ fontSize: 14, color: '#fa8c16' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Priorytet
                </Text>
                <Tag 
                  color={zko.priorytet === 'wysoki' ? 'red' : zko.priorytet === 'niski' ? 'blue' : 'orange'}
                  style={{ margin: 0, fontSize: '11px', padding: '0 4px', lineHeight: '16px' }}
                >
                  {zko.priorytet_label || 'Normalny'}
                </Tag>
              </div>
            </Space>
          </Col>

          <Col span={4}>
            <Space size="small">
              <CalendarOutlined style={{ fontSize: 14, color: '#722ed1' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Utworzono
                </Text>
                <Text style={{ fontSize: '12px' }}>
                  {new Date(zko.data_utworzenia).toLocaleDateString('pl-PL')}
                </Text>
              </div>
            </Space>
          </Col>

          <Col span={4}>
            <Space size="small">
              <ClockCircleOutlined style={{ fontSize: 14, color: '#13c2c2' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Planowana
                </Text>
                <Text style={{ fontSize: '12px' }}>
                  {zko.data_planowana ? 
                    new Date(zko.data_planowana).toLocaleDateString('pl-PL') : 
                    '-'
                  }
                </Text>
              </div>
            </Space>
          </Col>

          <Col span={4}>
            <div>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>
                Status
              </Text>
              <Tag 
                color={getStatusColor(zko.status)}
                style={{ margin: 0, fontSize: '11px' }}
              >
                {zko.status_label || zko.status}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Etapy realizacji - kompaktowy pasek z postępem */}
      <Card 
        size="small"
        styles={{ 
          body: { 
            padding: '8px 16px',
            background: 'white'
          } 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Space size="small">
            <Text type="secondary" style={{ fontSize: '11px' }}>Postęp:</Text>
            <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
              {postepRealizacji}%
            </Text>
          </Space>

          <Progress 
            percent={postepRealizacji} 
            showInfo={false}
            strokeHeight={6}
            style={{ flex: 1, margin: '0 8px' }}
          />

          <div style={{ display: 'flex', gap: 4 }}>
            {etapy.map((etap, index) => (
              <Tooltip 
                key={etap.key} 
                title={
                  <div style={{ fontSize: '11px' }}>
                    <div>{etap.label}</div>
                    <div style={{ opacity: 0.8 }}>{etap.opis}</div>
                  </div>
                }
              >
                <div
                  style={{
                    padding: '4px 8px',
                    background: index <= aktywnyEtap ? '#1890ff' : '#f0f0f0',
                    color: index <= aktywnyEtap ? 'white' : '#999',
                    borderRadius: '4px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {typeof etap.icon === 'string' ? (
                    <span style={{ fontSize: '14px' }}>{etap.icon}</span>
                  ) : (
                    etap.icon
                  )}
                  <Text 
                    style={{ 
                      fontSize: '10px', 
                      color: index <= aktywnyEtap ? 'white' : '#999',
                      fontWeight: index === aktywnyEtap ? 'bold' : 'normal'
                    }}
                  >
                    {etap.label}
                  </Text>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ZKOHeader;
