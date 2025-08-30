import React from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Alert,
  Row,
  Col,
  Typography,
  Tag,
  Popconfirm,
  Badge,
  Statistic
} from 'antd';
import { 
  PlusCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { ManualPalletCreator } from './ManualPalletCreator';

const { Text } = Typography;

interface PozycjaFormatka {
  id: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  grubosc: number;
  kolor: string;
  ilosc_planowana: number;
  waga_sztuka: number;
  ilosc_w_paletach?: number;
  ilosc_dostepna?: number;
  czy_w_pelni_przypisana?: boolean;
}

interface ManualCreationTabProps {
  pozycjaId?: number;
  pozycjaFormatki: PozycjaFormatka[];
  loading: boolean;
  onSaveManualPallets: (palety: any[]) => void;
  onCreateAllRemaining: (przeznaczenie?: string) => void;
  onRefresh?: () => void;
}

export const ManualCreationTab: React.FC<ManualCreationTabProps> = ({
  pozycjaId,
  pozycjaFormatki,
  loading,
  onSaveManualPallets,
  onCreateAllRemaining,
  onRefresh
}) => {
  // Oblicz statystyki
  const totalPlanowane = pozycjaFormatki.reduce((sum, f) => sum + f.ilosc_planowana, 0);
  const totalWPaletach = pozycjaFormatki.reduce((sum, f) => sum + (f.ilosc_w_paletach || 0), 0);
  const totalDostepne = pozycjaFormatki.reduce((sum, f) => sum + (f.ilosc_dostepna || 0), 0);
  const availableTypes = pozycjaFormatki.filter(f => (f.ilosc_dostepna || 0) > 0).length;
  const totalTypes = pozycjaFormatki.length;
  
  // Procent zapaletyzowania
  const procentZapaletyzowania = totalPlanowane > 0 
    ? Math.round((totalWPaletach / totalPlanowane) * 100) 
    : 0;

  if (!pozycjaId) {
    return (
      <Alert
        message="Brak danych pozycji"
        description="Aby korzystać z ręcznego tworzenia palet, musisz wybrać konkretną pozycję ZKO."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <>
      {/* Statystyki pozycji */}
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        title="📊 Status paletyzacji pozycji"
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="Planowane" 
              value={totalPlanowane} 
              suffix="szt."
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Na paletach" 
              value={totalWPaletach} 
              suffix="szt."
              valueStyle={{ color: totalWPaletach > 0 ? '#52c41a' : undefined }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Pozostało" 
              value={totalDostepne} 
              suffix="szt."
              valueStyle={{ color: totalDostepne > 0 ? '#1890ff' : '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Zapaletyzowano" 
              value={procentZapaletyzowania} 
              suffix="%"
              prefix={procentZapaletyzowania === 100 ? <CheckCircleOutlined /> : undefined}
              valueStyle={{ 
                color: procentZapaletyzowania === 100 ? '#52c41a' : 
                       procentZapaletyzowania > 50 ? '#faad14' : undefined 
              }}
            />
          </Col>
        </Row>
        
        {/* Informacja o typach formatek */}
        <div style={{ marginTop: 16 }}>
          <Space>
            <Tag color="blue">Typy formatek: {totalTypes}</Tag>
            <Tag color="green">Na paletach: {totalTypes - availableTypes}</Tag>
            <Tag color="orange">Do przypisania: {availableTypes}</Tag>
          </Space>
        </div>
      </Card>

      {/* Sekcja akcji szybkich */}
      {totalDostepne > 0 && (
        <Card 
          size="small" 
          style={{ 
            marginBottom: 16, 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f' 
          }}
        >
          <Row gutter={16} align="middle">
            <Col span={16}>
              <Space direction="vertical" size={0}>
                <Text strong>🚀 Akcje szybkie</Text>
                <Text type="secondary">
                  Dostępnych {totalDostepne} formatek w {availableTypes} typach
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <Popconfirm
                  title="Utworzyć paletę ze wszystkimi pozostałymi formatkami?"
                  description={`Zostanie utworzona pojedyncza paleta z ${totalDostepne} formatkami`}
                  onConfirm={() => onCreateAllRemaining('MAGAZYN')}
                  okText="Utwórz"
                  cancelText="Anuluj"
                >
                  <Button 
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    style={{ 
                      background: '#52c41a', 
                      borderColor: '#52c41a'
                    }}
                  >
                    📦 Utwórz paletę ze wszystkimi
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Status formatek */}
      {pozycjaFormatki.length === 0 ? (
        <Alert
          message="Pobieranie formatek..."
          description="Ładowanie dostępnych formatek z pozycji."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : totalDostepne === 0 ? (
        <Alert
          message="✅ Wszystkie formatki przypisane"
          description={`Wszystkie ${totalPlanowane} formatek z tej pozycji zostały już przypisane do palet.`}
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={onRefresh}>
              Odśwież
            </Button>
          }
        />
      ) : (
        <Alert
          message={`📋 Dostępne formatki: ${totalDostepne} z ${totalPlanowane} szt.`}
          description={
            <Space direction="vertical">
              <Text>{availableTypes} typów formatek gotowych do przypisania do palet.</Text>
              {totalWPaletach > 0 && (
                <Text type="secondary">
                  Już na paletach: {totalWPaletach} szt. ({procentZapaletyzowania}%)
                </Text>
              )}
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <ManualPalletCreator
        pozycjaId={pozycjaId}
        formatki={pozycjaFormatki}
        onSave={onSaveManualPallets}
        onRefresh={onRefresh}
        loading={loading}
      />
    </>
  );
};