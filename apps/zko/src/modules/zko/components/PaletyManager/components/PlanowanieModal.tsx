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
  Divider,
  Card,
  Button
} from 'antd';
import { SettingOutlined, InfoCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { 
  StrategiaPlanowania, 
  TypPalety, 
  STRATEGIE_DESCRIPTIONS, 
  LIMITY_PALETY,
  PLANOWANIE_PRESETS,
  PlanowaniePreset
} from '../types';

const { Option } = Select;
const { Text } = Typography;

export interface PlanowaniePaletParams {
  strategia: StrategiaPlanowania;
  max_wysokosc_mm: number;
  max_waga_kg: number;
  max_formatek_na_palete: number;
  grubosc_plyty: number;
  typ_palety: TypPalety;
  uwzglednij_oklejanie: boolean;
  nadpisz_istniejace?: boolean;
  operator?: string;
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

  const handlePresetSelect = (preset: PlanowaniePreset) => {
    const presetValues = PLANOWANIE_PRESETS[preset].params;
    form.setFieldsValue(presetValues);
    setCurrentValues(prev => ({ ...prev, ...presetValues }));
  };

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues);
      setCurrentValues(initialValues);
    }
  }, [visible, initialValues, form]);

  const selectedStrategy = currentValues.strategia || initialValues.strategia;
  const strategyInfo = STRATEGIE_DESCRIPTIONS[selectedStrategy];

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <Text strong>Planowanie palet V5</Text>
          <Tag color="blue">NOWA WERSJA</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={800}
      okText="Zaplanuj palety"
      cancelText="Anuluj"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={(_, values) => setCurrentValues(values)}
      >
        
        {/* PRESETS */}
        <Alert
          message="⚡ Szybkie ustawienia"
          description={
            <Space wrap style={{ marginTop: 8 }}>
              {Object.entries(PLANOWANIE_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  size="small"
                  onClick={() => handlePresetSelect(key as PlanowaniePreset)}
                  icon={<RocketOutlined />}
                >
                  {preset.name}
                </Button>
              ))}
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />

        {/* STRATEGIA */}
        <Divider orientation="left">Strategia planowania</Divider>
        
        <Form.Item
          name="strategia"
          label="Sposób układania formatek"
          tooltip="Określa algorytm grupowania formatek na paletach"
        >
          <Select size="large">
            {Object.entries(STRATEGIE_DESCRIPTIONS).map(([key, info]) => (
              <Option key={key} value={key}>
                <Space>
                  <span style={{ fontSize: '16px' }}>{info.icon}</span>
                  <div>
                    <Text strong style={{ color: info.color as any }}>{info.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {info.description}
                    </Text>
                  </div>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {strategyInfo && (
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f9ff' }}>
            <Space>
              <span style={{ fontSize: '20px' }}>{strategyInfo.icon}</span>
              <div>
                <Text strong>{strategyInfo.name}</Text>
                <br />
                <Text type="secondary">{strategyInfo.description}</Text>
              </div>
            </Space>
          </Card>
        )}

        {/* LIMITY FIZYCZNE */}
        <Divider orientation="left">Limity fizyczne</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="max_wysokosc_mm"
              label={
                <Space>
                  Maksymalna wysokość
                  <Text type="secondary">({currentValues.max_wysokosc_mm || initialValues.max_wysokosc_mm}mm)</Text>
                </Space>
              }
              tooltip="Standardowa wysokość palety EURO to 1440mm"
            >
              <Slider
                min={LIMITY_PALETY.MIN_WYSOKOSC_MM}
                max={LIMITY_PALETY.MAX_WYSOKOSC_MM}
                marks={{
                  400: '400',
                  800: '800',
                  1200: '1200',
                  1440: '1440 (EURO)',
                  1600: '1600'
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
                min={LIMITY_PALETY.MIN_WAGA_KG}
                max={LIMITY_PALETY.MAX_WAGA_KG}
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
              tooltip={`Optymalna ilość to ${LIMITY_PALETY.OPTYMALNE_FORMATEK_MIN}-${LIMITY_PALETY.OPTYMALNE_FORMATEK_MAX} sztuk`}
            >
              <InputNumber
                min={50}
                max={LIMITY_PALETY.MAX_FORMATEK}
                style={{ width: '100%' }}
                addonAfter="szt"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="grubosc_plyty"
              label="Grubość płyty (mm)"
              tooltip="Wpływa na obliczenia wysokości stosu"
            >
              <Select>
                <Option value={10}>10 mm (7.0 kg/m²)</Option>
                <Option value={12}>12 mm (8.4 kg/m²)</Option>
                <Option value={16}>16 mm (11.2 kg/m²)</Option>
                <Option value={18}>18 mm (12.6 kg/m²)</Option>
                <Option value={22}>22 mm (15.4 kg/m²)</Option>
                <Option value={25}>25 mm (17.5 kg/m²)</Option>
                <Option value={28}>28 mm (19.6 kg/m²)</Option>
                <Option value={36}>36 mm (25.2 kg/m²)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* USTAWIENIA PALETY */}
        <Divider orientation="left">Ustawienia palety</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="typ_palety"
              label="Typ palety"
              tooltip="Determinuje wymiary bazowe palety"
            >
              <Select>
                <Option value="EURO">
                  <Space>
                    <Text strong>EURO</Text>
                    <Text type="secondary">(1200×800mm)</Text>
                  </Space>
                </Option>
                <Option value="STANDARD">
                  <Space>
                    <Text strong>STANDARD</Text>
                    <Text type="secondary">(1200×1000mm)</Text>
                  </Space>
                </Option>
                <Option value="MAXI">
                  <Space>
                    <Text strong>MAXI</Text>
                    <Text type="secondary">(1200×1200mm)</Text>
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="uwzglednij_oklejanie"
              label="Uwzględnij oklejanie"
              valuePropName="checked"
              tooltip="Formatki wymagające oklejania będą grupowane osobno"
            >
              <Switch 
                checkedChildren="TAK" 
                unCheckedChildren="NIE"
                onChange={(checked) => {
                  if (checked && currentValues.strategia !== 'oklejanie') {
                    form.setFieldValue('strategia', 'inteligentna');
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* PODGLĄD USTAWIEŃ */}
        <Alert
          message="🎯 Podgląd ustawień"
          description={
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Parametry palety:</Text>
                  <ul style={{ margin: '8px 0', paddingLeft: 16 }}>
                    <li>Waga: <strong>{currentValues.max_waga_kg || initialValues.max_waga_kg} kg</strong></li>
                    <li>Wysokość: <strong>{currentValues.max_wysokosc_mm || initialValues.max_wysokosc_mm} mm</strong></li>
                    <li>Formatki: <strong>{currentValues.max_formatek_na_palete || initialValues.max_formatek_na_palete} szt</strong></li>
                    <li>Typ: <strong>{currentValues.typ_palety || initialValues.typ_palety}</strong></li>
                  </ul>
                </Col>
                <Col span={12}>
                  <Text strong>Strategia:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={strategyInfo.color as any} icon={strategyInfo.icon}>
                      {strategyInfo.name}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {strategyInfo.description}
                    </Text>
                  </div>
                  {currentValues.uwzglednij_oklejanie && (
                    <div style={{ marginTop: 8 }}>
                      <Tag color="gold">+ Oklejanie</Tag>
                    </div>
                  )}
                </Col>
              </Row>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Text type="secondary">
                System użyje funkcji <strong>pal_planuj_inteligentnie_v5</strong> do optymalnego 
                rozplanowania formatek na paletach według wybranych kryteriów.
              </Text>
            </div>
          }
          type="success"
          showIcon
        />
      </Form>
    </Modal>
  );
};