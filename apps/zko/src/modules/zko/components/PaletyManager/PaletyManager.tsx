/**
 * @fileoverview PaletyManager - Główny kontener zarządzania paletami
 * @module PaletyManager
 * 
 * UWAGA: To jest TYLKO kontener przyjmujący podkomponenty!
 * =====================================================
 * Ten plik służy wyłącznie do:
 * - Koordynacji podkomponentów
 * - Zarządzania stanem głównym
 * - Przekazywania props do podkomponentów
 * 
 * NIE DODAWAJ tutaj logiki biznesowej ani UI!
 * 
 * Wszystkie podkomponenty znajdują się w:
 * D:\PROJEKTY\PROGRAMOWANIE\AlpApp\apps\zko\src\modules\zko\components\PaletyManager\components
 * 
 * Zasady:
 * - Maksymalnie 300 linii kodu
 * - Tylko import i użycie podkomponentów
 * - Logika biznesowa w hooks (usePaletyManager, usePaletyModular)
 * - UI w podkomponentach z katalogu components/
 */

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

// IMPORT PODKOMPONENTÓW - wszystkie UI elementy są tutaj
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

/**
 * PaletyManager - Główny kontener
 * 
 * TYLKO koordynuje podkomponenty z katalogu components/
 * NIE zawiera własnej logiki UI ani biznesowej
 */
export const PaletyManager: React.FC<PaletyManagerProps> = ({
  zkoId,
  onRefresh
}) => {
  // ========== STATE - tylko do koordynacji podkomponentów ==========
  const [selectedPozycjaId, setSelectedPozycjaId] = useState<number | undefined>(undefined);
  const [selectedPaleta, setSelectedPaleta] = useState<any>(null);
  const [editingPaleta, setEditingPaleta] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [planowanieModalVisible, setPlanowanieModalVisible] = useState(false);
  const [planowanieModularneModalVisible, setPlanowanieModularneModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  // ========== HOOKS - cała logika biznesowa jest tutaj ==========
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

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchPalety();
  }, [zkoId, fetchPalety]);

  useEffect(() => {
    if (selectedPozycjaId) {
      fetchPozycjaFormatki(selectedPozycjaId);
    }
  }, [selectedPozycjaId, fetchPozycjaFormatki]);

  // ========== HANDLERS - tylko przekazywanie do hooków ==========
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
    console.log('Editing paleta:', paleta);
    
    // Próbuj znaleźć pozycja_id w różnych miejscach
    let pozycjaId = paleta.pozycja_id;
    
    // Jeśli nie ma pozycja_id, spróbuj wyciągnąć z pozycje_lista
    if (!pozycjaId && paleta.pozycje_lista) {
      // Parsuj "Poz.72" -> 72
      const match = paleta.pozycje_lista.match(/Poz\.(\d+)/);
      if (match) {
        pozycjaId = parseInt(match[1]);
      }
    }
    
    // Jeśli nadal nie ma, spróbuj z formatki_szczegoly
    if (!pozycjaId && paleta.formatki_szczegoly && paleta.formatki_szczegoly.length > 0) {
      pozycjaId = paleta.formatki_szczegoly[0].pozycja_id;
    }
    
    // Ostatnia szansa - użyj selectedPozycjaId
    if (!pozycjaId) {
      pozycjaId = selectedPozycjaId;
    }

    console.log('Found pozycja_id:', pozycjaId);

    if (!pozycjaId) {
      message.warning('Nie można określić pozycji dla tej palety. Wybierz pozycję z listy przed edycją.');
      return;
    }

    setSelectedPozycjaId(pozycjaId);
    setEditingPaleta(paleta);
    setEditModalVisible(true);
  };

  const handleDeletePaleta = (paletaId: number) => {
    deletePaleta(paletaId, () => {
      if (selectedPozycjaId) {
        fetchPozycjaFormatki(selectedPozycjaId);
      }
      onRefresh?.();
    });
  };

  const handleDeleteAllPalety = () => {
    deleteAllPalety(() => {
      if (selectedPozycjaId) {
        fetchPozycjaFormatki(selectedPozycjaId);
      }
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

  // Helper do formatowania wagi
  const formatWaga = (waga: any) => {
    const wagaNum = Number(waga);
    if (Number.isFinite(wagaNum)) {
      return wagaNum.toFixed(2);
    }
    return '0.00';
  };

  // ========== RENDER - tylko składanie podkomponentów ==========
  return (
    <div style={{ width: '100%' }}>
      {/* HEADER z selektorem pozycji - podkomponent PozycjaSelector */}
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
        {/* PODKOMPONENT: PozycjaSelector */}
        <PozycjaSelector
          zkoId={zkoId}
          selectedPozycjaId={selectedPozycjaId}
          onSelect={setSelectedPozycjaId}
          loading={loading}
        />
      </Card>

      {/* PODKOMPONENT: PaletyTable - tabela istniejących palet */}
      {palety.length > 0 && (
        <Card
          title={
            <Space>
              <Text strong>Istniejące palety ({palety.length})</Text>
              {podsumowanie && (
                <Text type="secondary">
                  {podsumowanie.sztuk_total || 0} szt. | {formatWaga(podsumowanie.waga_total)} kg
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

      {/* ZAKŁADKI z podkomponentami */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* PODKOMPONENT: ManualCreationTab */}
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

          {/* PODKOMPONENT: AutomaticPlanningTab */}
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

          {/* PODKOMPONENT: DestinationTab */}
          <TabPane
            tab={<span><ToolOutlined /> Przeznaczenie palet</span>}
            key="destination"
          >
            <DestinationTab palety={palety} />
          </TabPane>
        </Tabs>
      </Card>

      {/* PODKOMPONENTY: Modale */}
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