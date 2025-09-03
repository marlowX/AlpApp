import React, { useState } from 'react';
import { 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber,
  message,
  Space,
  Spin
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useKooperanci } from '../hooks';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface ZKOEditButtonProps {
  zko: any;
  onEdited?: () => void;
}

export const ZKOEditButton: React.FC<ZKOEditButtonProps> = ({
  zko,
  onEdited
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const { data: kooperanci, isLoading: kooperanciLoading } = useKooperanci();

  const handleOpenModal = () => {
    // Ustaw początkowe wartości
    form.setFieldsValue({
      kooperant: zko.kooperant,
      priorytet: zko.priorytet,
      data_planowana: zko.data_planowana ? dayjs(zko.data_planowana) : null,
      data_otrzymania: zko.data_przyjecia_magazyn ? dayjs(zko.data_przyjecia_magazyn) : null,
      komentarz: ''
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/zko/${zko.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kooperant: values.kooperant,
          priorytet: values.priorytet,
          data_planowana: values.data_planowana?.format('YYYY-MM-DD'),
          data_otrzymania: values.data_otrzymania?.format('YYYY-MM-DD'),
          komentarz: values.komentarz,
          uzytkownik: 'system'
        })
      });

      const data = await response.json();

      if (data.sukces) {
        message.success(data.komunikat || 'ZKO zaktualizowane pomyślnie');
        setModalVisible(false);
        form.resetFields();
        onEdited?.();
      } else {
        message.error(data.komunikat || 'Błąd podczas aktualizacji ZKO');
      }
    } catch (error) {
      console.error('Error editing ZKO:', error);
      message.error('Błąd podczas aktualizacji ZKO');
    } finally {
      setLoading(false);
    }
  };

  // Przygotowanie opcji dla Select - kooperanci
  const kooperanciOptions = kooperanci?.map((k: any) => ({
    value: k.value,
    label: `${k.label} ${k.ocena ? `(⭐ ${Number(k.ocena).toFixed(1)})` : ''}`
  })) || [];

  // Przygotowanie opcji dla Select - priorytety
  const priorytetOptions = [
    { value: 1, label: '1 - Bardzo niski' },
    { value: 2, label: '2 - Niski' },
    { value: 3, label: '3 - Niski+' },
    { value: 4, label: '4 - Normalny-' },
    { value: 5, label: '5 - Normalny (domyślny)' },
    { value: 6, label: '6 - Normalny+' },
    { value: 7, label: '7 - Podwyższony' },
    { value: 8, label: '8 - Wysoki' },
    { value: 9, label: '9 - Bardzo wysoki' },
    { value: 10, label: '10 - Krytyczny' }
  ];

  return (
    <>
      <Button
        icon={<EditOutlined />}
        onClick={handleOpenModal}
      >
        Edytuj ZKO
      </Button>

      <Modal
        title={`Edycja ZKO: ${zko.numer_zko}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Kooperant */}
          <Form.Item
            label="Kooperant"
            name="kooperant"
            rules={[{ required: true, message: 'Kooperant jest wymagany' }]}
          >
            {kooperanciLoading ? (
              <Spin />
            ) : (
              <Select
                placeholder="Wybierz kooperanta"
                showSearch
                optionFilterProp="label"
                options={kooperanciOptions}
              />
            )}
          </Form.Item>

          {/* Priorytet */}
          <Form.Item
            label="Priorytet"
            name="priorytet"
            rules={[
              { required: true, message: 'Priorytet jest wymagany' },
              { type: 'number', min: 1, max: 10, message: 'Priorytet musi być między 1 a 10' }
            ]}
          >
            <Select 
              placeholder="Wybierz priorytet"
              options={priorytetOptions}
            />
          </Form.Item>

          {/* Data planowana */}
          <Form.Item
            label="Data planowana realizacji"
            name="data_planowana"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              placeholder="Wybierz datę planowaną"
            />
          </Form.Item>

          {/* Data otrzymania */}
          <Form.Item
            label="Data otrzymania w magazynie"
            name="data_otrzymania"
            help="Data przyjęcia gotowych produktów do magazynu"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              placeholder="Wybierz datę otrzymania"
            />
          </Form.Item>

          {/* Komentarz */}
          <Form.Item
            label="Komentarz do zmian"
            name="komentarz"
            help="Opisz powód wprowadzanych zmian"
          >
            <TextArea
              rows={3}
              placeholder="Dlaczego wprowadzasz zmiany..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Przyciski */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Zapisz zmiany
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Anuluj
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ZKOEditButton;
