import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { 
  InfoCircleOutlined, 
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

interface PozycjaStatisticsProps {
  kolorePlytyCount: number;
  totalKolory: number;
  totalPlyty: number;
  totalFormatki: number;
  isFormValid: boolean;
}

export const PozycjaStatistics: React.FC<PozycjaStatisticsProps> = ({
  kolorePlytyCount,
  totalKolory,
  totalPlyty,
  totalFormatki,
  isFormValid
}) => {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="Kolory płyt"
            value={kolorePlytyCount}
            suffix={`/ ${totalKolory}`}
            prefix={<InfoCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="Łączna ilość płyt"
            value={totalPlyty}
            prefix={<DatabaseOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="Formatki do produkcji"
            value={totalFormatki}
            prefix={<InfoCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="Status"
            value={isFormValid ? 'Gotowe' : 'Uzupełnij'}
            valueStyle={{ 
              color: isFormValid ? '#3f8600' : '#cf1322',
              fontSize: '16px'
            }}
            prefix={isFormValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};
