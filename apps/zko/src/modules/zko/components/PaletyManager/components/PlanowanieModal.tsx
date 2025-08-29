import React from 'react';
import {
  Modal,
  Form,
  Row,
  Col,
  Slider,
  InputNumber,
  Select,
  Space,
  Tag,
  Alert,
  Typography,
  Switch,
  Divider
} from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

export interface PlanowaniePaletParams {
  max_wysokosc_mm: number;
  max_waga_kg: number;
  max_formatek_na_palete: number;
  grubosc_plyty: number;
  strategia: 'kolor' | 'rozmiar' | 'mieszane' | 'oklejanie';
  typ_palety: 'EURO' | 'STANDARD' | 'MAXI';
  uwzglednij_oklejanie: boolean;
}

interface PlanowanieModalProps {
  visible: boolean;
  loading: boolean;
  initialValues: PlanowaniePaletParams;
  onCancel: () => void;
  onOk: (values: PlanowaniePaletParams) => void;
}

export const PlanowanieModal: React.FC<PlanowanieModalProps> = ({
  visible,
  loading,
  initialValues,
  onCancel,
  onOk
}) => {
  const [form] = Form.useForm();
  const [currentValues, setCurrentValues] = React.useState(initialValues);

  const handleOk = () => {
    form.validateFields().then(values => {
      onOk(values);
    });
  };

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, initialValues, form]);

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <Text strong>Parametry planowania palet</Text>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={(_, values) => setCurrentValues(values)}
      >
        <Divider orientation="left">Limity fizyczne</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="max_wysokosc_mm"
              label="Maksymalna wysokość (mm)"
              tooltip="Standardowa wysokość palety EURO to 1440mm"
            >
              <Slider
                min={400}
                max={1500}
                marks={{
                  400: '400',
                  800: '800',
                  1200: '1200',
                  1440: '1440',
                  1500: '1500'
                }}
                tooltip={{ formatter: (value) => `${value}mm` }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="max_waga_kg"
              label="Maksymalna waga (kg)"
              tooltip="Limit wagowy dla bezpiecznego transportu"
              rules={[{ required: true, message: 'Podaj maksymalną wagę' }]}
            >
              <InputNumber
                min={100}
                max={1000}
                step={50}
                style={{ width: '100%' }}
                addonAfter="kg"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="max_formatek_na_palete"
              label="Max formatek na paletę"
              tooltip="Optymalna ilość to 150-250 sztuk"
            >
              <InputNumber
                min={50}
                max={500}
                style={{ width: '100%' }}
                addonAfter="szt"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="grubosc_plyty"
              label="Grubość płyty (mm)"
            >
              <Select>
                <Option value={10}>10 mm</Option>
                <Option value={12}>12 mm</Option>
                <Option value={16}>16 mm</Option>
                <Option value={18}>18 mm</Option>
                <Option value={22}>22 mm</Option>
                <Option value={25}>25 mm</Option>
                <Option value={28}>28 mm</Option>
                <Option value={36}>36 mm</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Parametry układania</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="typ_palety"
              label="Typ palety"
            >
              <Select>
                <Option value="EURO">EURO (1200x800)</Option>
                <Option value="STANDARD">Standard (1200x1000)</Option>
                <Option value="MAXI">Maxi (1200x1200)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="uwzglednij_oklejanie"
              label="Uwzględnij oklejanie"
              valuePropName="checked"
              tooltip="Grupuj formatki wymagające oklejania osobno"
            >
              <Switch 
                checkedChildren="TAK" 
                unCheckedChildren="NIE"
                onChange={(checked) => {
                  if (checked) {
                    form.setFieldValue('strategia', 'oklejanie');
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="strategia"
          label="Strategia układania"
          tooltip="Określa sposób grupowania formatek na paletach"
        >
          <Select>
            <Option value="kolor">
              <Space>
                <Tag color="blue">Według koloru</Tag>
                <Text type="secondary">Grupuj formatki tego samego koloru</Text>
              </Space>
            </Option>
            <Option value="rozmiar">
              <Space>
                <Tag color="green">Według rozmiaru</Tag>
                <Text type="secondary">Grupuj formatki o podobnych wymiarach</Text>
              </Space>
            </Option>
            <Option value="oklejanie">
              <Space>
                <Tag color="purple">Według oklejania</Tag>
                <Text type="secondary">Oddziel formatki wymagające oklejania</Text>
              </Space>
            </Option>
            <Option value="mieszane">
              <Space>
                <Tag color="orange">Mieszane</Tag>
                <Text type="secondary">Optymalne wypełnienie palet</Text>
              </Space>
            </Option>
          </Select>
        </Form.Item>

        <Alert
          message="Informacja"
          description={
            <div>
              <p>System automatycznie zaplanuje rozmieszczenie formatek na paletach według wybranych parametrów.</p>
              <ul style={{ marginBottom: 0 }}>
                <li>Maksymalna waga: <strong>{currentValues.max_waga_kg || initialValues.max_waga_kg} kg</strong></li>
                <li>Maksymalna wysokość: <strong>{currentValues.max_wysokosc_mm || initialValues.max_wysokosc_mm} mm</strong></li>
                <li>Strategia: <strong>{currentValues.strategia || initialValues.strategia}</strong></li>
                {currentValues.uwzglednij_oklejanie && (
                  <li>Formatki wymagające oklejania będą grupowane osobno</li>
                )}
              </ul>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </Form>
    </Modal>
  );
};