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
  Button,
  Tooltip,
  Progress,
  Radio
} from 'antd';
import { 
  SettingOutlined, 
  InfoCircleOutlined, 
  RocketOutlined, 
  StarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  FireOutlined,
  BgColorsOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

// Typy dla planowania modularnego V2
export interface PlanowanieModularneParams {
  max_wysokosc_mm: number;
  max_formatek_na_palete: number;
  nadpisz_istniejace: boolean;
  operator: string;
  strategia: 'modular' | 'kolory';  // 🆕 NOWA OPCJA
}

interface PlanowaniePresetV2 {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  params: {
    max_wysokosc_mm: number;
    max_formatek_na_palete: number;
  };
  optimalFor: string[];
}

// Presety dla planowania modularnego V2
const PLANOWANIE_PRESETS_V2: Record<string, PlanowaniePresetV2> = {
  standard: {
    name: '🏭 Standard',
    icon: <SettingOutlined />,
    description: 'Typowa produkcja - zbalansowane podejście',
    color: '#1890ff',
    params: {
      max_wysokosc_mm: 1440,
      max_formatek_na_palete: 80
    },
    optimalFor: ['Produkcja seryjna', 'Średnie zamówienia', 'Transport standardowy']
  },
  compact: {
    name: '📦 Kompakt',
    icon: <ThunderboltOutlined />,
    description: 'Więcej sztuk na palecie - optymalizacja miejsca',
    color: '#52c41a',
    params: {
      max_wysokosc_mm: 1440,
      max_formatek_na_palete: 120
    },
    optimalFor: ['Małe formatki', 'Optymalizacja miejsca', 'Duże zamówienia']
  },
  safe: {
    name: '🛡️ Bezpieczny',
    icon: <SafetyOutlined />,
    description: 'Niższe palety - stabilny transport',
    color: '#faad14',
    params: {
      max_wysokosc_mm: 1200,
      max_formatek_na_palete: 60
    },
    optimalFor: ['Transport długodystansowy', 'Ciężkie formatki', 'Wysoka stabilność']
  },
  heavy: {
    name: '💪 Wytrzymały',
    icon: <FireOutlined />,
    description: 'Dla ciężkich płyt - mniejsze ilości',
    color: '#f5222d',
    params: {
      max_wysokosc_mm: 1000,
      max_formatek_na_palete: 40
    },
    optimalFor: ['Grube płyty (25mm+)', 'Ciężkie materiały', 'Bezpieczny transport']
  }
};

// 🆕 STRATEGIE PLANOWANIA
const STRATEGIE_PLANOWANIA = {
  modular: {
    name: 'Modularyczne',
    icon: <AppstoreOutlined />,
    description: 'Proporcjonalne rozłożenie wszystkich formatek na palety',
    color: '#722ed1',
    benefits: ['Równomierne wykorzystanie', 'Mieszane kolory', 'Optymalizacja przestrzeni']
  },
  kolory: {
    name: 'Grupowanie po kolorach',
    icon: <BgColorsOutlined />,
    description: 'Każda paleta = jeden kolor formatek',
    color: '#13c2c2',
    benefits: ['Łatwa identyfikacja', 'Segregacja kolorów', 'Transport do klienta']
  }
};

interface PlanowanieModularneModalProps {
  visible: boolean;
  loading: boolean;
  initialValues?: Partial<PlanowanieModularneParams>;
  onCancel: () => void;
  onOk: (values: PlanowanieModularneParams) => void;
}

export const PlanowanieModularneModal: React.FC<PlanowanieModularneModalProps> = ({
  visible,
  loading,
  initialValues = {},
  onCancel,
  onOk
}) => {
  const [form] = Form.useForm();
  const [selectedPreset, setSelectedPreset] = React.useState<string>('standard');
  const [currentValues, setCurrentValues] = React.useState<PlanowanieModularneParams>({
    max_wysokosc_mm: 1440,
    max_formatek_na_palete: 80,
    nadpisz_istniejace: false,
    operator: 'user',
    strategia: 'kolory', // 🆕 DOMYŚLNIE KOLORY
    ...initialValues
  });

  const handleOk = () => {
    form.validateFields().then(values => {
      onOk({
        ...values,
        operator: 'user'
      });
    });
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = PLANOWANIE_PRESETS_V2[presetKey];
    if (preset) {
      setSelectedPreset(presetKey);
      const newValues = {
        ...currentValues,
        ...preset.params
      };
      form.setFieldsValue(newValues);
      setCurrentValues(newValues);
    }
  };

  React.useEffect(() => {
    if (visible) {
      const defaultValues = {
        max_wysokosc_mm: 1440,
        max_formatek_na_palete: 80,
        nadpisz_istniejace: false,
        operator: 'user',
        strategia: 'kolory' as const, // 🆕 DOMYŚLNIE KOLORY
        ...initialValues
      };
      form.setFieldsValue(defaultValues);
      setCurrentValues(defaultValues);
    }
  }, [visible, initialValues, form]);

  const preset = PLANOWANIE_PRESETS_V2[selectedPreset];
  const strategiaInfo = STRATEGIE_PLANOWANIA[currentValues.strategia || 'kolory'];
  
  // Oblicz efektywność palety
  const efficiency = Math.min(100, Math.round((currentValues.max_formatek_na_palete / 120) * 100));
  const heightEfficiency = Math.min(100, Math.round((currentValues.max_wysokosc_mm / 1440) * 100));
  
  return (
    <Modal
      title={
        <Space>
          <StarOutlined style={{ color: '#722ed1' }} />
          <Text strong>Planowanie Modulariczne V2</Text>
          <Tag color="purple">ZALECANE ⭐</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={900}
      okText="🚀 Zaplanuj Modularnie"
      cancelText="Anuluj"
      okButtonProps={{ 
        type: 'primary',
        style: { background: '#722ed1', borderColor: '#722ed1' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(_, values) => setCurrentValues(prev => ({ ...prev, ...values }))}
      >
        
        {/* INFO O V2 */}
        <Alert
          message="✨ Planowanie Modulariczne V2"
          description={
            <div>
              <Text>
                Nowa wersja z <strong>grupowaniem po kolorach</strong> i poprawnym liczeniem ilości formatek.
                Wypełnia tabelę <code>palety_formatki_ilosc</code> rzeczywistymi danymi.
              </Text>
              <br />
              <Text type="secondary">
                Rozwiązuje problem błędnego liczenia ilości w V5!
              </Text>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 🆕 STRATEGIA PLANOWANIA */}
        <Divider orientation="left">
          <Space>
            <BgColorsOutlined />
            Strategia planowania
          </Space>
        </Divider>
        
        <Form.Item
          name="strategia"
          label="Sposób grupowania formatek"
          tooltip="Wybierz jak formatki mają być rozmieszczone na paletach"
        >
          <Radio.Group size="large">
            {Object.entries(STRATEGIE_PLANOWANIA).map(([key, strategy]) => (
              <Radio.Button 
                key={key} 
                value={key}
                style={{
                  height: 'auto',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  display: 'block',
                  whiteSpace: 'normal'
                }}
              >
                <Space direction="vertical" size={4}>
                  <Space>
                    <span style={{ color: strategy.color, fontSize: '16px' }}>
                      {strategy.icon}
                    </span>
                    <Text strong style={{ color: strategy.color }}>
                      {strategy.name}
                    </Text>
                    {key === 'kolory' && <Tag color="gold">⭐ NOWE</Tag>}
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {strategy.description}
                  </Text>
                  <Space wrap>
                    {strategy.benefits.slice(0, 2).map((benefit, idx) => (
                      <Tag key={idx} size="small" color={strategy.color}>
                        {benefit}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        {/* INFO O WYBRANEJ STRATEGII */}
        <Card
          size="small" 
          style={{ 
            marginBottom: 16, 
            backgroundColor: `${strategiaInfo.color}08`,
            borderColor: `${strategiaInfo.color}40`
          }}
        >
          <Space>
            <span style={{ fontSize: '20px', color: strategiaInfo.color }}>
              {strategiaInfo.icon}
            </span>
            <div>
              <Text strong style={{ color: strategiaInfo.color }}>
                {strategiaInfo.name}
              </Text>
              <br />
              <Text type="secondary">{strategiaInfo.description}</Text>
              <br />
              <Space wrap style={{ marginTop: 4 }}>
                {strategiaInfo.benefits.map((benefit, idx) => (
                  <Tag key={idx} color={strategiaInfo.color} size="small">
                    {benefit}
                  </Tag>
                ))}
              </Space>
            </div>
          </Space>
        </Card>

        {/* PRESETY V2 */}
        <Divider orientation="left">
          <Space>
            <RocketOutlined />
            Szybkie ustawienia
          </Space>
        </Divider>
        
        <Row gutter={[16, 16]}>
          {Object.entries(PLANOWANIE_PRESETS_V2).map(([key, preset]) => (
            <Col span={12} key={key}>
              <Card
                size="small"
                hoverable
                className={selectedPreset === key ? 'preset-selected' : ''}
                onClick={() => handlePresetSelect(key)}
                style={{
                  border: selectedPreset === key ? `2px solid ${preset.color}` : '1px solid #d9d9d9',
                  backgroundColor: selectedPreset === key ? `${preset.color}08` : 'white'
                }}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    <span style={{ fontSize: '16px', color: preset.color }}>
                      {preset.icon}
                    </span>
                    <Text strong style={{ color: preset.color }}>
                      {preset.name}
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {preset.description}
                  </Text>
                  <Space wrap>
                    {preset.optimalFor.slice(0, 2).map((item, idx) => (
                      <Tag key={idx} size="small" color={preset.color}>
                        {item}
                      </Tag>
                    ))}
                  </Space>
                  <Space>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {preset.params.max_wysokosc_mm}mm • {preset.params.max_formatek_na_palete}szt
                    </Text>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* LIMITY FIZYCZNE V2 */}
        <Divider orientation="left">Parametry planowania</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="max_wysokosc_mm"
              label={
                <Space>
                  <Text>Maksymalna wysokość</Text>
                  <Tag color="blue">{currentValues.max_wysokosc_mm}mm</Tag>
                </Space>
              }
              tooltip="Wysokość palety wpływa na stabilność i bezpieczeństwo transportu"
            >
              <Slider
                min={800}
                max={1600}
                step={40}
                marks={{
                  800: '800',
                  1000: '1000',
                  1200: '1200',
                  1440: 'EURO',
                  1600: 'MAX'
                }}
                tooltip={{ formatter: (value) => `${value}mm` }}
              />
            </Form.Item>
            <Progress 
              percent={heightEfficiency} 
              size="small" 
              strokeColor="#1890ff"
              format={() => `${heightEfficiency}% wysokości`}
            />
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="max_formatek_na_palete"
              label={
                <Space>
                  <Text>Max formatek na paletę</Text>
                  <Tag color="green">{currentValues.max_formatek_na_palete}szt</Tag>
                </Space>
              }
              tooltip="Liczba formatek wpływa na efektywność wykorzystania przestrzeni"
            >
              <Slider
                min={20}
                max={150}
                step={10}
                marks={{
                  20: '20',
                  40: '40',
                  80: 'OPT',
                  120: '120',
                  150: 'MAX'
                }}
                tooltip={{ formatter: (value) => `${value}szt` }}
              />
            </Form.Item>
            <Progress 
              percent={efficiency} 
              size="small" 
              strokeColor="#52c41a"
              format={() => `${efficiency}% efektywności`}
            />
          </Col>
        </Row>

        {/* ZAAWANSOWANE OPCJE */}
        <Divider orientation="left">Opcje zaawansowane</Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nadpisz_istniejace"
              label="Zastąp istniejące palety"
              valuePropName="checked"
              tooltip="Czy usunąć obecne palety i utworzyć nowe według nowych parametrów"
            >
              <Switch 
                checkedChildren="TAK" 
                unCheckedChildren="NIE"
                style={{ 
                  backgroundColor: currentValues.nadpisz_istniejace ? '#ff4d4f' : undefined 
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Operator">
              <Text code>user</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                (automatycznie przypisany)
              </Text>
            </Form.Item>
          </Col>
        </Row>

        {currentValues.nadpisz_istniejace && (
          <Alert
            message="⚠️ Uwaga - Zastąpienie palet"
            description="Ta opcja usunie wszystkie istniejące palety i ich przypisania formatek. Operacja jest nieodwracalna!"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* PODGLĄD USTAWIEŃ V2 */}
        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text strong>Podgląd konfiguracji</Text>
            </Space>
          }
          size="small"
          style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <div>
                <Text strong>Strategia:</Text>
                <div style={{ marginTop: 4 }}>
                  <Space>
                    <span style={{ color: strategiaInfo.color }}>
                      {strategiaInfo.icon}
                    </span>
                    <Tag color={strategiaInfo.color}>{strategiaInfo.name}</Tag>
                  </Space>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {strategiaInfo.description}
                </Text>
              </div>
            </Col>
            
            <Col span={8}>
              <div>
                <Text strong>Preset:</Text>
                <div style={{ marginTop: 4 }}>
                  <Space>
                    {preset.icon}
                    <Tag color={preset.color}>{preset.name}</Tag>
                  </Space>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {preset.description}
                </Text>
              </div>
            </Col>
            
            <Col span={8}>
              <div>
                <Text strong>Parametry:</Text>
                <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
                  <li>Wysokość: <strong>{currentValues.max_wysokosc_mm}mm</strong></li>
                  <li>Formatki: <strong>{currentValues.max_formatek_na_palete}szt</strong></li>
                  <li>Nadpisz: <strong>{currentValues.nadpisz_istniejace ? 'TAK' : 'NIE'}</strong></li>
                </ul>
              </div>
            </Col>
          </Row>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Alert
            message={currentValues.strategia === 'kolory' ? "🎨 Grupowanie po kolorach" : "🎯 Planowanie Modulariczne"}
            description={
              <Space direction="vertical" size={4}>
                {currentValues.strategia === 'kolory' ? (
                  <>
                    <Text>
                      System użyje funkcji <code>pal_planuj_z_kolorami()</code> - każda paleta będzie zawierać formatki tylko jednego koloru.
                    </Text>
                    <Text type="secondary">
                      ✅ Łatwa identyfikacja kolorów na paletach
                    </Text>
                    <Text type="secondary">
                      ✅ Idealne do transportu i segregacji
                    </Text>
                    <Text type="secondary">
                      ✅ Automatyczne wypełnienie tabeli ilości
                    </Text>
                  </>
                ) : (
                  <>
                    <Text>
                      System użyje funkcji <code>pal_planuj_modularnie()</code> z proporcjonalnym rozłożeniem formatek.
                    </Text>
                    <Text type="secondary">
                      ✅ Wypełni tabelę palety_formatki_ilosc proporcjonalnymi ilościami
                    </Text>
                    <Text type="secondary">
                      ✅ Zweryfikuje zgodność między ZKO ↔ Palety ↔ Tabela ilości
                    </Text>
                  </>
                )}
                <Text type="secondary">
                  ✅ Pokaże szczegółowy modal z wynikami i wizualizacją
                </Text>
              </Space>
            }
            type="info"
            showIcon
            style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}
          />
        </Card>
      </Form>

      <style>{`
        .preset-selected {
          box-shadow: 0 2px 8px rgba(114, 46, 209, 0.15) !important;
        }
      `}</style>
    </Modal>
  );
};