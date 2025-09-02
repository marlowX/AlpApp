import React from 'react';
import { Form, Input, InputNumber, Card, Row, Col, Typography, Space, Tag, Divider, Badge, Tooltip } from 'antd';
import { 
  ScissorOutlined,
  BgColorsOutlined,
  AppstoreOutlined,
  FormatPainterOutlined,
  NumberOutlined,
  FileTextOutlined,
  ThunderboltOutlined
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
  const totalFormatki = selectedRozkroj ? 
    kolorePlyty.reduce((total, kolor) => {
      if (!kolor.kolor) return total;
      return total + selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
    }, 0) : 0;

  return (
    <div>
      {/* PODSUMOWANIE POZYCJI */}
      <Card 
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1890ff' }} />
            <Text strong>Podsumowanie pozycji</Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: '16px' } }}
      >
        <Row gutter={[24, 16]}>
          {/* Rozkrój */}
          <Col xs={24} md={8}>
            <div style={{ 
              padding: '12px',
              background: '#f0f5ff',
              borderRadius: '8px',
              border: '1px solid #d6e4ff'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <ScissorOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  <Text strong>Rozkrój</Text>
                </Space>
                <Title level={5} style={{ margin: '4px 0', color: '#1890ff' }}>
                  {selectedRozkroj?.kod_rozkroju}
                </Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {selectedRozkroj?.rozmiar_plyty}
                </Text>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ fontSize: '11px' }}>
                  <Text type="secondary">Formatki ({selectedRozkroj?.formatki.length}):</Text>
                  {selectedRozkroj?.formatki.slice(0, 2).map((f, idx) => (
                    <div key={idx} style={{ marginLeft: 8 }}>
                      • {f.dlugosc}×{f.szerokosc} - {f.ilosc_sztuk} szt.
                    </div>
                  ))}
                  {selectedRozkroj && selectedRozkroj.formatki.length > 2 && (
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: '10px' }}>
                      ...+{selectedRozkroj.formatki.length - 2} więcej
                    </Text>
                  )}
                </div>
              </Space>
            </div>
          </Col>

          {/* Płyty */}
          <Col xs={24} md={8}>
            <div style={{ 
              padding: '12px',
              background: '#f6ffed',
              borderRadius: '8px',
              border: '1px solid #d9f7be'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <BgColorsOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                  <Text strong>Płyty</Text>
                  <Badge count={totalPlyty} style={{ backgroundColor: '#52c41a' }} />
                </Space>
                
                {kolorePlyty.filter(k => k.kolor).map((plyta, idx) => (
                  <div key={idx} style={{ 
                    padding: '6px 8px',
                    background: 'white',
                    borderRadius: '4px',
                    marginBottom: 4
                  }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong style={{ fontSize: '12px' }}>
                        {plyta.nazwa || plyta.kolor}
                      </Text>
                      <Tag color="green">{plyta.ilosc} szt.</Tag>
                    </Space>
                    {plyta.dlugosc && plyta.szerokosc && (
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        {plyta.dlugosc}×{plyta.szerokosc} mm
                      </Text>
                    )}
                  </div>
                ))}
              </Space>
            </div>
          </Col>

          {/* Produkcja */}
          <Col xs={24} md={8}>
            <div style={{ 
              padding: '12px',
              background: '#fff7e6',
              borderRadius: '8px',
              border: '1px solid '#ffd591'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <FormatPainterOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                  <Text strong>Produkcja</Text>
                </Space>
                
                <div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Formatek do produkcji:
                  </Text>
                  <Title level={4} style={{ margin: '4px 0', color: '#fa8c16' }}>
                    {totalFormatki} szt.
                  </Title>
                </div>

                <div style={{ fontSize: '11px' }}>
                  <Text type="secondary">Szacowana waga:</Text>
                  <div>~{(totalFormatki * 0.5).toFixed(1)} kg</div>
                </div>

                <div style={{ fontSize: '11px' }}>
                  <Text type="secondary">Szacowany czas:</Text>
                  <div>~{Math.ceil(totalFormatki / 60)} min</div>
                </div>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ŚCIEŻKA PRODUKCJI */}
      <Card 
        title="Ścieżka produkcji"
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Form.Item
          name="sciezka_produkcji"
          initialValue="CIECIE->OKLEJANIE->MAGAZYN"
          rules={[{ required: true, message: 'Wybierz ścieżkę produkcji' }]}
        >
          <SciezkaProdukcji
            formatki={[]}
            onSciezkaChange={(sciezka) => {
              form.setFieldsValue({ sciezka_produkcji: sciezka });
            }}
          />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: '11px' }}>
          Ścieżka określa kolejność operacji technologicznych. Można ją zmienić później dla pojedynczych formatek na paletach.
        </Text>
      </Card>

      {/* OPCJE DODATKOWE */}
      <Card 
        title="Opcje dodatkowe"
        size="small"
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <NumberOutlined />
                  <span>Kolejność produkcji</span>
                </Space>
              }
              name="kolejnosc"
              tooltip="Niższa wartość = wyższy priorytet"
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
              label={
                <Space>
                  <FileTextOutlined />
                  <span>Uwagi</span>
                </Space>
              }
              name="uwagi"
            >
              <TextArea 
                rows={2} 
                placeholder="Opcjonalne uwagi do pozycji..."
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* WIZUALIZACJA PALET (placeholder) */}
      <Card 
        title={
          <Space>
            <AppstoreOutlined />
            <Text>Palety zostaną utworzone automatycznie</Text>
          </Space>
        }
        style={{ 
          marginTop: 16,
          background: '#fafafa',
          borderStyle: 'dashed'
        }}
        size="small"
      >
        <Row gutter={[8, 8]}>
          {[1, 2, 3].map(i => (
            <Col key={i} xs={8} md={4}>
              <div style={{
                padding: '8px',
                background: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '11px'
              }}>
                <AppstoreOutlined style={{ fontSize: 20, color: '#999' }} />
                <div>Paleta {i}</div>
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  ~{Math.ceil(totalFormatki / 3)} szt.
                </Text>
              </div>
            </Col>
          ))}
        </Row>
        <Text type="secondary" style={{ fontSize: '11px', marginTop: 8, display: 'block' }}>
          System automatycznie rozdzieli formatki na palety po dodaniu pozycji. 
          Później możesz zarządzać paletami przez drag & drop.
        </Text>
      </Card>
    </div>
  );
};
