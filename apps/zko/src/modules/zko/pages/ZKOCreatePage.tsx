import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  message,
  Select,
  DatePicker,
  Divider
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreateZKO } from '../hooks';
import type { CreateZKODto } from '../types';

const { TextArea } = Input;
const { Option } = Select;

export const ZKOCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customKooperant, setCustomKooperant] = useState('');
  const createMutation = useCreateZKO();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const dto: CreateZKODto = {
        kooperant: values.kooperant === 'CUSTOM' ? customKooperant : values.kooperant,
        priorytet: values.priorytet || 5,
        komentarz: values.komentarz,
      };

      const result = await createMutation.mutateAsync(dto);

      if (result.sukces) {
        message.success(`ZKO ${result.numer_zko} zostało utworzone`);
        navigate(`/zko/${result.zko_id}`);
      } else {
        message.error(result.komunikat || 'Błąd podczas tworzenia ZKO');
      }
    } catch (error: any) {
      console.error('Error creating ZKO:', error);
      message.error('Błąd podczas tworzenia ZKO');
    } finally {
      setLoading(false);
    }
  };

  const defaultKooperanci = [
    'Bomar',
    'Alpma Niziny',
    'Alpma Szropy'
  ];

  const allKooperanci = [
    ...defaultKooperanci,
    'Bomar',
    'Alpma Niziny',
    'Alpma Szropy'
  ];

  const handleKooperantChange = (value: string) => {
    if (value !== 'CUSTOM') {
      setCustomKooperant('');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/zko')}
          style={{ marginRight: '16px' }}
        >
          Powrót
        </Button>
        <h1 style={{ margin: 0 }}>Nowe zlecenie ZKO</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            priorytet: 5,
            kooperant: 'Bomar' // Domyślny kooperant
          }}
        >
          <Form.Item
            label="Kooperant"
            name="kooperant"
            rules={[
              { required: true, message: 'Kooperant jest wymagany' },
            ]}
          >
            <Select
              placeholder="Wybierz kooperanta"
              showSearch
              allowClear
              optionFilterProp="children"
              onChange={handleKooperantChange}
              dropdownRender={(menu) => (
                <>
                  <div style={{ padding: '4px 8px', fontWeight: 'bold', color: '#666' }}>
                    Główni kooperanci:
                  </div>
                  {defaultKooperanci.map(kooperant => (
                    <Option key={kooperant} value={kooperant}>
                      <strong>{kooperant}</strong>
                    </Option>
                  ))}
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ padding: '4px 8px', fontWeight: 'bold', color: '#666' }}>
                    Pozostali:
                  </div>
                  {allKooperanci.filter(k => !defaultKooperanci.includes(k)).map(kooperant => (
                    <Option key={kooperant} value={kooperant}>
                      {kooperant}
                    </Option>
                  ))}
                  <Divider style={{ margin: '8px 0' }} />
                  <Option key="CUSTOM" value="CUSTOM">
                    <PlusOutlined /> Dodaj nowego kooperanta
                  </Option>
                </>
              )}
            >
              {allKooperanci.map(kooperant => (
                <Option key={kooperant} value={kooperant}>
                  {defaultKooperanci.includes(kooperant) ? (
                    <strong>{kooperant}</strong>
                  ) : (
                    kooperant
                  )}
                </Option>
              ))}
              <Option key="CUSTOM" value="CUSTOM">
                <PlusOutlined /> Dodaj nowego kooperanta
              </Option>
            </Select>
          </Form.Item>

          {form.getFieldValue('kooperant') === 'CUSTOM' && (
            <Form.Item
              label="Nazwa nowego kooperanta"
              required
              rules={[
                { required: true, message: 'Nazwa kooperanta jest wymagana' },
                { min: 2, message: 'Nazwa musi mieć przynajmniej 2 znaki' },
              ]}
            >
              <Input
                placeholder="Wpisz nazwę nowego kooperanta"
                value={customKooperant}
                onChange={(e) => setCustomKooperant(e.target.value)}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Priorytet"
            name="priorytet"
            help="1 = najniższy, 10 = najwyższy (domyślnie 5 - normalny)"
            rules={[
              { required: true, message: 'Priorytet jest wymagany' },
              { type: 'number', min: 1, max: 10, message: 'Priorytet musi być między 1 a 10' },
            ]}
          >
            <Select placeholder="Wybierz priorytet" style={{ width: '100%' }}>
              <Option value={1}>1 - Bardzo niski</Option>
              <Option value={2}>2 - Niski</Option>
              <Option value={3}>3 - Niski+</Option>
              <Option value={4}>4 - Normalny-</Option>
              <Option value={5}>5 - Normalny (domyślny)</Option>
              <Option value={6}>6 - Normalny+</Option>
              <Option value={7}>7 - Podwyższony</Option>
              <Option value={8}>8 - Wysoki</Option>
              <Option value={9}>9 - Bardzo wysoki</Option>
              <Option value={10}>10 - Krytyczny</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Data planowana (opcjonalnie)"
            name="data_planowana"
            help="Planowana data realizacji zlecenia"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Wybierz datę planowaną"
              format="DD.MM.YYYY"
            />
          </Form.Item>

          <Form.Item
            label="Komentarz"
            name="komentarz"
            help="Dodatkowe informacje o zleceniu"
          >
            <TextArea
              rows={4}
              placeholder="Wpisz komentarz lub dodatkowe informacje..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || createMutation.isPending}
                icon={<SaveOutlined />}
                size="large"
              >
                Utwórz ZKO
              </Button>
              <Button onClick={() => form.resetFields()}>
                Wyczyść
              </Button>
              <Button onClick={() => navigate('/zko')}>
                Anuluj
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Pomoc */}
      <Card style={{ marginTop: '24px' }} title="Informacje o kooperantach">
        <div style={{ color: '#666' }}>
          <p><strong>Główni kooperanci:</strong></p>
          <ul>
            <li><strong>Bomar</strong> - Główny partner produkcyjny</li>
            <li><strong>Alpma Niziny</strong> - Oddział w Nizinach</li>
            <li><strong>Alpma Szropy</strong> - Oddział w Szropach</li>
          </ul>

          <p><strong>Kolejne kroki po utworzeniu ZKO:</strong></p>
          <ul>
            <li>Dodanie pozycji (rozkrojów i formatek)</li>
            <li>Planowanie palet</li>
            <li>Rozpoczęcie cięcia</li>
            <li>Workflow przez produkcję</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ZKOCreatePage;