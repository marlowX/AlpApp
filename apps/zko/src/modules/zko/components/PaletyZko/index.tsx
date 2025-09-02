/**
 * @fileoverview Główny komponent modułu PaletyZko - Z AUTOMATYCZNYM TWORZENIEM PALET PRZEZ DRAG & DROP
 * @module PaletyZko
 */

import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Space, Typography, Button, Badge, message, Spin, Empty, Tooltip, Popconfirm } from 'antd';
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
    closing,
    podsumowanie,
    fetchPalety,
    utworzPalete,
    edytujPalete,
    usunPalete,
    usunWszystkiePalety,
    zamknijPalete,
    drukujEtykiete,
    utworzPaletyDlaPozostalych
  } = usePalety(zkoId);

  const {
    formatki,
    loading: formatkiLoading,
    fetchFormatki,
    getFormatkiDostepne,
    obliczStatystyki
  } = useFormatki(selectedPozycjaId);

  // ========== HANDLERS ==========
  const handleRefresh = useCallback(() => {
    fetchPalety();
    fetchFormatki();
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
      await fetchFormatki();
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
      await fetchFormatki();
    }
  }, [selectedPozycjaId, utworzPalete, fetchFormatki]);

  const handleDeletePaleta = useCallback(async (paletaId: number) => {
    const success = await usunPalete(paletaId);
    if (success) {
      await fetchFormatki();
    }
  }, [usunPalete, fetchFormatki]);

  const handleClosePaleta = useCallback(async (paletaId: number) => {
    const success = await zamknijPalete(paletaId);
    if (success) {
      setTimeout(() => {
        message.info('Możesz teraz wydrukować etykietę palety');
      }, 1000);
    }
  }, [zamknijPalete]);

  const handlePrintPaleta = useCallback(async (paletaId: number) => {
    await drukujEtykiete(paletaId);
  }, [drukujEtykiete]);

  const handleCreateRemaining = useCallback(async () => {
    if (!selectedPozycjaId) {
      message.warning('Wybierz najpierw pozycję ZKO');
      return;
    }

    const result = await utworzPaletyDlaPozostalych(selectedPozycjaId, 'MAGAZYN');
    if (result) {
      await fetchFormatki();
    }
  }, [selectedPozycjaId, utworzPaletyDlaPozostalych, fetchFormatki]);

  // DRAG & DROP - Automatyczne tworzenie palety gdy nie ma żadnej
  const handleDropFormatkaToEmptyArea = useCallback(async (
    formatka: any,
    ilosc: number
  ) => {
    if (!selectedPozycjaId) {
      message.warning('Wybierz najpierw pozycję ZKO');
      return;
    }

    // Automatycznie utwórz paletę z formatkami
    const data: PaletaFormData = {
      przeznaczenie: 'MAGAZYN',
      formatki: [{
        formatka_id: formatka.id,
        ilosc: ilosc
      }],
      uwagi: 'Paleta utworzona automatycznie'
    };

    const paleta = await utworzPalete(selectedPozycjaId, data);
    if (paleta) {
      message.success('Automatycznie utworzono paletę z formatkami');
      await Promise.all([
        fetchPalety(),
        fetchFormatki()
      ]);
    }
  }, [selectedPozycjaId, utworzPalete, fetchPalety, fetchFormatki]);

  // DRAG & DROP - Handler dla upuszczenia formatki na paletę
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

      if (paleta.status === 'zamknieta' || paleta.status === 'gotowa_do_transportu') {
        message.warning('Paleta jest zamknięta');
        return;
      }

      const formatkaId = formatka.id;
      
      const currentFormatki = paleta.formatki_szczegoly || [];
      const existingFormatka = currentFormatki.find((f: any) => 
        (f.formatka_id === formatkaId) || (f.id === formatkaId)
      );
      
      let updatedFormatki;
      if (existingFormatka) {
        updatedFormatki = currentFormatki.map((f: any) => {
          const fId = f.formatka_id || f.id;
          if (fId === formatkaId) {
            return { formatka_id: formatkaId, ilosc: (f.ilosc || 0) + ilosc };
          }
          return { formatka_id: fId, ilosc: f.ilosc || 0 };
        });
      } else {
        const currentFormatkiMapped = currentFormatki.map((f: any) => ({ 
          formatka_id: f.formatka_id || f.id, 
          ilosc: f.ilosc || 0 
        }));
        updatedFormatki = [
          ...currentFormatkiMapped,
          { formatka_id: formatkaId, ilosc: ilosc }
        ];
      }

      const success = await edytujPalete(targetPaletaId, { 
        formatki: updatedFormatki,
        przeznaczenie: paleta.przeznaczenie
      });
      
      if (success) {
        message.success(`Dodano ${ilosc} szt. formatki do palety`);
        await Promise.all([
          fetchPalety(),
          fetchFormatki()
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
                  <Popconfirm
                    title="Usuń wszystkie palety"
                    description="Czy na pewno chcesz usunąć wszystkie palety?"
                    onConfirm={usunWszystkiePalety}
                    okText="Tak, usuń"
                    cancelText="Anuluj"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={loading}
                    >
                      Usuń wszystkie
                    </Button>
                  </Popconfirm>
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
                          <div>• Jeśli nie ma palet, paleta utworzy się automatycznie</div>
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
                    onDropToEmptyArea={palety.length === 0 ? handleDropFormatkaToEmptyArea : undefined}
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
                      style={{ display: palety.length > 0 ? 'inline-block' : 'none' }}
                    >
                      Pusta paleta
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                      disabled={!selectedPozycjaId}
                    >
                      Utwórz paletę z formatkami
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
                      setDetailsPaletaId(paleta.id);
                    }}
                    onDelete={handleDeletePaleta}
                    onClose={handleClosePaleta}
                    onPrint={handlePrintPaleta}
                    onShowDetails={(id) => setDetailsPaletaId(id)}
                    onDropFormatka={handleDropFormatka}
                    deleting={deleting}
                    closing={closing}
                  />
                ) : (
                  <div 
                    style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px',
                      border: '2px dashed #d9d9d9',
                      borderRadius: '8px',
                      background: '#fafafa',
                      minHeight: '400px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      // Tu obsługa automatycznego tworzenia palety
                      if (selectedPozycjaId) {
                        message.info('Przeciągnij formatkę tutaj aby automatycznie utworzyć paletę');
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <AppstoreOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                    <Title level={4} style={{ color: '#999', marginBottom: 8 }}>
                      Brak palet
                    </Title>
                    <Text style={{ color: '#999', marginBottom: 24 }}>
                      {selectedPozycjaId 
                        ? 'Przeciągnij formatkę z lewej strony lub użyj przycisków poniżej'
                        : 'Wybierz najpierw pozycję ZKO'
                      }
                    </Text>
                    
                    {selectedPozycjaId && (
                      <Space direction="vertical" size="middle">
                        <Button
                          icon={<InboxOutlined />}
                          onClick={handleCreateEmptyPaleta}
                          size="large"
                        >
                          Utwórz pustą paletę
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setCreateModalVisible(true)}
                          size="large"
                        >
                          Utwórz paletę z formatkami
                        </Button>
                      </Space>
                    )}
                  </div>
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
