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
  Statistic,
  Empty
} from 'antd';
import { 
  PlusCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  InfoCircleOutlined
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
  // Oblicz statystyki - NAPRAWIONE obsługa undefined/null
  const formatNumber = (num: number | undefined | null): number => {
    if (num === null || num === undefined || isNaN(num)) return 0;
    return num;
  };

  const totalPlanowane = pozycjaFormatki.reduce((sum, f) => sum + formatNumber(f.ilosc_planowana), 0);
  const totalWPaletach = pozycjaFormatki.reduce((sum, f) => sum + formatNumber(f.ilosc_w_paletach), 0);
  const totalDostepne = pozycjaFormatki.reduce((sum, f) => sum + formatNumber(f.ilosc_dostepna), 0);
  const availableTypes = pozycjaFormatki.filter(f => formatNumber(f.ilosc_dostepna) > 0).length;
  const totalTypes = pozycjaFormatki.length;
  
  // Procent zapaletyzowania
  const procentZapaletyzowania = totalPlanowane > 0 
    ? Math.round((totalWPaletach / totalPlanowane) * 100) 
    : 0;

  // Stany pozycji
  const hasPozycja = !!pozycjaId;
  const hasFormatki = pozycjaFormatki.length > 0;
  const hasPlannedFormatki = totalPlanowane > 0;
  const hasAvailableFormatki = totalDostepne > 0;
  const isFullyPalletized = hasPlannedFormatki && procentZapaletyzowania === 100;
  const isLoadingFormatki = loading && hasPozycja;

  // Funkcja która sprawdza czy można utworzyć paletę
  const handleCreateAllRemaining = () => {
    if (totalDostepne === 0) {
      console.warn('Brak dostępnych formatek do utworzenia palety');
      return;
    }
    onCreateAllRemaining('MAGAZYN');
  };

  // ========== PRZYPADEK: Brak wybranej pozycji ==========
  if (!hasPozycja) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text strong>Wybierz pozycję do zarządzania</Text>
              <Text type="secondary">
                Aby korzystać z ręcznego tworzenia palet, musisz najpierw wybrać konkretną pozycję ZKO.
              </Text>
            </Space>
          }
        />
      </div>
    );
  }

  // ========== PRZYPADEK: Ładowanie formatek ==========
  if (isLoadingFormatki) {
    return (
      <Alert
        message="Pobieranie formatek..."
        description="Ładowanie dostępnych formatek z pozycji."
        type="info"
        showIcon
        icon={<InfoCircleOutlined spin />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // ========== PRZYPADEK: Pozycja bez formatek ==========
  if (!hasFormatki) {
    return (
      <>
        <Alert
          message="⚠️ Brak formatek w pozycji"
          description={`Pozycja ${pozycjaId} nie ma zdefiniowanych formatek lub wystąpił błąd podczas ich pobierania.`}
          type="warning"
          showIcon
          icon={<StopOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={onRefresh}>
              Odśwież
            </Button>
          }
        />
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Empty
            description="Ta pozycja nie ma formatek do zapaletyzowania"
          />
        </div>
      </>
    );
  }

  // ========== PRZYPADEK: Formatki bez planowanych ilości ==========
  if (!hasPlannedFormatki) {
    return (
      <>
        <Alert
          message="ℹ️ Brak planowanych formatek"
          description={`Pozycja ${pozycjaId} ma ${totalTypes} typów formatek, ale wszystkie mają planowaną ilość = 0.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={onRefresh}>
              Odśwież
            </Button>
          }
        />
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Empty
            description="Brak formatek z planowaną ilością > 0"
          />
        </div>
      </>
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
              valueStyle={{ 
                color: totalDostepne > 0 ? '#1890ff' : 
                       totalDostepne === 0 && totalPlanowane > 0 ? '#52c41a' : undefined 
              }}
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
            <Tag color={totalWPaletach > 0 ? "green" : "default"}>
              Na paletach: {totalTypes - availableTypes}
            </Tag>
            <Tag color={availableTypes > 0 ? "orange" : "default"}>
              Do przypisania: {availableTypes}
            </Tag>
          </Space>
        </div>
      </Card>

      {/* ========== PRZYPADEK: W pełni zapaletyzowane ========== */}
      {isFullyPalletized && (
        <Alert
          message="✅ Wszystkie formatki przypisane"
          description={
            <Space direction="vertical">
              <Text>
                Wszystkie {totalPlanowane} formatek z tej pozycji zostały już przypisane do palet.
              </Text>
              <Text type="secondary">
                Zapaletyzowano: {procentZapaletyzowania}% ({totalWPaletach}/{totalPlanowane} szt.)
              </Text>
            </Space>
          }
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
      )}

      {/* ========== PRZYPADEK: Dostępne formatki - sekcja akcji szybkich ========== */}
      {hasAvailableFormatki && (
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
                  description={`Zostanie utworzona pojedyncza paleta z ${totalDostepne} formatkami (${availableTypes} typów)`}
                  onConfirm={handleCreateAllRemaining}
                  okText="Utwórz"
                  cancelText="Anuluj"
                  disabled={totalDostepne === 0}
                >
                  <Button 
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    style={{ 
                      background: '#52c41a', 
                      borderColor: '#52c41a'
                    }}
                    disabled={totalDostepne === 0}
                  >
                    📦 Utwórz paletę ze wszystkimi
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Status formatek - informacyjny */}
      {!isFullyPalletized && hasAvailableFormatki && (
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
      
      {/* ========== KOMPONENT RĘCZNEGO TWORZENIA - tylko gdy są dostępne formatki ========== */}
      {hasAvailableFormatki ? (
        <ManualPalletCreator
          pozycjaId={pozycjaId}
          formatki={pozycjaFormatki}
          onSave={onSaveManualPallets}
          onRefresh={onRefresh}
          loading={loading}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Empty
            description="Brak dostępnych formatek do ręcznego zarządzania paletami"
          />
        </div>
      )}
    </>
  );
};