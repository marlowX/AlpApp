import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Modal, 
  InputNumber, 
  message, 
  Alert,
  Spin,
  Typography
} from 'antd';
import { 
  AppstoreOutlined, 
  PlusOutlined, 
  MinusOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { PaletaPrzeniesFormatki } from './PaletaPrzeniesFormatki';
import { PaletaDetails } from './PaletaDetails';
import { PaletyStats } from './components/PaletyStats';
import { PaletyTable } from './components/PaletyTable';
import { PlanowanieModal, PlanowaniePaletParams } from './components/PlanowanieModal';
import { LIMITY_PALETY } from './types';

const { Text } = Typography;

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  ilosc_formatek: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids: number[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
}

interface PaletyManagerProps {
  zkoId: number;
  onRefresh?: () => void;
}

export const PaletyManager: React.FC<PaletyManagerProps> = ({ 
  zkoId, 
  onRefresh 
}) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaleta, setSelectedPaleta] = useState<Paleta | null>(null);
  const [przeniesModalVisible, setPrzeniesModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [planowanieModalVisible, setPlanowanieModalVisible] = useState(false);
  const [sourcePaleta, setSourcePaleta] = useState<Paleta | null>(null);
  const [targetPaleta, setTargetPaleta] = useState<Paleta | null>(null);
  
  const [planParams] = useState<PlanowaniePaletParams>({
    max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
    max_waga_kg: LIMITY_PALETY.DOMYSLNA_WAGA_KG,
    max_formatek_na_palete: 200,
    grubosc_plyty: LIMITY_PALETY.GRUBOSC_PLYTY_DEFAULT,
    strategia: 'kolor',
    typ_palety: 'EURO',
    uwzglednij_oklejanie: false
  });

  useEffect(() => {
    fetchPalety();
  }, [zkoId]);

  const fetchPalety = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pallets/zko/${zkoId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPalety(data.palety || []);
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd pobierania palet');
      }
    } catch (error) {
      console.error('Error fetching palety:', error);
      message.error('Błąd pobierania palet');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanujPalety = async (params: PlanowaniePaletParams) => {
    try {
      setLoading(true);
      
      // Walidacja wagi
      if (!params.max_waga_kg || params.max_waga_kg < LIMITY_PALETY.MIN_WAGA_KG) {
        message.error('Maksymalna waga musi być podana i większa niż ' + LIMITY_PALETY.MIN_WAGA_KG + ' kg');
        return;
      }
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Zaplanowano palety');
          setPlanowanieModalVisible(false);
          fetchPalety();
          onRefresh?.();
        } else {
          message.warning(result.komunikat || 'Nie udało się zaplanować palet');
        }
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd planowania palet');
      }
    } catch (error) {
      console.error('Error planning palety:', error);
      message.error('Błąd planowania palet');
    } finally {
      setLoading(false);
    }
  };

  const handleZmienIloscPalet = () => {
    let newCount = palety.length || 1;
    
    Modal.confirm({
      title: 'Zmień ilość palet',
      content: (
        <div>
          <Text>Obecna ilość palet: <strong>{palety.length}</strong></Text>
          <br /><br />
          <Text>Nowa ilość:</Text>
          <InputNumber 
            min={1} 
            max={50} 
            defaultValue={palety.length || 1}
            onChange={(value) => {
              newCount = value || palety.length || 1;
            }}
            style={{ width: '100%', marginTop: 8 }}
          />
          <br /><br />
          <Alert
            message="Uwaga"
            description="Zmiana ilości palet spowoduje reorganizację formatek."
            type="warning"
            showIcon
          />
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/pallets/zko/${zkoId}/change-quantity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nowa_ilosc: newCount })
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.sukces) {
              message.success(result.komunikat || 'Zmieniono ilość palet');
              fetchPalety();
              onRefresh?.();
            } else {
              message.warning(result.komunikat || 'Nie udało się zmienić ilości palet');
            }
          } else {
            const error = await response.json();
            message.error(error.error || 'Błąd zmiany ilości palet');
          }
        } catch (error) {
          console.error('Error changing pallet quantity:', error);
          message.error('Błąd zmiany ilości palet');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePrzeniesFormatki = (source: Paleta) => {
    const otherPalety = palety.filter(p => p.id !== source.id);
    if (otherPalety.length === 0) {
      message.warning('Brak innych palet do przeniesienia formatek');
      return;
    }
    
    setSourcePaleta(source);
    setTargetPaleta(otherPalety[0]);
    setPrzeniesModalVisible(true);
  };

  const handleZamknijPalete = async (paletaId: number) => {
    try {
      const response = await fetch(`/api/pallets/${paletaId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: 'system',
          uwagi: 'Zamknięcie palety z poziomu aplikacji'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || 'Zamknięto paletę');
          fetchPalety();
        } else {
          message.warning(result.komunikat || 'Nie udało się zamknąć palety');
        }
      }
    } catch (error) {
      console.error('Error closing pallet:', error);
      message.error('Błąd zamykania palety');
    }
  };

  const handleViewDetails = (paleta: Paleta) => {
    setSelectedPaleta(paleta);
    setDetailsModalVisible(true);
  };

  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Zarządzanie paletami</Text>
          {loading && <Spin size="small" />}
        </Space>
      }
      extra={
        <Space>
          <Button 
            onClick={() => setPlanowanieModalVisible(true)}
            icon={<SettingOutlined />}
            type="primary"
            loading={loading}
          >
            Planuj automatycznie
          </Button>
          <Button 
            onClick={handleZmienIloscPalet}
            icon={palety.length > 0 ? <MinusOutlined /> : <PlusOutlined />}
            disabled={loading}
          >
            Zmień ilość
          </Button>
          <Button 
            onClick={fetchPalety}
            icon={<ReloadOutlined />}
            loading={loading}
          >
            Odśwież
          </Button>
        </Space>
      }
    >
      {palety.length === 0 ? (
        <Alert
          message="Brak palet"
          description={
            <div>
              <p>Palety zostaną utworzone automatycznie po dodaniu pozycji do ZKO.</p>
              <p>Możesz też utworzyć je ręcznie klikając "Planuj automatycznie".</p>
            </div>
          }
          type="info"
          showIcon
          action={
            <Space direction="vertical">
              <Button 
                onClick={() => setPlanowanieModalVisible(true)} 
                type="primary"
                loading={loading}
              >
                Utwórz palety
              </Button>
            </Space>
          }
        />
      ) : (
        <>
          <PaletyStats palety={palety} />
          <PaletyTable
            palety={palety}
            loading={loading}
            onViewDetails={handleViewDetails}
            onTransferFormatki={handlePrzeniesFormatki}
            onClosePaleta={handleZamknijPalete}
          />
        </>
      )}

      {/* Modale */}
      <PlanowanieModal
        visible={planowanieModalVisible}
        loading={loading}
        initialValues={planParams}
        onCancel={() => setPlanowanieModalVisible(false)}
        onOk={handlePlanujPalety}
      />

      {sourcePaleta && targetPaleta && (
        <PaletaPrzeniesFormatki
          visible={przeniesModalVisible}
          sourcePaleta={sourcePaleta}
          targetPaleta={targetPaleta}
          palety={palety}
          onClose={() => {
            setPrzeniesModalVisible(false);
            setSourcePaleta(null);
            setTargetPaleta(null);
          }}
          onSuccess={() => {
            setPrzeniesModalVisible(false);
            setSourcePaleta(null);
            setTargetPaleta(null);
            fetchPalety();
            onRefresh?.();
          }}
        />
      )}

      {selectedPaleta && (
        <PaletaDetails
          visible={detailsModalVisible}
          paleta={selectedPaleta}
          onClose={() => {
            setDetailsModalVisible(false);
            setSelectedPaleta(null);
          }}
        />
      )}
    </Card>
  );
};