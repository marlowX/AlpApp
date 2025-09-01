/**
 * @fileoverview Modal tworzenia nowej palety
 * @module PaletyZko/components/CreatePaletaModal
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Space,
  Typography,
  Alert,
  Progress,
  Tag,
  Divider,
  List,
  Button,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  InboxOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  Formatka,
  PaletaFormData,
  PRZEZNACZENIE_PALETY,
  LIMITY_PALETY
} from '../types';
import {
  obliczWageSztuki,
  obliczWageFormatek,
  obliczWysokoscStosu,
  sprawdzLimity,
  formatujWage,
  formatujWysokosc,
  formatujWymiary,
  formatujKolor,
  formatujPrzeznaczenie,
  getIkonaPrzeznaczenia
} from '../utils';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CreatePaletaModalProps {
  visible: boolean;
  formatki: Formatka[];
  onCancel: () => void;
  onCreate: (data: PaletaFormData) => void;
  loading?: boolean;
}

interface SelectedFormatka {
  formatka: Formatka;
  ilosc: number;
}

export const CreatePaletaModal: React.FC<CreatePaletaModalProps> = ({
  visible,
  formatki,
  onCancel,
  onCreate,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [selectedFormatki, setSelectedFormatki] = useState<SelectedFormatka[]>([]);
  const [currentStats, setCurrentStats] = useState({
    waga: 0,
    wysokosc: 0,
    sztuki: 0,
    poziomy: 0
  });

  // Oblicz statystyki przy każdej zmianie
  useEffect(() => {
    const formatkiZIloscia = selectedFormatki.map(sf => ({
      ...sf.formatka,
      ilosc_na_palecie: sf.ilosc
    }));

    const waga = obliczWageFormatek(formatkiZIloscia);
    const wysokosc = obliczWysokoscStosu(formatkiZIloscia);
    const sztuki = selectedFormatki.reduce((sum, sf) => sum + sf.ilosc, 0);
    const poziomy = Math.ceil(sztuki / LIMITY_PALETY.FORMATEK_NA_POZIOM);

    setCurrentStats({ waga, wysokosc, sztuki, poziomy });
  }, [selectedFormatki]);

  const handleAddFormatka = (formatkaId: number, ilosc: number) => {
    const formatka = formatki.find(f => f.id === formatkaId);
    if (!formatka) return;

    const existing = selectedFormatki.find(sf => sf.formatka.id === formatkaId);
    
    if (existing) {
      // Zwiększ ilość istniejącej
      setSelectedFormatki(prev =>
        prev.map(sf =>
          sf.formatka.id === formatkaId
            ? { ...sf, ilosc: Math.min(sf.ilosc + ilosc, formatka.ilosc_dostepna) }
            : sf
        )
      );
    } else {
      // Dodaj nową
      setSelectedFormatki(prev => [
        ...prev,
        { formatka, ilosc: Math.min(ilosc, formatka.ilosc_dostepna) }
      ]);
    }
  };

  const handleRemoveFormatka = (formatkaId: number) => {
    setSelectedFormatki(prev => prev.filter(sf => sf.formatka.id !== formatkaId));
  };

  const handleUpdateIlosc = (formatkaId: number, ilosc: number) => {
    setSelectedFormatki(prev =>
      prev.map(sf =>
        sf.formatka.id === formatkaId
          ? { ...sf, ilosc: Math.max(0, Math.min(ilosc, sf.formatka.ilosc_dostepna)) }
          : sf
      )
    );
  };

  // NOWA FUNKCJA - Dodaj wszystkie dostępne formatki
  const handleAddAllFormatki = () => {
    const noweFormatki: SelectedFormatka[] = formatki
      .filter(f => f.ilosc_dostepna > 0)
      .map(f => ({
        formatka: f,
        ilosc: f.ilosc_dostepna
      }));
    
    setSelectedFormatki(noweFormatki);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedFormatki.length === 0) {
        Modal.warning({
          title: 'Brak formatek',
          content: 'Dodaj przynajmniej jedną formatkę do palety'
        });
        return;
      }

      const data: PaletaFormData = {
        przeznaczenie: values.przeznaczenie,
        max_waga_kg: values.max_waga_kg || LIMITY_PALETY.MAX_WAGA_KG,
        max_wysokosc_mm: values.max_wysokosc_mm || LIMITY_PALETY.MAX_WYSOKOSC_MM,
        uwagi: values.uwagi,
        formatki: selectedFormatki.map(sf => ({
          formatka_id: sf.formatka.id,
          ilosc: sf.ilosc
        }))
      };

      onCreate(data);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setSelectedFormatki([]);
  };

  const limity = sprawdzLimity(
    currentStats.waga,
    currentStats.wysokosc
  );

  return (
    <Modal
      title={
        <Space>
          <InboxOutlined />
          <Text strong>Tworzenie nowej palety</Text>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText="Utwórz paletę"
      cancelText="Anuluj"
      afterClose={handleReset}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          przeznaczenie: 'MAGAZYN',
          max_waga_kg: LIMITY_PALETY.MAX_WAGA_KG,
          max_wysokosc_mm: LIMITY_PALETY.MAX_WYSOKOSC_MM
        }}
      >
        {/* Przeznaczenie */}
        <Form.Item
          name="przeznaczenie"
          label="Przeznaczenie palety"
          rules={[{ required: true, message: 'Wybierz przeznaczenie' }]}
        >
          <Select size="large">
            {Object.entries(PRZEZNACZENIE_PALETY).map(([key, value]) => (
              <Option key={key} value={value}>
                <Space>
                  {getIkonaPrzeznaczenia(value)}
                  {formatujPrzeznaczenie(value)}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Limity */}
        <Space style={{ width: '100%' }} size="large">
          <Form.Item
            name="max_waga_kg"
            label="Maksymalna waga (kg)"
            style={{ flex: 1 }}
          >
            <InputNumber
              min={100}
              max={1000}
              step={50}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="max_wysokosc_mm"
            label="Maksymalna wysokość (mm)"
            style={{ flex: 1 }}
          >
            <InputNumber
              min={500}
              max={2000}
              step={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>

        {/* Aktualne statystyki */}
        <div style={{ 
          background: '#f5f5f5', 
          padding: 16, 
          borderRadius: 8,
          marginBottom: 16 
        }}>
          <Title level={5}>Aktualne parametry palety</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text>Waga: {formatujWage(currentStats.waga)}</Text>
              <Progress
                percent={Math.round(limity.procentWagi)}
                strokeColor={limity.ostrzezenieWaga ? '#ff4d4f' : '#52c41a'}
                showInfo={false}
              />
            </div>
            <div>
              <Text>Wysokość: {formatujWysokosc(currentStats.wysokosc)}</Text>
              <Progress
                percent={Math.round(limity.procentWysokosci)}
                strokeColor={limity.ostrzezenieWysokosc ? '#ff4d4f' : '#52c41a'}
                showInfo={false}
              />
            </div>
            <Space>
              <Tag>Formatek: {currentStats.sztuki}</Tag>
              <Tag>Poziomów: {currentStats.poziomy}</Tag>
            </Space>
          </Space>
        </div>

        {/* Ostrzeżenia */}
        {(limity.przekroczonaWaga || limity.przekroczonaWysokosc) && (
          <Alert
            type="error"
            message="Przekroczone limity!"
            description={
              <Space direction="vertical">
                {limity.przekroczonaWaga && (
                  <Text>Waga przekracza limit o {(currentStats.waga - LIMITY_PALETY.MAX_WAGA_KG).toFixed(1)} kg</Text>
                )}
                {limity.przekroczonaWysokosc && (
                  <Text>Wysokość przekracza limit o {currentStats.wysokosc - LIMITY_PALETY.MAX_WYSOKOSC_MM} mm</Text>
                )}
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Wybór formatek */}
        <Divider>
          <Space>
            <Text>Dodaj formatki do palety</Text>
            {formatki.length > 0 && (
              <Tooltip title="Dodaj wszystkie dostępne formatki na paletę">
                <Button
                  type="primary"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={handleAddAllFormatki}
                  disabled={formatki.filter(f => f.ilosc_dostepna > 0).length === 0}
                >
                  Dodaj wszystkie ({formatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0)} szt.)
                </Button>
              </Tooltip>
            )}
          </Space>
        </Divider>
        
        {formatki.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <Select
              placeholder="Wybierz formatkę do dodania"
              style={{ width: '100%', marginBottom: 8 }}
              onChange={(formatkaId) => handleAddFormatka(formatkaId, 1)}
              value={undefined}
            >
              {formatki.map(f => (
                <Option key={f.id} value={f.id} disabled={f.ilosc_dostepna === 0}>
                  <Space>
                    <Text>{formatujWymiary(f.wymiar_x, f.wymiar_y)}</Text>
                    <Tag color="blue">{formatujKolor(f.kolor)}</Tag>
                    <Text type="secondary">Dostępne: {f.ilosc_dostepna} szt.</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </div>
        ) : (
          <Alert
            type="warning"
            message="Brak dostępnych formatek"
            description="Wszystkie formatki są już przypisane do palet"
          />
        )}

        {/* Lista wybranych formatek */}
        {selectedFormatki.length > 0 && (
          <>
            <Divider>Formatki na palecie ({selectedFormatki.length} typów)</Divider>
            <List
              size="small"
              dataSource={selectedFormatki}
              renderItem={sf => (
                <List.Item
                  actions={[
                    <Space>
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => handleUpdateIlosc(sf.formatka.id, sf.ilosc - 1)}
                        disabled={sf.ilosc <= 1}
                      />
                      <InputNumber
                        size="small"
                        min={1}
                        max={sf.formatka.ilosc_dostepna}
                        value={sf.ilosc}
                        onChange={(val) => handleUpdateIlosc(sf.formatka.id, val || 0)}
                        style={{ width: 60 }}
                      />
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleUpdateIlosc(sf.formatka.id, sf.ilosc + 1)}
                        disabled={sf.ilosc >= sf.formatka.ilosc_dostepna}
                      />
                      <Button
                        size="small"
                        danger
                        onClick={() => handleRemoveFormatka(sf.formatka.id)}
                      >
                        Usuń
                      </Button>
                    </Space>
                  ]}
                >
                  <Space>
                    <Text>{formatujWymiary(sf.formatka.wymiar_x, sf.formatka.wymiar_y)}</Text>
                    <Badge color={sf.formatka.kolor} text={formatujKolor(sf.formatka.kolor)} />
                    <Text type="secondary">
                      {sf.ilosc} szt. × {formatujWage(obliczWageSztuki(sf.formatka))}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}

        {/* Uwagi */}
        <Form.Item
          name="uwagi"
          label="Uwagi (opcjonalne)"
          style={{ marginTop: 16 }}
        >
          <TextArea rows={2} placeholder="Dodatkowe informacje o palecie..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
