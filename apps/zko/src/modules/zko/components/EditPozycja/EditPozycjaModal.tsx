import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, message, Spin, Alert } from 'antd';
import { EditOutlined, DatabaseOutlined } from '@ant-design/icons';
import zkoApi from '../../services/zkoApi';

const { TextArea } = Input;
const { Option } = Select;

interface EditPozycjaModalProps {
  visible: boolean;
  pozycja: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export const EditPozycjaModal: React.FC<EditPozycjaModalProps> = ({
  visible,
  pozycja,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rozkroje, setRozkroje] = useState<any[]>([]);
  const [kolory, setKolory] = useState<any[]>([]);

  // Załaduj dostępne rozkroje i kolory
  useEffect(() => {
    if (visible) {
      loadOptions();
      // Ustaw początkowe wartości formularza
      if (pozycja) {
        form.setFieldsValue({
          rozkroj_id: pozycja.rozkroj_id,
          ilosc_plyt: pozycja.ilosc_plyt,
          kolor_plyty: pozycja.kolor_plyty,
          nazwa_plyty: pozycja.nazwa_plyty,
          kolejnosc: pozycja.kolejnosc,
          uwagi: pozycja.uwagi
        });
      }
    }
  }, [visible, pozycja]);

  const loadOptions = async () => {
    try {
      // Załaduj dostępne rozkroje
      const rozkrojeResponse = await fetch('/api/rozkroje/list');
      if (rozkrojeResponse.ok) {
        const data = await rozkrojeResponse.json();
        setRozkroje(data.rozkroje || []);
      }

      // Załaduj dostępne kolory
      const koloryResponse = await fetch('/api/plyty/colors');
      if (koloryResponse.ok) {
        const data = await koloryResponse.json();
        setKolory(data.colors || []);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Przygotuj dane do wysłania
      const updateData = {
        rozkroj_id: values.rozkroj_id !== pozycja.rozkroj_id ? values.rozkroj_id : undefined,
        ilosc_plyt: values.ilosc_plyt !== pozycja.ilosc_plyt ? values.ilosc_plyt : undefined,
        kolor_plyty: values.kolor_plyty !== pozycja.kolor_plyty ? values.kolor_plyty : undefined,
        nazwa_plyty: values.nazwa_plyty !== pozycja.nazwa_plyty ? values.nazwa_plyty : undefined,
        kolejnosc: values.kolejnosc !== pozycja.kolejnosc ? values.kolejnosc : undefined,
        uwagi: values.uwagi !== pozycja.uwagi ? values.uwagi : undefined
      };

      // Usuń niezmodyfikowane pola
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      // Sprawdź czy coś się zmieniło
      if (Object.keys(updateData).length === 0) {
        message.info('Nie wprowadzono żadnych zmian');
        onCancel();
        return;
      }

      // Wywołaj funkcję PostgreSQL przez API
      const result = await zkoApi.editPozycja(pozycja.id, updateData);

      if (result.sukces) {
        message.success('Pozycja została zaktualizowana');
        form.resetFields();
        onSuccess();
      } else {
        message.error(result.komunikat || 'Błąd podczas aktualizacji pozycji');
      }
    } catch (error: any) {
      console.error('Error updating pozycja:', error);
      message.error(error.message || 'Błąd podczas aktualizacji pozycji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <EditOutlined /> Edycja pozycji #{pozycja?.id}
        </span>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Zapisz zmiany"
      cancelText="Anuluj"
      width={600}
    >
      <Alert
        message="Edycja pozycji ZKO"
        description={
          <span>
            <DatabaseOutlined /> Funkcja PostgreSQL: <code>zko.edytuj_pozycje_zko</code>
          </span>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="rozkroj_id"
          label="Rozkrój"
          rules={[{ required: true, message: 'Wybierz rozkrój' }]}
        >
          <Select
            placeholder="Wybierz rozkrój"
            showSearch
            optionFilterProp="children"
            loading={rozkroje.length === 0}
          >
            {rozkroje.map(r => (
              <Option key={r.id} value={r.id}>
                {r.kod} - {r.nazwa || 'Bez nazwy'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="ilosc_plyt"
          label="Ilość płyt"
          rules={[
            { required: true, message: 'Podaj ilość płyt' },
            { type: 'number', min: 1, max: 5, message: 'Ilość musi być między 1 a 5' }
          ]}
        >
          <InputNumber
            min={1}
            max={5}
            style={{ width: '100%' }}
            placeholder="Maksymalnie 5 płyt"
          />
        </Form.Item>

        <Form.Item
          name="kolor_plyty"
          label="Kolor płyty"
          rules={[{ required: true, message: 'Wybierz kolor płyty' }]}
        >
          <Select
            placeholder="Wybierz kolor"
            showSearch
            optionFilterProp="children"
          >
            {kolory.map(k => (
              <Option key={k} value={k}>
                {k}
              </Option>
            ))}
            {/* Dodaj opcję własnego koloru jeśli nie ma na liście */}
            <Option value="INNY">Inny kolor...</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="nazwa_plyty"
          label="Nazwa płyty"
          rules={[{ required: true, message: 'Podaj nazwę płyty' }]}
        >
          <Input placeholder="np. 18_SONOMA" />
        </Form.Item>

        <Form.Item
          name="kolejnosc"
          label="Kolejność"
          tooltip="Kolejność realizacji pozycji"
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="Opcjonalnie"
          />
        </Form.Item>

        <Form.Item
          name="uwagi"
          label="Uwagi"
        >
          <TextArea
            rows={3}
            placeholder="Opcjonalne uwagi do pozycji"
          />
        </Form.Item>
      </Form>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Aktualizowanie pozycji..." />
        </div>
      )}
    </Modal>
  );
};