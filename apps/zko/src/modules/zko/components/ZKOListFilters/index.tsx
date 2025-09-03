import React from 'react';
import { Card, Select, Space, Button, Row, Col } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { statusLabels, priorityColors } from '../../utils/constants';

const { Option } = Select;

interface ZKOListFiltersProps {
  filters: {
    status?: string;
    kooperant?: string;
    search?: string;
    priorytet?: number;
  };
  onChange: (filters: any) => void;
  onReset: () => void;
}

export const ZKOListFilters: React.FC<ZKOListFiltersProps> = ({ 
  filters, 
  onChange, 
  onReset 
}) => {
  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label
  }));

  const priorityOptions = [
    { value: 1, label: '🔴 Krytyczny' },
    { value: 2, label: '🔴 Bardzo wysoki' },
    { value: 3, label: '🟡 Wysoki' },
    { value: 4, label: '🟡 Normalny' },
    { value: 5, label: '🟢 Niski' },
  ];

  // Przykładowi kooperanci - docelowo z API
  const kooperantOptions = [
    { value: 'KOOPERANT_A', label: 'Kooperant A' },
    { value: 'KOOPERANT_B', label: 'Kooperant B' },
    { value: 'KOOPERANT_C', label: 'Kooperant C' },
  ];

  return (
    <Card 
      className="zko-filters-card"
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: '100%' }}
            value={filters.status}
            onChange={(value) => onChange({ status: value })}
          >
            {statusOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Priorytet"
            allowClear
            style={{ width: '100%' }}
            value={filters.priorytet}
            onChange={(value) => onChange({ priorytet: value })}
          >
            {priorityOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Kooperant"
            allowClear
            style={{ width: '100%' }}
            value={filters.kooperant}
            onChange={(value) => onChange({ kooperant: value })}
          >
            {kooperantOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Space>
            <Button 
              size="small"
              onClick={onReset}
              icon={<CloseOutlined />}
            >
              Wyczyść filtry
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ZKOListFilters;
