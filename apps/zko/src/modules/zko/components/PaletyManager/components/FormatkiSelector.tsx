/**
 * @fileoverview Komponent wyświetlający formatki jako kafelki do wyboru
 * @module FormatkiSelector
 * 
 * Wyświetla formatki z wybranej pozycji jako kafelki
 * Po zaznaczeniu pokazuje szczegóły na dole
 */

import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Space, 
  Badge, 
  Checkbox, 
  Empty,
  Button,
  Table,
  Divider,
  Alert
} from 'antd';
import { 
  AppstoreOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface Formatka {
  id: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  grubosc: number;
  kolor: string;
  ilosc_planowana: number;
  waga_sztuka: number;
  ilosc_w_paletach?: number;
  ilosc_dostepna?: number;
  czy_w_pelni_przypisana?: boolean;
}

interface FormatkiSelectorProps {
  pozycjaId?: number;
  formatki: Formatka[];
  loading?: boolean;
}

export const FormatkiSelector: React.FC<FormatkiSelectorProps> = ({
  pozycjaId,
  formatki,
  loading = false
}) => {
  const [selectedFormatkiIds, setSelectedFormatkiIds] = useState<number[]>([]);

  const handleSelectFormatka = (formatkaId: number, checked: boolean) => {
    if (checked) {
      setSelectedFormatkiIds(prev => [...prev, formatkaId]);
    } else {
      setSelectedFormatkiIds(prev => prev.filter(id => id !== formatkaId));
    }
  };

  const handleSelectAll = () => {
    const availableIds = formatki
      .filter(f => (f.ilosc_dostepna || 0) > 0)
      .map(f => f.id);
    setSelectedFormatkiIds(availableIds);
  };

  const handleDeselectAll = () => {
    setSelectedFormatkiIds([]);
  };

  const selectedFormatki = formatki.filter(f => selectedFormatkiIds.includes(f.id));
  const totalSelectedSztuk = selectedFormatki.reduce((sum, f) => sum + (f.ilosc_dostepna || 0), 0);

  const getKolorBadge = (kolor: string) => {
    const colors: Record<string, string> = {
      'LANCELOT': '#8B4513',
      'ARTISAN': '#D2691E', 
      'SONOMA': '#F4A460',
      'SUROWA': '#A0522D',
      'BIAŁY': '#F0F0F0',
      'CZARNY': '#000000',
      'WOTAN': '#654321'
    };
    
    const baseKolor = kolor?.split(' ')[0]?.toUpperCase() || kolor?.toUpperCase();
    const bgColor = colors[baseKolor] || '#E0E0E0';
    const textColor = ['BIAŁY', 'SUROWA', 'SONOMA'].includes(baseKolor) ? '#000' : '#FFF';
    
    return (
      <Tag 
        style={{ 
          backgroundColor: bgColor, 
          color: textColor,
          border: `1px solid ${bgColor === '#F0F0F0' ? '#ccc' : bgColor}`,
          fontSize: '11px'
        }}
      >
        {kolor}
      </Tag>
    );
  };

  if (!pozycjaId) {
    return (
      <Alert
        message="Wybierz pozycję"
        description="Najpierw wybierz pozycję ZKO z listy powyżej"
        type="info"
        showIcon
      />
    );
  }

  if (formatki.length === 0) {
    return (
      <Empty
        description="Brak formatek w tej pozycji"
      />
    );
  }

  const availableFormatki = formatki.filter(f => (f.ilosc_dostepna || 0) > 0);

  if (availableFormatki.length === 0) {
    return (
      <Alert
        message="Brak dostępnych formatek"
        description="Wszystkie formatki z tej pozycji zostały już przypisane do palet"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      {/* Nagłówek z przyciskami */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row align="middle">
          <Col span={12}>
            <Space>
              <AppstoreOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <Title level={5} style={{ margin: 0 }}>
                Formatki z pozycji ID {pozycjaId}
              </Title>
              <Badge count={availableFormatki.length} style={{ backgroundColor: '#52c41a' }} />
            </Space>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                size="small" 
                onClick={handleSelectAll}
                disabled={selectedFormatkiIds.length === availableFormatki.length}
              >
                Zaznacz wszystkie
              </Button>
              <Button 
                size="small" 
                onClick={handleDeselectAll}
                disabled={selectedFormatkiIds.length === 0}
              >
                Odznacz wszystkie
              </Button>
              {selectedFormatkiIds.length > 0 && (
                <Tag color="blue">
                  Zaznaczono: {selectedFormatkiIds.length} typów ({totalSelectedSztuk} szt.)
                </Tag>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Kafelki formatek */}
      <Row gutter={[12, 12]}>
        {availableFormatki.map(formatka => {
          const isSelected = selectedFormatkiIds.includes(formatka.id);
          return (
            <Col key={formatka.id} xs={24} sm={12} md={8} lg={6} xl={4}>
              <Card
                hoverable
                style={{
                  borderColor: isSelected ? '#1890ff' : undefined,
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isSelected ? '#e6f4ff' : 'white',
                  transition: 'all 0.3s ease'
                }}
                bodyStyle={{ padding: 12 }}
              >
                <div style={{ position: 'relative' }}>
                  {/* Checkbox w rogu */}
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleSelectFormatka(formatka.id, e.target.checked)}
                    style={{ position: 'absolute', top: 0, right: 0 }}
                  />

                  {/* ID formatki */}
                  <div style={{ marginBottom: 8 }}>
                    <Badge 
                      count={`ID ${formatka.id}`}
                      style={{ 
                        backgroundColor: isSelected ? '#1890ff' : '#595959',
                        fontSize: '10px'
                      }}
                    />
                  </div>

                  {/* Nazwa formatki */}
                  <Text strong style={{ fontSize: 12 }}>
                    {formatka.nazwa}
                  </Text>

                  {/* Wymiary */}
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatka.dlugosc} × {formatka.szerokosc} mm
                    </Text>
                  </div>

                  {/* Kolor */}
                  <div style={{ marginTop: 4 }}>
                    {getKolorBadge(formatka.kolor)}
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  {/* Ilości */}
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>Dostępne:</Text>
                      <Text strong style={{ fontSize: 11, color: '#52c41a' }}>
                        {formatka.ilosc_dostepna} szt.
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>Planowane:</Text>
                      <Text style={{ fontSize: 10 }}>{formatka.ilosc_planowana} szt.</Text>
                    </div>
                    {(formatka.ilosc_w_paletach || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>Na paletach:</Text>
                        <Text style={{ fontSize: 10, color: '#faad14' }}>
                          {formatka.ilosc_w_paletach} szt.
                        </Text>
                      </div>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Szczegóły zaznaczonych formatek */}
      {selectedFormatkiIds.length > 0 && (
        <Card 
          style={{ marginTop: 16 }}
          title={
            <Space>
              <CheckSquareOutlined />
              <Text strong>Zaznaczone formatki ({selectedFormatkiIds.length})</Text>
              <ArrowDownOutlined />
            </Space>
          }
        >
          <Table
            dataSource={selectedFormatki}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                width: 60,
                render: (id) => <Tag>{id}</Tag>
              },
              {
                title: 'Nazwa',
                dataIndex: 'nazwa',
                key: 'nazwa',
              },
              {
                title: 'Wymiary',
                key: 'wymiary',
                render: (_, record) => `${record.dlugosc} × ${record.szerokosc} mm`
              },
              {
                title: 'Kolor',
                dataIndex: 'kolor',
                key: 'kolor',
                render: (kolor) => getKolorBadge(kolor)
              },
              {
                title: 'Dostępne',
                dataIndex: 'ilosc_dostepna',
                key: 'ilosc_dostepna',
                align: 'center',
                render: (val) => <Text strong style={{ color: '#52c41a' }}>{val} szt.</Text>
              },
              {
                title: 'Waga/szt',
                dataIndex: 'waga_sztuka',
                key: 'waga_sztuka',
                align: 'center',
                render: (val) => `${(val * 1000).toFixed(1)} g`
              }
            ]}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>RAZEM</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    <Text strong style={{ color: '#52c41a' }}>
                      {totalSelectedSztuk} szt.
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="center">
                    <Text strong>
                      {(selectedFormatki.reduce((sum, f) => 
                        sum + (f.waga_sztuka * (f.ilosc_dostepna || 0)), 0
                      )).toFixed(2)} kg
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )}
    </div>
  );
};