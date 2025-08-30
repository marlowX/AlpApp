import React, { useState, useEffect } from 'react';
import { 
  Card, 
  message, 
  Spin,
  Typography,
  Tabs,
  Space,
  Tooltip,
  Button,
  Popconfirm,
  Badge,
  Empty
} from 'antd';
import { 
  AppstoreOutlined, 
  ThunderboltOutlined,
  EditOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  ClearOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { PaletaDetails } from './PaletaDetails';
import { 
  PlanowanieModal, 
  PlanowanieModularneModal,
  PozycjaSelector,
  AutomaticPlanningTab,
  ManualCreationTab,
  DestinationTab,
  PaletyTable
} from './components';
import { LIMITY_PALETY, MESSAGES } from './types';
import { usePaletyModular } from '../../hooks';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface FormatkaDetail {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  kolor: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: FormatkaDetail[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  przeznaczenie?: string;
}

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

interface PaletyManagerProps {
  zkoId: number;
  onRefresh?: () => void;
}

export const PaletyManager: React.FC<PaletyManagerProps> = ({ 
  zkoId, 
  onRefresh 
}) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [pozycjaFormatki, setPozycjaFormatki] = useState<PozycjaFormatka[]>([]);
  const [selectedPozycjaId, setSelectedPozycjaId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [deletingPaletaId, setDeletingPaletaId] = useState<number | null>(null);
  const [selectedPaleta, setSelectedPaleta] = useState<Paleta | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [planowanieModalVisible, setPlanowanieModalVisible] = useState(false);
  const [planowanieModularneModalVisible, setPlanowanieModularneModalVisible] = useState(false);
  const [podsumowanie, setPodsumowanie] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('manual'); // Domyślnie ręczne tworzenie

  const { 
    loading: modularLoading,
    error: modularError,
    planujModularnie,
    inteligentneZnalowanie
  } = usePaletyModular();

  useEffect(() => {
    fetchPalety();
  }, [zkoId]);

  useEffect(() => {
    if (selectedPozycjaId) {
      fetchPozycjaFormatki();
    } else {
      setPozycjaFormatki([]);
    }
  }, [selectedPozycjaId]);

  const fetchPalety = async () => {
    try {
      setLoading(true);
      
      let response = await fetch(`/api/pallets/zko/${zkoId}/details`);
      
      if (!response.ok) {
        response = await fetch(`/api/pallets/zko/${zkoId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        
        const mappedPalety = (data.palety || []).map((p: any) => ({
          ...p,
          ilosc_formatek: p.sztuk_total || p.ilosc_formatek || 0,
          procent_wykorzystania: p.sztuk_total 
            ? Math.round((p.sztuk_total / LIMITY_PALETY.DOMYSLNE_FORMATEK) * 100)
            : p.procent_wykorzystania || 0
        }));
        
        setPalety(mappedPalety);
        setPodsumowanie(data.podsumowanie);
      } else {
        const error = await response.json();
        message.error(error.error || MESSAGES.PLAN_ERROR);
      }
    } catch (error) {
      console.error('Error fetching palety:', error);
      message.error(MESSAGES.PLAN_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const fetchPozycjaFormatki = async () => {
    if (!selectedPozycjaId) return;
    
    try {
      const response = await fetch(`/api/pallets/position/${selectedPozycjaId}/available-formatki`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.sukces) {
          const mappedFormatki = data.formatki.map((f: any) => ({
            id: f.id,
            nazwa: f.nazwa,
            dlugosc: Number(f.dlugosc),
            szerokosc: Number(f.szerokosc),
            grubosc: Number(f.grubosc),
            kolor: f.kolor,
            ilosc_planowana: f.ilosc_dostepna,
            waga_sztuka: Number(f.waga_sztuka),
            ilosc_w_paletach: f.ilosc_w_paletach,
            ilosc_dostepna: f.ilosc_dostepna,
            czy_w_pelni_przypisana: f.czy_w_pelni_przypisana
          }));
          
          setPozycjaFormatki(mappedFormatki);
        } else {
          message.error(data.error || 'Błąd pobierania formatek');
        }
      } else {
        message.error('Błąd komunikacji z serwerem');
      }
    } catch (error) {
      console.error('Error fetching pozycja formatki:', error);
      message.error('Błąd pobierania formatek z pozycji');
    }
  };

  const handleDeletePaleta = async (paletaId: number) => {
    try {
      setDeletingPaletaId(paletaId);
      
      const response = await fetch(`/api/pallets/${paletaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Paleta została usunięta');
        await fetchPalety();
        await fetchPozycjaFormatki();
        onRefresh?.();
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd usuwania palety');
      }
    } catch (error) {
      console.error('Error deleting paleta:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setDeletingPaletaId(null);
    }
  };

  const handleDeleteAllPalety = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/clear`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`Usunięto ${data.usuniete} palet`);
        await fetchPalety();
        await fetchPozycjaFormatki();
        onRefresh?.();
      } else {
        message.error(data.error || 'Błąd usuwania palet');
      }
    } catch (error) {
      console.error('Error deleting all pallets:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllRemainingPallet = async (przeznaczenie: string = 'MAGAZYN') => {
    if (!selectedPozycjaId) {
      message.error('Brak ID pozycji');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/pallets/manual/create-all-remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: selectedPozycjaId,
          przeznaczenie,
          operator: 'user'
        }),
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`✅ Utworzono paletę ${data.numer_palety} ze wszystkimi pozostałymi formatkami (${data.total_sztuk} szt.)!`);
        await fetchPalety();
        await fetchPozycjaFormatki();
        onRefresh?.();
      } else {
        message.error(data.error || 'Błąd tworzenia palety');
      }
    } catch (error) {
      console.error('Error creating all-remaining pallet:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualPallets = async (manualPalety: any[]) => {
    if (!selectedPozycjaId) {
      message.error('Brak ID pozycji - nie można zapisać palet');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/pallets/manual/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: selectedPozycjaId,
          palety: manualPalety.map(paleta => ({
            formatki: paleta.formatki,
            przeznaczenie: paleta.przeznaczenie,
            max_waga: paleta.max_waga,
            max_wysokosc: paleta.max_wysokosc,
            operator: 'user',
            uwagi: paleta.uwagi || null
          }))
        }),
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`✅ Zapisano ${data.palety_utworzone.length} palet do bazy danych!`);
        await fetchPalety();
        await fetchPozycjaFormatki();
        onRefresh?.();
      } else {
        message.error(data.error || 'Błąd zapisywania palet do bazy danych');
      }
    } catch (error) {
      console.error('Error saving manual pallets:', error);
      message.error('Błąd komunikacji z serwerem podczas zapisywania palet');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPlanning = async () => {
    const result = await inteligentneZnalowanie(zkoId, {
      max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
      max_formatek_na_palete: 80,
      operator: 'user'
    });
    if (result) {
      message.success('Planowanie zakończone');
      fetchPalety();
    }
  };

  const handlePlanujModularnieModal = async (params: any) => {
    try {
      const result = await planujModularnie(zkoId, params);
      if (result) {
        message.success('Planowanie modularyczne zakończone pomyślnie!');
        setPlanowanieModularneModalVisible(false);
        fetchPalety();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error in modular planning:', error);
      message.error('Błąd planowania modularicznego V2');
    }
  };

  const handleViewDetails = (paleta: Paleta) => {
    setSelectedPaleta(paleta);
    setDetailsModalVisible(true);
  };

  const renderFormatkiDetails = (paleta: Paleta) => {
    if (!paleta.formatki_szczegoly || paleta.formatki_szczegoly.length === 0) {
      return <Text type="secondary">Brak formatek</Text>;
    }

    return (
      <Tooltip
        title={
          <div>
            {paleta.formatki_szczegoly.map((f: FormatkaDetail) => (
              <div key={f.formatka_id}>
                {f.nazwa}: {f.ilosc} szt.
              </div>
            ))}
          </div>
        }
      >
        <Space direction="vertical" size={0}>
          <Text strong>{paleta.sztuk_total || paleta.ilosc_formatek} szt.</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {paleta.formatki_szczegoly.length} typów
          </Text>
        </Space>
      </Tooltip>
    );
  };

  const totalAvailableFormatki = pozycjaFormatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0);

  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Zarządzanie paletami</Text>
          {palety.length > 0 && (
            <Badge count={palety.length} style={{ backgroundColor: '#52c41a' }} />
          )}
          {(loading || modularLoading) && <Spin size="small" />}
        </Space>
      }
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchPalety}
            loading={loading}
          >
            Odśwież
          </Button>
          {palety.length > 0 && (
            <Popconfirm
              title="Czy na pewno usunąć wszystkie palety?"
              description={`Zostanie usuniętych ${palety.length} palet`}
              onConfirm={handleDeleteAllPalety}
              okText="Usuń wszystkie"
              cancelText="Anuluj"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger
                icon={<ClearOutlined />}
                loading={loading}
              >
                Usuń wszystkie palety
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      {/* Selektor pozycji */}
      <PozycjaSelector
        zkoId={zkoId}
        selectedPozycjaId={selectedPozycjaId}
        onSelect={setSelectedPozycjaId}
        loading={loading}
      />

      {/* Lista istniejących palet - zawsze widoczna */}
      {palety.length > 0 && (
        <Card 
          size="small" 
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <Text strong>Istniejące palety ({palety.length})</Text>
              {podsumowanie && (
                <Text type="secondary">
                  {podsumowanie.sztuk_total} szt. | {podsumowanie.waga_total?.toFixed(2)} kg
                </Text>
              )}
            </Space>
          }
        >
          <PaletyTable
            palety={palety}
            loading={loading}
            onViewDetails={handleViewDetails}
            renderFormatkiColumn={renderFormatkiDetails}
            onDelete={handleDeletePaleta}
            deletingId={deletingPaletaId}
          />
        </Card>
      )}

      {/* Jeśli nie ma palet, pokaż informację */}
      {palety.length === 0 && !loading && (
        <Empty
          description="Brak palet w tym ZKO"
          style={{ marginBottom: 16 }}
        >
          <Text type="secondary">
            Użyj zakładki "Ręczne tworzenie" aby dodać palety
          </Text>
        </Empty>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Zakładka ręcznego tworzenia - PIERWSZA */}
        <TabPane 
          tab={
            <span>
              <EditOutlined />
              Ręczne tworzenie
              {totalAvailableFormatki > 0 && (
                <span style={{ 
                  backgroundColor: '#52c41a', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: '10px',
                  fontSize: '10px',
                  marginLeft: '8px'
                }}>
                  {totalAvailableFormatki}
                </span>
              )}
            </span>
          } 
          key="manual"
        >
          <ManualCreationTab
            pozycjaId={selectedPozycjaId}
            pozycjaFormatki={pozycjaFormatki}
            loading={loading}
            onSaveManualPallets={handleSaveManualPallets}
            onCreateAllRemaining={handleCreateAllRemainingPallet}
          />
        </TabPane>

        {/* Zakładka automatycznego planowania - jako dodatek */}
        <TabPane 
          tab={<span><ThunderboltOutlined /> Planowanie automatyczne (testy)</span>} 
          key="auto"
        >
          <AutomaticPlanningTab
            palety={palety}
            loading={loading}
            modularLoading={modularLoading}
            modularError={modularError}
            podsumowanie={podsumowanie}
            onRefresh={fetchPalety}
            onViewDetails={handleViewDetails}
            onShowPlanningModal={() => setPlanowanieModalVisible(true)}
            onShowModularModal={() => setPlanowanieModularneModalVisible(true)}
            onQuickPlanning={handleQuickPlanning}
            renderFormatkiColumn={renderFormatkiDetails}
          />
        </TabPane>

        {/* Zakładka przeznaczenia */}
        <TabPane 
          tab={<span><ToolOutlined /> Przeznaczenie palet</span>} 
          key="destination"
        >
          <DestinationTab palety={palety} />
        </TabPane>
      </Tabs>

      {/* Modale */}
      {planowanieModalVisible && (
        <PlanowanieModal
          visible={planowanieModalVisible}
          loading={loading}
          initialValues={{
            max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
            max_waga_kg: LIMITY_PALETY.DOMYSLNA_WAGA_KG,
            max_formatek_na_palete: 200,
            grubosc_plyty: LIMITY_PALETY.GRUBOSC_PLYTY_DEFAULT,
            strategia: 'inteligentna',
            typ_palety: 'EURO',
            uwzglednij_oklejanie: true
          }}
          onCancel={() => setPlanowanieModalVisible(false)}
          onOk={async (params) => {
            setPlanowanieModalVisible(false);
            message.info('Planowanie V5 - funkcja do implementacji');
          }}
        />
      )}

      <PlanowanieModularneModal
        visible={planowanieModularneModalVisible}
        loading={modularLoading}
        initialValues={{
          max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
          max_formatek_na_palete: 80,
          nadpisz_istniejace: false,
          operator: 'user'
        }}
        onCancel={() => setPlanowanieModularneModalVisible(false)}
        onOk={handlePlanujModularnieModal}
      />

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