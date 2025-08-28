import React from 'react';
import { Alert, Card, Space, Button, Typography, Empty } from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined,
  BgColorsOutlined 
} from '@ant-design/icons';
import { KolorePlytyTable } from '../KolorePlytyTable';
import type { KolorPlyty, Plyta, Rozkroj } from '../types';

const { Text } = Typography;

interface Step2PlytyProps {
  kolorePlyty: KolorPlyty[];
  setKolorePlyty: (value: KolorPlyty[]) => void;
  plyty: Plyta[];
  plytyLoading: boolean;
  onUpdateKolor: (index: number, field: string, value: any) => void;
  selectedRozkroj: Rozkroj | null;
}

export const Step2Plyty: React.FC<Step2PlytyProps> = ({
  kolorePlyty,
  setKolorePlyty,
  plyty,
  plytyLoading,
  onUpdateKolor,
  selectedRozkroj
}) => {
  const addKolorPlyty = () => {
    setKolorePlyty([...kolorePlyty, { kolor: '', nazwa: '', ilosc: 1 }]);
  };

  const removeKolorPlyty = (index: number) => {
    if (kolorePlyty.length > 1) {
      setKolorePlyty(kolorePlyty.filter((_, i) => i !== index));
    }
  };

  const hasAnySelected = kolorePlyty.some(k => k.kolor);
  const totalPlyty = kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  const totalFormatki = selectedRozkroj ? 
    kolorePlyty.reduce((total, kolor) => {
      if (!kolor.kolor) return total;
      return total + selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
    }, 0) : 0;

  return (
    <div>
      <Alert
        message="Krok 2: Wybór płyt do rozkroju"
        description="Dodaj płyty które będą pocięte według wybranego rozkroju. Możesz dodać wiele kolorów płyt."
        type="info"
        showIcon
        icon={<BgColorsOutlined />}
        style={{ marginBottom: 24 }}
      />

      {selectedRozkroj && (
        <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Wybrany rozkrój: {selectedRozkroj.kod_rozkroju}</Text>
            <Text type="secondary">{selectedRozkroj.opis}</Text>
            <Space>
              <Text>Formatek w rozkroju: {selectedRozkroj.formatki.length}</Text>
              {hasAnySelected && (
                <>
                  <Text>• Łącznie płyt: {totalPlyty}</Text>
                  <Text>• Formatek do produkcji: {totalFormatki}</Text>
                </>
              )}
            </Space>
          </Space>
        </Card>
      )}

      <KolorePlytyTable
        kolorePlyty={kolorePlyty}
        plyty={plyty}
        plytyLoading={plytyLoading}
        searchText=""
        onSearchChange={() => {}}
        onUpdateKolor={onUpdateKolor}
        onRemoveKolor={removeKolorPlyty}
      />

      <Button
        type="dashed"
        onClick={addKolorPlyty}
        icon={<PlusOutlined />}
        style={{ width: '100%', marginTop: 16 }}
        size="large"
      >
        Dodaj kolejny kolor płyty
      </Button>

      {!hasAnySelected && (
        <Alert
          message="Wybierz przynajmniej jedną płytę"
          description="Musisz dodać co najmniej jedną płytę aby kontynuować"
          type="warning"
          style={{ marginTop: 16 }}
        />
      )}

      <Alert
        message="Limity płyt"
        description={
          <Space direction="vertical" size="small">
            <div>• Płyty ≥18mm: maksymalnie 5 sztuk w pozycji</div>
            <div>• Płyty &lt;18mm: maksymalnie 50 sztuk w pozycji</div>
            <div>• System automatycznie sprawdza dostępność magazynową</div>
          </Space>
        }
        type="info"
        style={{ marginTop: 16 }}
      />
    </div>
  );
};
