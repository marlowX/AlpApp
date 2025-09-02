import React from 'react';
import { Select, Space, Tag, Typography, Alert, Tooltip, Button } from 'antd';
import { 
  ArrowRightOutlined, 
  ScissorOutlined,
  ToolOutlined,
  BuildOutlined,
  HomeOutlined,
  SwapOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export interface SciezkaProdukcjiProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  showInfo?: boolean;
}

// Predefiniowane ścieżki produkcji
export const SCIEZKI_PRODUKCJI = [
  {
    id: 'CIECIE->MAGAZYN',
    label: 'Tylko cięcie',
    kroki: ['CIECIE', 'MAGAZYN'],
    opis: 'Formatki bez oklejania i wiercenia',
    ikona: <ScissorOutlined />,
    kolor: 'blue'
  },
  {
    id: 'CIECIE->OKLEJANIE->MAGAZYN',
    label: 'Cięcie + Oklejanie',
    kroki: ['CIECIE', 'OKLEJANIE', 'MAGAZYN'],
    opis: 'Standardowa ścieżka z oklejaniem',
    ikona: <ToolOutlined />,
    kolor: 'green'
  },
  {
    id: 'CIECIE->OKLEJANIE->WIERCENIE->MAGAZYN',
    label: 'Pełna obróbka',
    kroki: ['CIECIE', 'OKLEJANIE', 'WIERCENIE', 'MAGAZYN'],
    opis: 'Cięcie, oklejanie i wiercenie',
    ikona: <BuildOutlined />,
    kolor: 'orange'
  },
  {
    id: 'CIECIE->WIERCENIE->MAGAZYN',
    label: 'Cięcie + Wiercenie',
    kroki: ['CIECIE', 'WIERCENIE', 'MAGAZYN'],
    opis: 'Formatki wiercone bez oklejania',
    ikona: <BuildOutlined />,
    kolor: 'purple'
  },
  {
    id: 'CIECIE->WIERCENIE->OKLEJANIE->MAGAZYN',
    label: 'Wiercenie przed oklejaniem',
    kroki: ['CIECIE', 'WIERCENIE', 'OKLEJANIE', 'MAGAZYN'],
    opis: 'Najpierw wiercenie, potem oklejanie',
    ikona: <SwapOutlined />,
    kolor: 'red'
  }
];

// Ikony dla etapów
const getEtapIcon = (etap: string) => {
  switch(etap) {
    case 'CIECIE': return <ScissorOutlined />;
    case 'OKLEJANIE': return <ToolOutlined />;
    case 'WIERCENIE': return <BuildOutlined />;
    case 'MAGAZYN': return <HomeOutlined />;
    default: return null;
  }
};

// Kolory dla etapów
const getEtapColor = (etap: string) => {
  switch(etap) {
    case 'CIECIE': return 'blue';
    case 'OKLEJANIE': return 'green';
    case 'WIERCENIE': return 'orange';
    case 'MAGAZYN': return 'purple';
    default: return 'default';
  }
};

export const SciezkaProdukcji: React.FC<SciezkaProdukcjiProps> = ({
  value,
  onChange,
  disabled = false,
  showInfo = true
}) => {
  const selectedSciezka = SCIEZKI_PRODUKCJI.find(s => s.id === value);

  // Funkcja do renderowania wizualizacji ścieżki
  const renderSciezkaVisualization = (sciezka: typeof SCIEZKI_PRODUKCJI[0]) => (
    <Space size={4} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
      {sciezka.kroki.map((krok, index) => (
        <React.Fragment key={index}>
          <Tag 
            icon={getEtapIcon(krok)} 
            color={getEtapColor(krok)}
            style={{ margin: 0 }}
          >
            {krok}
          </Tag>
          {index < sciezka.kroki.length - 1 && (
            <ArrowRightOutlined style={{ color: '#999', fontSize: 12 }} />
          )}
        </React.Fragment>
      ))}
    </Space>
  );

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Space style={{ marginBottom: 8 }}>
            <Text strong>Ścieżka produkcji:</Text>
            <Tooltip title="Określa kolejność etapów przez które przejdą formatki">
              <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
            </Tooltip>
          </Space>
          
          <Select
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder="Wybierz ścieżkę produkcji"
            style={{ width: '100%' }}
            size="large"
          >
            {SCIEZKI_PRODUKCJI.map(sciezka => (
              <Option key={sciezka.id} value={sciezka.id}>
                <Space>
                  {sciezka.ikona}
                  <span>{sciezka.label}</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({sciezka.opis})
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>
        </div>

        {/* Wizualizacja wybranej ścieżki */}
        {selectedSciezka && (
          <div style={{ 
            padding: 12, 
            background: '#f5f5f5', 
            borderRadius: 8,
            border: '1px solid #d9d9d9'
          }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong>{selectedSciezka.label}</Text>
              {renderSciezkaVisualization(selectedSciezka)}
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedSciezka.opis}
              </Text>
            </Space>
          </div>
        )}

        {/* Informacja dodatkowa */}
        {showInfo && (
          <Alert
            message="Ścieżka produkcji"
            description={
              <Space direction="vertical" size="small">
                <Text>Ścieżka określa kolejność operacji technologicznych dla formatek.</Text>
                <Text>Można ją zmienić później dla pojedynczych formatek na palecie.</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Domyślnie: CIECIE → OKLEJANIE → MAGAZYN
                </Text>
              </Space>
            }
            type="info"
            showIcon
            closable
          />
        )}
      </Space>
    </div>
  );
};

// Komponent do wyświetlania ścieżki (read-only)
export const SciezkaDisplay: React.FC<{ sciezka: string }> = ({ sciezka }) => {
  const sciezkaObj = SCIEZKI_PRODUKCJI.find(s => s.id === sciezka);
  
  if (!sciezkaObj) {
    // Jeśli ścieżka niestandardowa, spróbuj ją sparsować
    const kroki = sciezka?.split('->') || [];
    if (kroki.length > 0) {
      return (
        <Space size={4}>
          {kroki.map((krok, index) => (
            <React.Fragment key={index}>
              <Tag 
                icon={getEtapIcon(krok)} 
                color={getEtapColor(krok)}
                style={{ margin: 0, fontSize: 11 }}
              >
                {krok}
              </Tag>
              {index < kroki.length - 1 && (
                <ArrowRightOutlined style={{ color: '#999', fontSize: 10 }} />
              )}
            </React.Fragment>
          ))}
        </Space>
      );
    }
    return <Text type="secondary">-</Text>;
  }

  return (
    <Tooltip title={sciezkaObj.opis}>
      <Space size={4}>
        {sciezkaObj.kroki.map((krok, index) => (
          <React.Fragment key={index}>
            <Tag 
              icon={getEtapIcon(krok)} 
              color={getEtapColor(krok)}
              style={{ margin: 0, fontSize: 11 }}
            >
              {krok}
            </Tag>
            {index < sciezkaObj.kroki.length - 1 && (
              <ArrowRightOutlined style={{ color: '#999', fontSize: 10 }} />
            )}
          </React.Fragment>
        ))}
      </Space>
    </Tooltip>
  );
};

// Hook do zarządzania ścieżką produkcji
export const useSciezkaProdukcji = (defaultValue?: string) => {
  const [sciezka, setSciezka] = React.useState(defaultValue || 'CIECIE->OKLEJANIE->MAGAZYN');
  
  const getNextStep = (currentStep: string): string | null => {
    const kroki = sciezka.split('->');
    const currentIndex = kroki.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex === kroki.length - 1) return null;
    return kroki[currentIndex + 1];
  };
  
  const getPreviousStep = (currentStep: string): string | null => {
    const kroki = sciezka.split('->');
    const currentIndex = kroki.indexOf(currentStep);
    if (currentIndex <= 0) return null;
    return kroki[currentIndex - 1];
  };
  
  const isLastStep = (currentStep: string): boolean => {
    const kroki = sciezka.split('->');
    return kroki[kroki.length - 1] === currentStep;
  };
  
  return {
    sciezka,
    setSciezka,
    getNextStep,
    getPreviousStep,
    isLastStep,
    kroki: sciezka.split('->')
  };
};
