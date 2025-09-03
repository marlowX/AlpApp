import React from 'react';
import { Form, Input, InputNumber, Card, Row, Col, Typography, Space, Tag, Divider, Badge } from 'antd';
import { 
  ScissorOutlined,
  BgColorsOutlined,
  AppstoreOutlined,
  FormatPainterOutlined,
  NumberOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { SciezkaProdukcji } from '../SciezkaProdukcji';
import type { KolorPlyty, Rozkroj } from '../types';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Step3OpcjeProps {
  form: any;
  kolorePlyty: KolorPlyty[];
  selectedRozkroj: Rozkroj | null;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Step3Opcje: React.FC<Step3OpcjeProps> = ({ 
  form, 
  kolorePlyty, 
  selectedRozkroj,
  onNext,
  onPrev 
}) => {
  // Obliczenia
  const totalPlyty = kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  
  // Oblicz całkowitą liczbę formatek
  const totalFormatki = selectedRozkroj ? 
    kolorePlyty.reduce((total, kolor) => {
      if (!kolor.kolor) return total;
      return total + selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
    }, 0) : 0;

  // Oblicz szacowaną wagę formatek
  const obliczWageFormatek = () => {
    if (!selectedRozkroj) return 0;
    
    let totalWaga = 0;
    kolorePlyty.forEach(kolor => {
      if (!kolor.kolor) return;
      
      const grubosc = kolor.grubosc || 18;
      const gestosc = 700;
      
      selectedRozkroj.formatki.forEach(formatka => {
        const objetosc = (formatka.dlugosc / 1000) * (formatka.szerokosc / 1000) * (grubosc / 1000);
        const wagaFormatki = objetosc * gestosc;
        totalWaga += wagaFormatki * formatka.ilosc_sztuk * kolor.ilosc;
      });
    });
    
    return totalWaga;
  };

  const szacowanaWaga = obliczWageFormatek();

  return (
    <div>
      {/* PODSUMOWANIE POZYCJI */}
      <Card 
        size="small"
        style={{ marginBottom: 16 }}
        styles={{ 
          header: { 
            background: '#fafafa', 
            padding: '8px 16px',
            borderBottom: '2px solid #1890ff'
          },
          body: { padding: '16px' } 
        }}
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1890ff' }} />
            <Text strong>Podsumowanie pozycji</Text>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {/* Rozkrój */}
          <Col xs={24} md={8}>
            <Card 
              size="small" 
              bordered={false}
              style={{ background: '#f0f5ff' }}
              styles={{ body: { padding: '12px' } }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <ScissorOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                  <Text strong>Rozkrój</Text>
                </Space>
                
                <div>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {selectedRozkroj?.kod_rozkroju}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {selectedRozkroj?.rozmiar_plyty}
                    </Text>
                  </div>
                </div>

                <Divider style={{ margin: '8px 0' }} />
                
                <div style={{ fontSize: '11px' }}>
                  <Text type="secondary">Formatki ({selectedRozkroj?.formatki.length}):</Text>
                  {selectedRozkroj?.formatki.map((f, idx) => (
                    <div key={idx} style={{ marginLeft: 8, color: '#595959' }}>
                      • {f.dlugosc}×{f.szerokosc} mm - {f.ilosc_sztuk} szt.
                    </div>
                  ))}
                </div>
              </Space>
            </Card>
          </Col>

          {/* Płyty */}
          <Col xs={24} md={8}>
            <Card 
              size="small" 
              bordered={false}
              style={{ background: '#f6ffed' }}
              styles={{ body: { padding: '12px' } }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <BgColorsOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                  <Text strong>Płyty</Text>
                  <Badge count={totalPlyty} style={{ backgroundColor: '#52c41a' }} />
                </Space>
                
                {kolorePlyty.filter(k => k.kolor).map((plyta, idx) => (
                  <div key={idx} style={{ 
                    padding: '6px 8px',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #d9f7be'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong style={{ fontSize: '12px' }}>
                          {plyta.nazwa || plyta.kolor}
                        </Text>
                        {plyta.dlugosc && plyta.szerokosc && (
                          <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                            {plyta.dlugosc}×{plyta.szerokosc} mm
                          </Text>
                        )}
                      </div>
                      <Tag color="green" style={{ margin: 0 }}>{plyta.ilosc} szt.</Tag>
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          {/* Produkcja */}
          <Col xs={24} md={8}>
            <Card 
              size="small" 
              bordered={false}
              style={{ background: '#fff7e6' }}
              styles={{ body: { padding: '12px' } }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <FormatPainterOutlined style={{ fontSize: 16, color: '#fa8c16' }} />
                  <Text strong>Produkcja</Text>
                </Space>
                
                <div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Formatek do produkcji:
                  </Text>
                  <Text strong style={{ fontSize: '24px', color: '#fa8c16', display: 'block' }}>
                    {totalFormatki} szt.
                  </Text>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <Space direction="vertical" size={2} style={{ fontSize: '11px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Szacowana waga:</Text>
                    <Text>~{szacowanaWaga.toFixed(1)} kg</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Szacowany czas:</Text>
                    <Text>~{Math.ceil(totalFormatki / 60)} min</Text>
                  </div>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ŚCIEŻKA PRODUKCJI - UPROSZCZONE */}
      <Card 
        title={
          <Space>
            <ArrowRightOutlined />
            <Text strong>Ścieżka produkcji</Text>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
        styles={{ 
          header: { background: '#fafafa', padding: '8px 16px' },
          body: { padding: '12px' } 
        }}
      >
        <Form.Item
          name="sciezka_produkcji"
          initialValue="CIECIE->OKLEJANIE->MAGAZYN"
          rules={[{ required: true, message: 'Wybierz ścieżkę produkcji' }]}
          style={{ marginBottom: 8 }}
        >
          <SciezkaProdukcji
            onSciezkaChange={(sciezka) => {
              form.setFieldsValue({ sciezka_produkcji: sciezka });
            }}
          />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: '11px' }}>
          Można zmienić później dla pojedynczych formatek na palecie
        </Text>
      </Card>

      {/* OPCJE DODATKOWE */}
      <Card 
        title={
          <Space>
            <NumberOutlined />
            <Text strong>Opcje dodatkowe</Text>
          </Space>
        }
        size="small"
        styles={{ 
          header: { background: '#fafafa', padding: '8px 16px' },
          body: { padding: '12px' } 
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Kolejność produkcji"
              name="kolejnosc"
              tooltip="Niższa wartość = wyższy priorytet"
              style={{ marginBottom: 8 }}
            >
              <InputNumber 
                min={1} 
                max={999} 
                placeholder="Automatyczna"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="Uwagi"
              name="uwagi"
              style={{ marginBottom: 8 }}
            >
              <TextArea 
                rows={2} 
                placeholder="Opcjonalne uwagi..."
                maxLength={200}
                showCount
                style={{ fontSize: '12px' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  );
};