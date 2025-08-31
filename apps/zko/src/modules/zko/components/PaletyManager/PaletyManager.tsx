import React, { useState, useEffect } from 'react';
import { 
  Card, 
  message, 
  Spin,
  Typography,
  Tabs,
  Space,
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
  PaletyTable,
  EditPaletaModal
} from './components';
import { LIMITY_PALETY } from './types';
import { usePaletyModular, usePaletyManager } from '../../hooks';

const { Text } = Typography;
const { TabPane } = Tabs;

interface PaletyManagerProps {
  zkoId: number;
  onRefresh?: () => void;
}

export const PaletyManager: React.FC<PaletyManagerProps> = ({ 
  zkoId, 
  onRefresh 
}) => {
  // State
  const [selectedPozycjaId, setSelectedPozycjaId] = useState<number | undefined>(undefined);
  const [selectedPaleta, setSelectedPaleta] = useState<any>(null);
  const [editingPaleta, setEditingPaleta] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [planowanieModalVisible, setPlanowanieModalVisible] = useState(false);
  const [planowanieModularneModalVisible, setPlanowanieModularneModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  // Hooks
  const {
    palety,
    pozycjaFormatki,
    podsumowanie,
    loading,
    deletingPaletaId,
    fetchPalety,
    fetchPozycjaFormatki,
    deletePaleta,
    deleteAllPalety,
    createAllRemainingPallet,
    saveManualPallets
  } = usePaletyManager(zkoId);

  const { 
    loading: modularLoading,
    error: modularError,
    planujModularnie,
    inteligentneZnalowanie
  } = usePaletyModular();

  // Effects
  useEffect(() => {
    fetchPalety();
  }, [zkoId, fetchPalety]);

  useEffect(() => {
    if (selectedPozycjaId) {
      fetchPozycjaFormatki(selectedPozycjaId);
    }
  }, [selectedPozycjaId, fetchPozycjaFormatki]);

  // Handlers
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
        message.success('Planowanie modulariczne zakończone pomyślnie!');
        setPlanowanieModularneModalVisible(false);
        fetchPalety();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error in modular planning:', error);
      message.error('Błąd planowania modularicznego V2');
    }
  };

  const handleViewDetails = (paleta: any) => {
    setSelectedPaleta(paleta);
    setDetailsModalVisible(true);
  };

  const handleEditPaleta = (paleta: any) => {
    // Znajdź pozycję dla tej palety
    const pozycjaId = paleta.pozycja_id || 
      (paleta.pozycje_lista ? parseInt(paleta.pozycje_lista.match(/\d+/)?.[0] || '0') : selectedPozycjaId);
    
    if (!pozycjaId) {
      message.warning('Nie można określić pozycji dla tej palety. Wybierz pozycję z listy.');
      return;
    }
    
    setSelectedPozycjaId(pozycjaId);
    setEditingPaleta(paleta);
    setEditModalVisible(true);
  };

  const handleDeletePaleta = (paletaId: number) => {
    deletePaleta(paletaId, () => {
      fetchPozycjaFormatki(selectedPozycjaId!);
      onRefresh?.();
    });
  };

  const handleDeleteAllPalety = () => {
    deleteAllPalety(() => {
      fetchPozycjaFormatki(selectedPozycjaId!);
      onRefresh?.();
    });
  };

  const handleCreateAllRemaining = (przeznaczenie: string) => {
    if (selectedPozycjaId) {
      createAllRemainingPallet(selectedPozycjaId, przeznaczenie, onRefresh);
    }
  };

  const handleSaveManualPallets = (manualPalety: any[]) => {
    if (selectedPozycjaId) {
      saveManualPallets(selectedPozycjaId, manualPalety, onRefresh);
    }
  };

  const totalAvailableFormatki = pozycjaFormatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0);

  return (
    <div style={{ width: '100%' }}>
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
        style={{ marginBottom: 16 }}
      >
        <PozycjaSelector
          zkoId={zkoId}
          selectedPozycjaId={selectedPozycjaId}
          onSelect={setSelectedPozycjaId}
          loading={loading}
        />
      </Card>

      {/* Tabela istniejących palet - FULL WIDTH */}
      {palety.length > 0 && (
        <Card 
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
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 0 }}
        >
          <PaletyTable
            palety={palety}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEditPaleta}
            onDelete={handleDeletePaleta}
            deletingId={deletingPaletaId}
          />
        </Card>
      )}

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

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
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
              onCreateAllRemaining={handleCreateAllRemaining}
            />
          </TabPane>

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
            />
          </TabPane>

          <TabPane 
            tab={<span><ToolOutlined /> Przeznaczenie palet</span>} 
            key="destination"
          >
            <DestinationTab palety={palety} />
          </TabPane>
        </Tabs>
      </Card>

      {/* Modale */}
      <EditPaletaModal
        visible={editModalVisible}
        paletaId={editingPaleta?.id}
        pozycjaId={selectedPozycjaId}
        onClose={() => {
          setEditModalVisible(false);
          setEditingPaleta(null);
        }}
        onSave={() => {
          fetchPalety();
          if (selectedPozycjaId) {
            fetchPozycjaFormatki(selectedPozycjaId);
          }
        }}
      />

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
    </div>
  );
};