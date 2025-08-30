import React from 'react';
import { Card, Row, Col, Space, Tag, Text, Progress, Select, Button, Tooltip, Divider, Table, Alert, Popconfirm } from 'antd';
import { CopyOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Paleta, PaletaStats, Formatka, PALLET_DESTINATIONS } from '../types';

const { Option } = Select;

interface PaletaCardProps {
  paleta: Paleta;
  stats: PaletaStats;
  isActive: boolean;
  formatki: Formatka[];
  saPozostaleFormatki: boolean;
  totalPozostalo: number;
  onSelect: () => void;
  onChangeDestination: (przeznaczenie: string) => void;
  onCopy: () => void;
  onDelete: () => void;
  onRemoveFormatka: (formatkaId: number) => void;
  onAddAllRemaining: () => void;
}

export const PaletaCard: React.FC<PaletaCardProps> = ({
  paleta,
  stats,
  isActive,
  formatki,
  saPozostaleFormatki,
  totalPozostalo,
  onSelect,
  onChangeDestination,
  onCopy,
  onDelete,
  onRemoveFormatka,
  onAddAllRemaining
}) => {
  const destination = PALLET_DESTINATIONS[paleta.przeznaczenie];
  
  return (
    <Card
      size="small"
      style={{ 
        border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
        backgroundColor: isActive ? '#f0f8ff' : 'white',
        cursor: 'pointer'
      }}
      onClick={onSelect}
    >
      <Row gutter={16} align="middle">
        <Col span={4}>
          <Space direction="vertical" size={0}>
            <Text strong>{paleta.numer}</Text>
            <Tag color={destination.color}>
              {destination.icon} {destination.label}
            </Tag>
          </Space>
        </Col>
        
        <Col span={8}>
          <Space direction="vertical" size={0}>
            <Text>Formatek: <strong>{stats.sztuk} szt.</strong></Text>
            <Text>Waga: <strong>{stats.waga.toFixed(1)} kg</strong></Text>
            <Text>Wysokość: <strong>{stats.wysokosc} mm</strong></Text>
          </Space>
        </Col>
        
        <Col span={6}>
          <Space direction="vertical" size={4}>
            <Progress 
              percent={Math.round(stats.wykorzystanieWagi)} 
              size="small"
              strokeColor={stats.wykorzystanieWagi > 90 ? '#ff4d4f' : '#52c41a'}
              format={() => `${stats.waga.toFixed(0)}/${paleta.max_waga}kg`}
            />
            <Progress 
              percent={Math.round(stats.wykorzystanieWysokosci)} 
              size="small"
              strokeColor={stats.wykorzystanieWysokosci > 90 ? '#ff4d4f' : '#1890ff'}
              format={() => `${stats.wysokosc}/${paleta.max_wysokosc}mm`}
            />
          </Space>
        </Col>
        
        <Col span={6}>
          <Space>
            <Select
              size="small"
              value={paleta.przeznaczenie}
              onChange={onChangeDestination}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 120 }}
            >
              {Object.entries(PALLET_DESTINATIONS).map(([key, dest]) => (
                <Option key={key} value={key}>
                  <Space>
                    {dest.icon}
                    {dest.label}
                  </Space>
                </Option>
              ))}
            </Select>
            <Tooltip title="Kopiuj paletę">
              <Button 
                size="small" 
                icon={<CopyOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              />
            </Tooltip>
            <Tooltip title="Usuń paletę">
              <Button 
                size="small" 
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              />
            </Tooltip>
          </Space>
        </Col>
      </Row>
      
      {isActive && saPozostaleFormatki && (
        <Row style={{ marginTop: 8 }}>
          <Col span={24}>
            <Popconfirm
              title="Dodać wszystkie pozostałe formatki do tej palety?"
              description={`Zostanie dodanych ${totalPozostalo} formatek`}
              onConfirm={onAddAllRemaining}
              okText="Dodaj wszystkie"
              cancelText="Anuluj"
            >
              <Button 
                type="dashed" 
                icon={<ThunderboltOutlined />}
                style={{ 
                  width: '100%',
                  borderColor: '#52c41a',
                  color: '#52c41a'
                }}
              >
                📦 Dodaj wszystkie pozostałe formatki ({totalPozostalo} szt.)
              </Button>
            </Popconfirm>
          </Col>
        </Row>
      )}
      
      {isActive && paleta.formatki.length > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Table
            dataSource={paleta.formatki}
            size="small"
            pagination={false}
            rowKey="formatka_id"
            columns={[
              {
                title: 'Formatka',
                render: (_, record) => {
                  const formatka = formatki.find(f => f.id === record.formatka_id);
                  return formatka ? (
                    <Space size={4}>
                      <Text>{formatka.nazwa}</Text>
                      <Tag size="small">{formatka.kolor}</Tag>
                    </Space>
                  ) : null;
                }
              },
              {
                title: 'Ilość',
                dataIndex: 'ilosc',
                width: 80,
                render: (text) => <Text strong>{text} szt.</Text>
              },
              {
                title: 'Waga',
                width: 80,
                render: (_, record) => {
                  const formatka = formatki.find(f => f.id === record.formatka_id);
                  return formatka ? (
                    <Text>{(record.ilosc * formatka.waga_sztuka).toFixed(1)} kg</Text>
                  ) : null;
                }
              },
              {
                title: '',
                width: 40,
                render: (_, record) => (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveFormatka(record.formatka_id)}
                  />
                )
              }
            ]}
          />
        </>
      )}
      
      {isActive && stats.wykorzystanieWagi > 90 && (
        <Alert
          message="Uwaga na wagę!"
          description={`Paleta przekracza 90% maksymalnej wagi (${paleta.max_waga}kg)`}
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}
    </Card>
  );
};
