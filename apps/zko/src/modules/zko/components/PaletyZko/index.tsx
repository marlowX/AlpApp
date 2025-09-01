/**
 * @fileoverview Główny komponent modułu PaletyZko - Z AUTOMATYCZNYM ODŚWIEŻANIEM FORMATEK
 * @module PaletyZko
 */

import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Space, Typography, Button, Badge, message, Spin, Empty, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DragOutlined,
  InfoCircleOutlined,
  InboxOutlined
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

interface PaletyZkoProps {
  zkoId: number;
  onRefresh?: () => void;
}

export const PaletyZko: React.FC<PaletyZkoProps> = ({ zkoId, onRefresh }) => {
  // ========== STATE ==========
  const [selectedPozycjaId, setSelectedPozycjaId] = useState<number>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsPaletaId, setDetailsPaletaId] = useState<number>();

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
    zamknijPalete,
    utworzPaletyDlaPozostalych
  } = usePalety(zkoId);

  const {
    formatki,
    loading: formatkiLoading,
    fetchFormatki, // Dodajemy fetchFormatki do odświeżania
    getFormatkiDostepne,
    obliczStatystyki
  } = useFormatki(selectedPozycjaId);

  // ========== HANDLERS ==========
  const handleRefresh = useCallback(() => {
    fetchPalety();
    fetchFormatki(); // Odśwież też formatki
    if (onRefresh) onRefresh();
  }, [fetchPalety, fetchFormatki, onRefresh]);

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
      await fetchFormatki(); // Odśwież listę formatek po utworzeniu palety
    }
  }, [selectedPozycjaId, utworzPalete, fetchFormatki]);

  // Tworzenie pustej palety
  const handleCreateEmptyPaleta = useCallback(async () => {
    if (!selectedPozycjaId) {
      message.warning('Wybierz najpierw pozycję ZKO');
      return;
    }

    const data: PaletaFormData = {
      przeznaczenie: 'MAGAZYN',
      formatki: [],
      uwagi: 'Pusta paleta'
    };

    const paleta = await utworzPalete(selectedPozycjaId, data);
    if (paleta) {
      message.success('Utworzono pustą paletę');
    }
  }, [selectedPozycjaId, utworzPalete]);

  const handleDeletePaleta = useCallback(async (paletaId: number) => {
    const success = await usunPalete(paletaId);
    if (success) {
      await fetchFormatki(); // Odśwież listę formatek po usunięciu palety
    }
  }, [usunPalete, fetchFormatki]);

  const handleClosePaleta = useCallback(async (paletaId: number) => {
    await zamknijPalete(paletaId);
  }, [zamknijPalete]);

  const handleCreateRemaining = useCallback(async () => {
    if (!selectedPozycjaId) {
      message.warning('Wybierz najpierw pozycję ZKO');
      return;
    }

    const result = await utworzPaletyDlaPozostalych(selectedPozycjaId, 'MAGAZYN');
    if (result) {
      await fetchFormatki(); // Odśwież listę formatek po utworzeniu palet
    }
  }, [selectedPozycjaId, utworzPaletyDlaPozostalych, fetchFormatki]);

  // DRAG & DROP - Handler dla upuszczenia formatki na paletę - Z ODŚWIEŻANIEM
  const handleDropFormatka = useCallback(async (
    formatka: any,
    ilosc: number,
    targetPaletaId: number
  ) => {
    try {
      const paleta = palety.find(p => p.id === targetPaletaId);
      if (!paleta) {
        message.error('Nie znaleziono palety');
        return;
      }

      if (paleta.status === 'zamknieta') {
        message.warning('Paleta jest zamknięta');
        return;
      }

      // WAŻNE: Użyj właściwego ID formatki
      const formatkaId = formatka.id;
      
      console.log('Dropping formatka:', { 
        formatkaId, 
        ilosc, 
        targetPaletaId,
        formatka 
      });

      // Przygotuj formatki do aktualizacji
      const currentFormatki = paleta.formatki_szczegoly || [];
      const existingFormatka = currentFormatki.find((f: any) => 
        (f.formatka_id === formatkaId) || (f.id === formatkaId)
      );
      
      let updatedFormatki;
      if (existingFormatka) {
        // Zwiększ ilość istniejącej formatki
        updatedFormatki = currentFormatki.map((f: any) => {
          const fId = f.formatka_id || f.id;
          if (fId === formatkaId) {
            return { formatka_id: formatkaId, ilosc: (f.ilosc || 0) + ilosc };
          }
          return { formatka_id: fId, ilosc: f.ilosc || 0 };
        });
      } else {
        // Dodaj nową formatkę
        const currentFormatkiMapped = currentFormatki.map((f: any) => ({ 
          formatka_id: f.formatka_id || f.id, 
          ilosc: f.ilosc || 0 
        }));
        updatedFormatki = [
          ...currentFormatkiMapped,
          { formatka_id: formatkaId, ilosc: ilosc }
        ];
      }

      console.log('Sending to backend:', { 
        paletaId: targetPaletaId,
        formatki: updatedFormatki 
      });

      const success = await edytujPalete(targetPaletaId, { 
        formatki: updatedFormatki,
        przeznaczenie: paleta.przeznaczenie
      });
      
      if (success) {
        message.success(`Dodano ${ilosc} szt. formatki do palety`);
        // Odśwież obie listy po przeciągnięciu
        await Promise.all([
          fetchPalety(),
          fetchFormatki() // 🔥 WAŻNE: Odśwież listę formatek po dodaniu do palety
        ]);
      }
    } catch (error) {
      console.error('Błąd podczas dodawania formatki:', error);
      message.error('Błąd podczas dodawania formatki do palety');
    }
  }, [palety, edytujPalete, fetchPalety, fetchFormatki]);

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
          styles={{ body: { padding: '16px' } }}
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

        {/* GŁÓWNY WIDOK - FORMATKI PO LEWEJ, PALETY PO PRAWEJ */}
        <div style={{ minHeight: '600px' }}>
          <Row gutter={16}>
            {/* LEWA KOLUMNA - FORMATKI DO PRZECIĄGANIA */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <DragOutlined />
                    <span>Dostępne formatki ({formatkiDostepne.length})</span>
                    <Tooltip 
                      title={
                        <div style={{ fontSize: '12px' }}>
                          <div>• Przeciągnij formatki na palety</div>
                          <div>• Pokazane są tylko formatki nie przypisane w całości</div>
                          <div>• Liczba w nawiasie to dostępne sztuki</div>
                        </div>
                      }
                    >
                      <InfoCircleOutlined style={{ fontSize: '14px', color: '#1890ff', cursor: 'help' }} />
                    </Tooltip>
                  </Space>
                }
                extra={
                  formatkiDostepne.length > 0 && (
                    <Button
                      size="small"
                      onClick={handleCreateRemaining}
                      disabled={!selectedPozycjaId}
                    >
                      Palety dla wszystkich
                    </Button>
                  )
                }
                styles={{ 
                  body: { 
                    height: '600px',
                    overflowY: 'auto',
                    padding: '12px'
                  }
                }}
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                  </div>
                ) : formatkiDostepne.length > 0 ? (
                  <FormatkaSelectorDND
                    formatki={formatkiDostepne}
                    loading={formatkiLoading}
                    onSelectFormatka={() => {}}
                  />
                ) : (
                  <Empty 
                    description={
                      selectedPozycjaId 
                        ? "Wszystkie formatki zostały przypisane do palet"
                        : "Wybierz pozycję ZKO aby zobaczyć formatki"
                    }
                  />
                )}
              </Card>
            </Col>

            {/* PRAWA KOLUMNA - PALETY (DROP ZONES) */}
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <AppstoreOutlined />
                    <span>Palety ({palety.length})</span>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      icon={<InboxOutlined />}
                      onClick={handleCreateEmptyPaleta}
                      disabled={!selectedPozycjaId}
                    >
                      Pusta paleta
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                      disabled={!selectedPozycjaId}
                    >
                      Nowa paleta z formatkami
                    </Button>
                  </Space>
                }
                styles={{ 
                  body: { 
                    height: '600px',
                    overflowY: 'auto',
                    padding: '12px'
                  }
                }}
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                  </div>
                ) : palety.length > 0 ? (
                  <PaletyGridDND
                    palety={palety}
                    onEdit={(paleta) => {
                      // Pokaż modal edycji
                      setDetailsPaletaId(paleta.id);
                    }}
                    onDelete={handleDeletePaleta}
                    onClose={handleClosePaleta}
                    onShowDetails={(id) => setDetailsPaletaId(id)}
                    onDropFormatka={handleDropFormatka}
                    deleting={deleting}
                  />
                ) : (
                  <Empty 
                    image={<AppstoreOutlined style={{ fontSize: 48 }} />}
                    description={
                      <div>
                        <p>Brak palet</p>
                        {selectedPozycjaId && (
                          <Space style={{ marginTop: 16 }}>
                            <Button
                              icon={<InboxOutlined />}
                              onClick={handleCreateEmptyPaleta}
                            >
                              Utwórz pustą paletę
                            </Button>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => setCreateModalVisible(true)}
                            >
                              Utwórz paletę z formatkami
                            </Button>
                          </Space>
                        )}
                      </div>
                    }
                  />
                )}
              </Card>
            </Col>
          </Row>
        </div>

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