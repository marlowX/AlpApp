/**
 * @fileoverview Główny komponent modułu PaletyZko z DRAG & DROP
 * @module PaletyZko
 * 
 * ZASADY:
 * - Maksymalnie 300 linii kodu
 * - Logika w hookach
 * - UI w podkomponentach
 * - Pełna obsługa Drag & Drop
 */

import React, { useState, useCallback } from 'react';
import { Card, Tabs, Space, Typography, Button, Badge, message, Spin } from 'antd';
import {
  AppstoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DragOutlined
} from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Style
import './styles.css';

// Komponenty z Drag & Drop
import { PozycjaSelector } from './components/PozycjaSelector';
import { PaletyGridDND } from './components/PaletyGridDND';
import { PaletyStats } from './components/PaletyStats';
import { CreatePaletaModal } from './components/CreatePaletaModal';
import { FormatkaSelectorDND } from './components/FormatkaSelectorDND';
import { PaletaDetails } from './components/PaletaDetails';

// Hooks
import { usePalety, useFormatki } from './hooks';

// Typy
import { PaletaFormData, PRZEZNACZENIE_PALETY } from './types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PaletyZkoProps {
  zkoId: number;
  onRefresh?: () => void;
}

export const PaletyZko: React.FC<PaletyZkoProps> = ({ zkoId, onRefresh }) => {
  // ========== STATE ==========
  const [selectedPozycjaId, setSelectedPozycjaId] = useState<number>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsPaletaId, setDetailsPaletaId] = useState<number>();
  const [activeTab, setActiveTab] = useState('palety');

  // ========== HOOKS ==========
  const {
    palety,
    loading: paletyLoading,
    creating,
    deleting,
    podsumowanie,
    fetchPalety,
    utworzPalete,
    edytujPalete,
    usunPalete,
    usunWszystkiePalety,
    przenieFormatki,
    zamknijPalete,
    utworzPaletyDlaPozostalych
  } = usePalety(zkoId);

  const {
    formatki,
    loading: formatkiLoading,
    getFormatkiDostepne,
    obliczStatystyki
  } = useFormatki(selectedPozycjaId);

  // ========== HANDLERS ==========
  const handleRefresh = useCallback(() => {
    fetchPalety();
    if (onRefresh) onRefresh();
  }, [fetchPalety, onRefresh]);

  const handleSelectPozycja = useCallback((pozycjaId: number) => {
    setSelectedPozycjaId(pozycjaId);
  }, []);

  const handleCreatePaleta = useCallback(async (data: PaletaFormData) => {
    if (!selectedPozycjaId) {
      message.warning('Wybierz najpierw pozycję ZKO');
      return;
    }

    const paleta = await utworzPalete(selectedPozycjaId, data);
    if (paleta) {
      setCreateModalVisible(false);
      message.success('Paleta utworzona pomyślnie');
    }
  }, [selectedPozycjaId, utworzPalete]);

  const handleDeletePaleta = useCallback(async (paletaId: number) => {
    await usunPalete(paletaId);
  }, [usunPalete]);

  const handleClosePaleta = useCallback(async (paletaId: number) => {
    await zamknijPalete(paletaId);
  }, [zamknijPalete]);

  const handleCreateRemaining = useCallback(async () => {
    if (!selectedPozycjaId) {
      message.warning('Wybierz najpierw pozycję ZKO');
      return;
    }

    await utworzPaletyDlaPozostalych(selectedPozycjaId, 'MAGAZYN');
  }, [selectedPozycjaId, utworzPaletyDlaPozostalych]);

  // DRAG & DROP - Handler dla upuszczenia formatki na paletę
  const handleDropFormatka = useCallback(async (
    formatka: any,
    ilosc: number,
    targetPaletaId: number
  ) => {
    try {
      // Pobierz aktualną zawartość palety
      const paleta = palety.find(p => p.id === targetPaletaId);
      if (!paleta) {
        message.error('Nie znaleziono palety');
        return;
      }

      if (paleta.status === 'zamknieta') {
        message.warning('Paleta jest zamknięta');
        return;
      }

      // Przygotuj formatki do aktualizacji
      const currentFormatki = paleta.formatki_szczegoly || [];
      const existingFormatka = currentFormatki.find((f: any) => f.formatka_id === formatka.id);
      
      let updatedFormatki;
      if (existingFormatka) {
        // Zwiększ ilość istniejącej formatki
        updatedFormatki = currentFormatki.map((f: any) => 
          f.formatka_id === formatka.id 
            ? { formatka_id: f.formatka_id, ilosc: f.ilosc + ilosc }
            : { formatka_id: f.formatka_id, ilosc: f.ilosc }
        );
      } else {
        // Dodaj nową formatkę
        updatedFormatki = [
          ...currentFormatki.map((f: any) => ({ formatka_id: f.formatka_id, ilosc: f.ilosc })),
          { formatka_id: formatka.id, ilosc: ilosc }
        ];
      }

      const success = await edytujPalete(targetPaletaId, { formatki: updatedFormatki });
      if (success) {
        message.success(`Dodano ${ilosc} szt. formatki do palety`);
        await fetchPalety(); // Odśwież listę palet
      }
    } catch (error) {
      console.error('Błąd podczas dodawania formatki:', error);
      message.error('Błąd podczas dodawania formatki do palety');
    }
  }, [palety, edytujPalete, fetchPalety]);

  // Handler dla ręcznego wyboru formatki
  const handleSelectFormatka = useCallback(async (formatka: any, ilosc: number) => {
    message.info('Wybierz paletę docelową w zakładce "Palety"');
    setActiveTab('palety');
  }, []);

  const formatkiDostepne = getFormatkiDostepne();
  const statystykiFormatek = obliczStatystyki();
  const loading = paletyLoading || formatkiLoading;

  // ========== RENDER ==========
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="palety-zko">
        {/* Header z selektorem pozycji */}
        <Card 
          className="palety-header"
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <DragOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>Zarządzanie Paletami (Drag & Drop)</Title>
                {palety.length > 0 && (
                  <Badge count={palety.length} style={{ backgroundColor: '#52c41a' }} />
                )}
              </Space>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={loading}
                >
                  Odśwież
                </Button>
                {palety.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={usunWszystkiePalety}
                    loading={loading}
                  >
                    Usuń wszystkie
                  </Button>
                )}
              </Space>
            </div>

            <PozycjaSelector
              zkoId={zkoId}
              selectedPozycjaId={selectedPozycjaId}
              onSelect={handleSelectPozycja}
              loading={loading}
            />

            {selectedPozycjaId && (
              <PaletyStats
                podsumowanie={podsumowanie}
                statystykiFormatek={statystykiFormatek}
              />
            )}
          </Space>
        </Card>

        {/* Główna zawartość */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane 
              tab={
                <span>
                  <AppstoreOutlined /> Palety ({palety.length})
                </span>
              } 
              key="palety"
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                        disabled={!selectedPozycjaId}
                      >
                        Nowa paleta
                      </Button>
                      {formatkiDostepne.length > 0 && (
                        <Button
                          onClick={handleCreateRemaining}
                          disabled={!selectedPozycjaId}
                        >
                          Utwórz palety dla pozostałych ({statystykiFormatek.sztukiDostepne} szt.)
                        </Button>
                      )}
                    </Space>
                  </div>

                  <PaletyGridDND
                    palety={palety}
                    onEdit={(paleta) => message.info('Edycja w przygotowaniu')}
                    onDelete={handleDeletePaleta}
                    onClose={handleClosePaleta}
                    onShowDetails={(id) => setDetailsPaletaId(id)}
                    onDropFormatka={handleDropFormatka}
                    deleting={deleting}
                  />
                </>
              )}
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <DragOutlined /> Formatki ({formatkiDostepne.length})
                </span>
              } 
              key="formatki"
            >
              <FormatkaSelectorDND
                formatki={formatkiDostepne}
                loading={formatkiLoading}
                onSelectFormatka={handleSelectFormatka}
              />
            </TabPane>
          </Tabs>
        </Card>

        {/* Modale */}
        <CreatePaletaModal
          visible={createModalVisible}
          formatki={formatkiDostepne}
          onCancel={() => setCreateModalVisible(false)}
          onCreate={handleCreatePaleta}
          loading={creating}
        />

        {detailsPaletaId && (
          <PaletaDetails
            paletaId={detailsPaletaId}
            onClose={() => setDetailsPaletaId(undefined)}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default PaletyZko;
