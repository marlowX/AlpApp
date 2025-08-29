import React, { useMemo } from 'react';
import { Alert, Card, Space, Button, Typography, Divider, Badge } from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined,
  BgColorsOutlined,
  WarningOutlined,
  ExpandOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { KolorePlytyTable } from '../KolorePlytyTable';
import { WymiaryInfo } from '../components/WymiaryInfo';
import type { KolorPlyty, Plyta, Rozkroj } from '../types';
import { Tag } from 'antd';

const { Text } = Typography;

interface Step2PlytyProps {
  kolorePlyty: KolorPlyty[];
  setKolorePlyty: (value: KolorPlyty[]) => void;
  plyty: Plyta[];
  plytyLoading: boolean;
  onUpdateKolor: (index: number, field: string, value: any) => void;
  selectedRozkroj: Rozkroj | null;
}

// Podkomponent dla informacji o rozkroju
const RozkrojInfo: React.FC<{
  rozkroj: Rozkroj;
  hasAnySelected: boolean;
  totalPlyty: number;
  totalFormatki: number;
}> = ({ rozkroj, hasAnySelected, totalPlyty, totalFormatki }) => (
  <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }} bordered>
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Text strong style={{ fontSize: '16px' }}>
          Wybrany rozkrój: {rozkroj.kod_rozkroju}
        </Text>
        {rozkroj.rozmiar_plyty && (
          <Tag color="blue" icon={<ExpandOutlined />}>
            {rozkroj.rozmiar_plyty}
          </Tag>
        )}
      </Space>
      <Text type="secondary">{rozkroj.opis}</Text>
      <Space split={<Divider type="vertical" />}>
        <Text>
          <InfoCircleOutlined /> Formatek w rozkroju: {rozkroj.formatki.length}
        </Text>
        {hasAnySelected && (
          <>
            <Text>
              <BgColorsOutlined /> Łącznie płyt: <strong>{totalPlyty}</strong>
            </Text>
            <Text>
              Formatek do produkcji: <strong>{totalFormatki}</strong>
            </Text>
          </>
        )}
      </Space>
    </Space>
  </Card>
);

// Komponent dla alertu o limicie płyt w pozycji
const LimitPozycjiAlert: React.FC<{
  totalPlyty: number;
  maxPlytNaPozycje: number;
}> = ({ totalPlyty, maxPlytNaPozycje }) => {
  const przekroczonyLimit = totalPlyty > maxPlytNaPozycje;
  
  return (
    <Alert
      message={
        <Space>
          <ExclamationCircleOutlined />
          <Text strong>Limit płyt w pozycji</Text>
          <Badge 
            count={`${totalPlyty}/${maxPlytNaPozycje}`}
            style={{ 
              backgroundColor: przekroczonyLimit ? '#ff4d4f' : '#52c41a',
              fontSize: '14px',
              padding: '0 8px'
            }}
          />
        </Space>
      }
      description={
        <Space direction="vertical">
          <Text>
            W jednej pozycji rozkroju może być maksymalnie <strong>{maxPlytNaPozycje} płyt łącznie</strong>.
          </Text>
          {przekroczonyLimit && (
            <Text type="danger" strong>
              ⚠️ Przekroczono limit! Zmniejsz ilość płyt o {totalPlyty - maxPlytNaPozycje} sztuk.
            </Text>
          )}
          <Text type="secondary">
            Przykład: 2 płyty CZARNE + 3 płyty SONOMA = 5 płyt (OK)
          </Text>
        </Space>
      }
      type={przekroczonyLimit ? "error" : "info"}
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};

// Podkomponent dla alertów
const PlytyAlerts: React.FC<{
  hasAnySelected: boolean;
  maRozneWymiary: boolean;
  totalPlyty: number;
  maxPlytNaPozycje: number;
}> = ({ hasAnySelected, maRozneWymiary, totalPlyty, maxPlytNaPozycje }) => {
  const przekroczonyLimit = totalPlyty > maxPlytNaPozycje;
  
  return (
    <>
      {!hasAnySelected && (
        <Alert
          message="Wybierz przynajmniej jedną płytę"
          description="Musisz dodać co najmniej jedną płytę aby kontynuować"
          type="warning"
          style={{ marginTop: 16 }}
        />
      )}

      {przekroczonyLimit && (
        <Alert
          message="BŁĄD: Za dużo płyt w pozycji!"
          description={
            <Space direction="vertical">
              <Text strong>
                Suma wszystkich płyt ({totalPlyty}) przekracza limit {maxPlytNaPozycje} sztuk na pozycję.
              </Text>
              <Text>Zmniejsz ilość płyt o {totalPlyty - maxPlytNaPozycje} sztuk aby kontynuować.</Text>
            </Space>
          }
          type="error"
          icon={<ExclamationCircleOutlined />}
          style={{ marginTop: 16 }}
          showIcon
        />
      )}

      {maRozneWymiary && (
        <Alert
          message="Różne wymiary płyt"
          description={
            <Space direction="vertical">
              <Text>Wybrałeś płyty o różnych wymiarach. Upewnij się że:</Text>
              <div>• Rozkrój jest uniwersalny dla wszystkich wymiarów</div>
              <div>• Maszyna jest przygotowana na zmianę formatu</div>
              <div>• Operator został poinformowany o zmianie wymiarów</div>
            </Space>
          }
          type="warning"
          icon={<WarningOutlined />}
          style={{ marginTop: 16 }}
          showIcon
        />
      )}

      <Alert
        message="Zasady limitów płyt"
        description={
          <Space direction="vertical" size="small">
            <div>
              <strong>• LIMIT GŁÓWNY: maksymalnie 5 płyt ŁĄCZNIE w jednej pozycji</strong>
            </div>
            <div>• Przykład OK: 2 płyty kolor A + 3 płyty kolor B = 5 płyt ✓</div>
            <div>• Przykład BŁĄD: 3 płyty kolor A + 3 płyty kolor B = 6 płyt ✗</div>
            <Divider style={{ margin: '8px 0' }} />
            <div>• Płyty ≥18mm: dodatkowe ograniczenie do 5 sztuk per kolor</div>
            <div>• System automatycznie sprawdza dostępność magazynową</div>
            <div>• Wymiary płyt są weryfikowane z rozkrojem</div>
          </Space>
        }
        type="info"
        style={{ marginTop: 16 }}
      />
    </>
  );
};

export const Step2Plyty: React.FC<Step2PlytyProps> = ({
  kolorePlyty,
  setKolorePlyty,
  plyty,
  plytyLoading,
  onUpdateKolor,
  selectedRozkroj
}) => {
  // Stała dla maksymalnej liczby płyt w pozycji
  const MAX_PLYT_NA_POZYCJE = 5;
  
  const addKolorPlyty = () => {
    setKolorePlyty([...kolorePlyty, { kolor: '', nazwa: '', ilosc: 1 }]);
  };

  const removeKolorPlyty = (index: number) => {
    if (kolorePlyty.length > 1) {
      setKolorePlyty(kolorePlyty.filter((_, i) => i !== index));
    }
  };

  const hasAnySelected = kolorePlyty.some(k => k.kolor);
  
  // WAŻNE: Suma WSZYSTKICH płyt w pozycji
  const totalPlyty = kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  
  const totalFormatki = selectedRozkroj ? 
    kolorePlyty.reduce((total, kolor) => {
      if (!kolor.kolor) return total;
      return total + selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
    }, 0) : 0;

  const maRozneWymiary = useMemo(() => {
    const wybranePlyty = kolorePlyty
      .filter(k => k.kolor)
      .map(k => plyty.find(p => p.kolor_nazwa === k.kolor))
      .filter(Boolean) as Plyta[];
    
    if (wybranePlyty.length <= 1) return false;
    
    const pierwszyRozmiar = `${wybranePlyty[0].dlugosc}x${wybranePlyty[0].szerokosc}`;
    return wybranePlyty.some(p => `${p.dlugosc}x${p.szerokosc}` !== pierwszyRozmiar);
  }, [kolorePlyty, plyty]);

  // Sprawdź czy przekroczono limit
  const przekroczonyLimit = totalPlyty > MAX_PLYT_NA_POZYCJE;

  return (
    <div>
      <Alert
        message="Krok 2: Wybór płyt do rozkroju"
        description="Dodaj płyty które będą pocięte według wybranego rozkroju. UWAGA: Maksymalnie 5 płyt łącznie w jednej pozycji!"
        type="info"
        showIcon
        icon={<BgColorsOutlined />}
        style={{ marginBottom: 24 }}
      />

      {selectedRozkroj && (
        <RozkrojInfo 
          rozkroj={selectedRozkroj}
          hasAnySelected={hasAnySelected}
          totalPlyty={totalPlyty}
          totalFormatki={totalFormatki}
        />
      )}

      {/* Alert o limicie płyt */}
      {hasAnySelected && (
        <LimitPozycjiAlert 
          totalPlyty={totalPlyty}
          maxPlytNaPozycje={MAX_PLYT_NA_POZYCJE}
        />
      )}

      {hasAnySelected && (
        <WymiaryInfo 
          plyty={plyty}
          kolorePlyty={kolorePlyty}
          rozkroj={selectedRozkroj}
        />
      )}

      <KolorePlytyTable
        kolorePlyty={kolorePlyty}
        plyty={plyty}
        plytyLoading={plytyLoading}
        searchText=""
        onSearchChange={() => {}}
        onUpdateKolor={onUpdateKolor}
        onRemoveKolor={removeKolorPlyty}
        maxPlytNaPozycje={MAX_PLYT_NA_POZYCJE} // Przekazujemy limit
      />

      <Button
        type="dashed"
        onClick={addKolorPlyty}
        icon={<PlusOutlined />}
        style={{ width: '100%', marginTop: 16 }}
        size="large"
        disabled={przekroczonyLimit} // Blokuj dodawanie gdy przekroczono limit
      >
        Dodaj kolejny kolor płyty
      </Button>

      <PlytyAlerts 
        hasAnySelected={hasAnySelected}
        maRozneWymiary={maRozneWymiary}
        totalPlyty={totalPlyty}
        maxPlytNaPozycje={MAX_PLYT_NA_POZYCJE}
      />
    </div>
  );
};