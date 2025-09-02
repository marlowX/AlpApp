import React from 'react';
import { Row, Col, Typography, Space, Tag, Progress, Tooltip } from 'antd';
import {
  InfoCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface ZKOHeaderCompactProps {
  zko: any;
  postepRealizacji: number;
}

export const ZKOHeaderCompact: React.FC<ZKOHeaderCompactProps> = ({ zko, postepRealizacji }) => {
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
    { key: 'nowe', label: 'Nowe', icon: '📝' },
    { key: 'ciecie', label: 'Cięcie', icon: '✂️' },
    { key: 'oklejanie', label: 'Oklejanie', icon: '🎨' },
    { key: 'wiercenie', label: 'Wiercenie', icon: '🔧' },
    { key: 'pakowanie', label: 'Pakowanie', icon: '📦' },
    { key: 'zakonczone', label: 'Zakończone', icon: '✅' }
  ];

  const aktywnyEtap = Math.floor((postepRealizacji / 100) * etapy.length);

  return (
    <div style={{ marginBottom: 12 }}>
      {/* SUPER KOMPAKTOWY NAGŁÓWEK - JEDNA LINIA */}
      <div style={{ 
        padding: '6px 12px',
        background: '#fafafa',
        borderRadius: '4px',
        border: '1px solid #e8e8e8',
        marginBottom: 6
      }}>
        <Row gutter={16} align="middle" style={{ minHeight: 28 }}>
          <Col>
            <Space size={4}>
              <InfoCircleOutlined style={{ fontSize: 12, color: '#1890ff' }} />
              <Text strong style={{ fontSize: '12px' }}>{zko.numer_zko}</Text>
            </Space>
          </Col>
          
          <Col>
            <Space size={4}>
              <TeamOutlined style={{ fontSize: 12, color: '#52c41a' }} />
              <Text style={{ fontSize: '11px' }}>{zko.kooperant_nazwa || 'Brak'}</Text>
            </Space>
          </Col>

          <Col>
            <Tag 
              color={zko.priorytet === 'wysoki' ? 'red' : zko.priorytet === 'niski' ? 'blue' : 'orange'}
              style={{ margin: 0, fontSize: '10px', padding: '0 4px', lineHeight: '14px' }}
            >
              {zko.priorytet_label || 'Normalny'}
            </Tag>
          </Col>

          <Col>
            <Space size={4}>
              <CalendarOutlined style={{ fontSize: 12 }} />
              <Text style={{ fontSize: '11px' }}>
                {new Date(zko.data_utworzenia).toLocaleDateString('pl-PL')}
              </Text>
            </Space>
          </Col>

          <Col>
            <Tag 
              color={getStatusColor(zko.status)}
              style={{ margin: 0, fontSize: '10px', lineHeight: '14px' }}
            >
              {zko.status_label || zko.status}
            </Tag>
          </Col>

          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: '11px', marginRight: 8 }}>
              Utworzył: {zko.utworzyl || 'system'}
            </Text>
          </Col>
        </Row>
      </div>

      {/* PASEK POSTĘPU - SUPER KOMPAKTOWY */}
      <div style={{ 
        padding: '4px 12px',
        background: 'white',
        borderRadius: '4px',
        border: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 32
      }}>
        <Text style={{ fontSize: '11px', color: '#666' }}>Postęp:</Text>
        <Text strong style={{ fontSize: '12px', color: '#1890ff', minWidth: 35 }}>
          {postepRealizacji}%
        </Text>
        
        <Progress 
          percent={postepRealizacji} 
          showInfo={false}
          strokeHeight={4}
          style={{ flex: 1, margin: 0 }}
        />

        <div style={{ display: 'flex', gap: 2 }}>
          {etapy.map((etap, index) => (
            <Tooltip 
              key={etap.key} 
              title={etap.label}
              placement="bottom"
            >
              <div
                style={{
                  padding: '2px 6px',
                  background: index <= aktywnyEtap ? '#1890ff' : '#f0f0f0',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: index <= aktywnyEtap ? 1 : 0.5
                }}
              >
                {etap.icon}
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ZKOHeaderCompact;
