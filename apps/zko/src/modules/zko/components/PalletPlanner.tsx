import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  message,
  Tag,
  Alert,
  Descriptions,
  Progress
} from 'antd';
import { 
  SettingOutlined,
  CalculatorOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { usePlanPallets } from '../../zko/hooks';
import type { ColumnType } from 'antd/es/table';

const { TextArea } = Input;
const { Option } = Select;

interface PalletPlannerProps {
  zkoId: number;
  pozycje: any[];
  onUpdate: () => void;
}

interface PalletCalculation {
  pozycja_id: number;
  formatki_count: number;
  estimated_pallets: number;
  max_height: number;
  max_weight: number;
  thickness: number;
}

export const PalletPlanner: React.FC<PalletPlannerProps> = ({ 
  zkoId, 
  pozycje, 
  onUpdate 
}) => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [selectedPozycja, setSelectedPozycja] = useState<any>(null);
  const [calculations, setCalculations] = useState<PalletCalculation[]>([]);
  const [planForm] = Form.useForm();
  const [calcForm] = Form.useForm();

  const planPalletsMutation = usePlanPallets();

  // Domyślne parametry palet
  const defaultParams = {
    euro: { max_height: 180, max_weight: 700, name: 'EURO' },
    half: { max_height: 140, max_weight: 400, name: 'PÓŁPALETA' },
    custom: { max_height: 200, max_weight: 800, name: 'NIESTANDARDOWA' }
  };

  const handlePlanPallets = async (values: any) => {
    try {
      await planPalletsMutation.mutateAsync({
        pozycjaId: selectedPozycja.id,
        params: {
          max_wysokosc_cm: values.max_wysokosc_cm,
          max_waga_kg: values.max_waga_kg,
          grubosc_mm: values.grubosc_mm
        }
      });
      
      setShowPlanModal(false);
      planForm.resetFields();
      setSelectedPozycja(null);
      onUpdate();
      message.success('Palety zostały zaplanowane');
    } catch (error) {
      console.error('Error planning pallets:', error);
    }
  };

  const handleCalculate = async (values: any) => {
    try {
      // Symulacja obliczeń - w rzeczywistości wywołałbyś API
      const mockCalculations: PalletCalculation[] = pozycje.map((pozycja, index) => ({
        pozycja_id: pozycja.id,
        formatki_count: pozycja.formatki?.length || Math.floor(Math.random() * 50) + 10,
        estimated_pallets: Math.ceil((pozycja.formatki?.length || Math.floor(Math.random() * 50) + 10) / 20),
        max_height: values.max_wysokosc_cm,
        max_weight: values.max_waga_kg,
        thickness: values.grubosc_mm
      }));

      setCalculations(mockCalculations);
      message.success('Obliczenia zostały wykonane');
    } catch (error) {
      message.error('Błąd podczas obliczeń');
    }
  };

  const pozycjeColumns: ColumnType<any>[] = [
    {
      title: 'Pozycja',
      dataIndex: 'kolejnosc',
      key: 'kolejnosc',
      width: 80,
      render: (kolejnosc) => `#${kolejnosc || 'Auto'}`
    },
    {
      title: 'Kolor płyty',
      dataIndex: 'kolor_plyty',
      key: 'kolor_plyty',
      render: (kolor) => <Tag color="blue">{kolor}</Tag>
    },
    {
      title: 'Nazwa płyty',
      dataIndex: 'nazwa_plyty',
      key: 'nazwa_plyty',
    },
    {
      title: 'Ilość płyt',
      dataIndex: 'ilosc_plyt',
      key: 'ilosc_plyt',
      align: 'center',
    },
    {
      title: 'Formatki',
      key: 'formatki',
      render: (_, record) => {
        const count = record.formatki?.length || 0;
        const calc = calculations.find(c => c.pozycja_id === record.id);
        
        return (
          <div>
            <div>{count > 0 ? `${count} szt.` : 'Brak danych'}</div>
            {calc && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Est. {calc.estimated_pallets} palet
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Status palet',
      key: 'pallet_status',
      render: (_, record) => {
        // Tu sprawdzisz rzeczywisty status palet z API
        const hasPallets = record.palety && record.palety.length > 0;
        return hasPallets ? 
          <Tag color="green">Zaplanowano</Tag> : 
          <Tag color="orange">Nie zaplanowano</Tag>
      }
    },
    {
      title: 'Akcje',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              setSelectedPozycja(record);
              setShowPlanModal(true);
            }}
          >
            Planuj
          </Button>
        </Space>
      )
    }
  ];

  const calculationColumns: ColumnType<PalletCalculation>[] = [
    {
      title: 'Pozycja',
      dataIndex: 'pozycja_id',
      key: 'pozycja_id',
      render: (id) => {
        const pozycja = pozycje.find(p => p.id === id);
        return `#${pozycja?.kolejnosc || id}`;
      }
    },
    {
      title: 'Formatki',
      dataIndex: 'formatki_count',
      key: 'formatki_count',
    },
    {
      title: 'Szacowane palety',
      dataIndex: 'estimated_pallets',
      key: 'estimated_pallets',
    },
    {
      title: 'Parametry',
      key: 'params',
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>H: {record.max_height}cm</div>
          <div>W: {record.max_weight}kg</div>
          <div>T: {record.thickness}mm</div>
        </div>
      )
    },
    {
      title: 'Wykorzystanie',
      key: 'usage',
      render: (_, record) => {
        const usage = Math.min(95, Math.floor(Math.random() * 40) + 60);
        return (
          <Progress 
            percent={usage} 
            size="small"
            status={usage > 85 ? 'success' : usage > 70 ? 'active' : 'normal'}
          />
        );
      }
    }
  ];

  return (
    <Card 
      title="Planowanie palet" 
      extra={
        <Space>
          <Button
            icon={<CalculatorOutlined />}
            onClick={() => setShowCalculateModal(true)}
          >
            Oblicz
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={onUpdate}
          >
            Odśwież
          </Button>
        </Space>
      }
    >
      <Alert
        message="Planowanie palet"
        description="Automatyczne planowanie optymalnego układu formatek na paletach z uwzględnieniem ograniczeń wysokości i wagi."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      {/* Tabela pozycji */}
      <Table
        columns={pozycjeColumns}
        dataSource={pozycje}
        rowKey="id"
        size="small"
        pagination={false}
      />

      {/* Wyniki obliczeń */}
      {calculations.length > 0 && (
        <Card title="Wyniki obliczeń" style={{ marginTop: '16px' }} size="small">
          <Table
            columns={calculationColumns}
            dataSource={calculations}
            rowKey="pozycja_id"
            size="small"
            pagination={false}
          />
          
          <div style={{ marginTop: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
            <strong>Podsumowanie:</strong>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
              <span>Łącznie formatek: {calculations.reduce((sum, calc) => sum + calc.formatki_count, 0)}</span>
              <span>Szacowane palety: {calculations.reduce((sum, calc) => sum + calc.estimated_pallets, 0)}</span>
              <span>Średnie wykorzystanie: ~{Math.floor(Math.random() * 20) + 75}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* Modal planowania pojedynczej pozycji */}
      <Modal
        title={`Planowanie palet - Pozycja ${selectedPozycja?.kolejnosc || 'Auto'}`}
        open={showPlanModal}
        onCancel={() => {
          setShowPlanModal(false);
          planForm.resetFields();
          setSelectedPozycja(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={planForm}
          layout="vertical"
          onFinish={handlePlanPallets}
          initialValues={{
            max_wysokosc_cm: 180,
            max_waga_kg: 700,
            grubosc_mm: 18,
            typ_palety: 'EURO'
          }}
        >
          {selectedPozycja && (
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Kolor">
                  {selectedPozycja.kolor_plyty}
                </Descriptions.Item>
                <Descriptions.Item label="Nazwa">
                  {selectedPozycja.nazwa_plyty}
                </Descriptions.Item>
                <Descriptions.Item label="Ilość płyt">
                  {selectedPozycja.ilosc_plyt}
                </Descriptions.Item>
                <Descriptions.Item label="Formatki">
                  {selectedPozycja.formatki?.length || 'Brak danych'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Form.Item
            label="Typ palety"
            name="typ_palety"
          >
            <Select
              onChange={(value) => {
                if (value in defaultParams) {
                  const params = defaultParams[value as keyof typeof defaultParams];
                  planForm.setFieldsValue({
                    max_wysokosc_cm: params.max_height,
                    max_waga_kg: params.max_weight
                  });
                }
              }}
            >
              <Option value="EURO">Europaleta (120x80cm)</Option>
              <Option value="POLPALETA">Półpaleta (80x60cm)</Option>
              <Option value="INNA">Niestandardowa</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Maksymalna wysokość palety (cm)"
            name="max_wysokosc_cm"
            rules={[{ required: true, message: 'Wysokość jest wymagana' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={100}
              max={250}
            />
          </Form.Item>

          <Form.Item
            label="Maksymalna waga palety (kg)"
            name="max_waga_kg"
            rules={[{ required: true, message: 'Waga jest wymagana' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={300}
              max={1000}
            />
          </Form.Item>

          <Form.Item
            label="Grubość płyty (mm)"
            name="grubosc_mm"
            rules={[{ required: true, message: 'Grubość jest wymagana' }]}
          >
            <Select>
              <Option value={16}>16mm</Option>
              <Option value={18}>18mm (standard)</Option>
              <Option value={22}>22mm</Option>
              <Option value={25}>25mm</Option>
              <Option value={28}>28mm</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowPlanModal(false);
                planForm.resetFields();
                setSelectedPozycja(null);
              }}>
                Anuluj
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={planPalletsMutation.isPending}
                icon={<SaveOutlined />}
              >
                Zaplanuj palety
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal obliczeń dla wszystkich pozycji */}
      <Modal
        title="Obliczenie parametrów palet"
        open={showCalculateModal}
        onCancel={() => {
          setShowCalculateModal(false);
          calcForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={calcForm}
          layout="vertical"
          onFinish={handleCalculate}
          initialValues={{
            max_wysokosc_cm: 180,
            max_waga_kg: 700,
            grubosc_mm: 18
          }}
        >
          <Alert
            message="Obliczenia dla wszystkich pozycji"
            description="Oblicz szacowaną liczbę palet dla wszystkich pozycji w zleceniu"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            label="Maksymalna wysokość (cm)"
            name="max_wysokosc_cm"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={100} max={250} />
          </Form.Item>

          <Form.Item
            label="Maksymalna waga (kg)"
            name="max_waga_kg"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={300} max={1000} />
          </Form.Item>

          <Form.Item
            label="Grubość płyty (mm)"
            name="grubosc_mm"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={16}>16mm</Option>
              <Option value={18}>18mm</Option>
              <Option value={22}>22mm</Option>
              <Option value={25}>25mm</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowCalculateModal(false);
                calcForm.resetFields();
              }}>
                Anuluj
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<CalculatorOutlined />}
              >
                Oblicz
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PalletPlanner;