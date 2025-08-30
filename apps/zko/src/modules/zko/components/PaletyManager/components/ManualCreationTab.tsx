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
  Popconfirm
} from 'antd';
import { 
  PlusCircleOutlined,
  EditOutlined
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
  ilosc_w_paletach: number;
  ilosc_dostepna: number;
  czy_w_pelni_przypisana: boolean;
}

interface ManualCreationTabProps {
  pozycjaId?: number;
  pozycjaFormatki: PozycjaFormatka[];
  loading: boolean;
  onSaveManualPallets: (palety: any[]) => void;
  onCreateAllRemaining: (przeznaczenie?: string) => void;
}

export const ManualCreationTab: React.FC<ManualCreationTabProps> = ({
  pozycjaId,
  pozycjaFormatki,
  loading,
  onSaveManualPallets,
  onCreateAllRemaining
}) => {
  const totalAvailableFormatki = pozycjaFormatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0);
  const availableTypes = pozycjaFormatki.filter(f => f.ilosc_dostepna > 0).length;

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
      {/* Sekcja akcji szybkich */}
      {totalAvailableFormatki > 0 && (
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
                  Dostępnych {totalAvailableFormatki} formatek w {availableTypes} typach
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <Popconfirm
                  title="Utworzyć paletę ze wszystkimi pozostałymi formatkami?"
                  description={`Zostanie utworzona pojedyncza paleta z ${totalAvailableFormatki} formatkami`}
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
      ) : totalAvailableFormatki === 0 ? (
        <Alert
          message="✅ Wszystkie formatki przypisane"
          description="Wszystkie formatki z tej pozycji zostały już przypisane do palet."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          message={`📋 Dostępne formatki: ${totalAvailableFormatki} szt.`}
          description={`${availableTypes} typów formatek gotowych do przypisania do palet.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <ManualPalletCreator
        pozycjaId={pozycjaId}
        formatki={pozycjaFormatki}
        onSave={onSaveManualPallets}
        loading={loading}
      />
    </>
  );
};