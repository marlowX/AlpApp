/**
 * @fileoverview Główny komponent modułu PaletyZko - bez auto-odświeżania
 * @module PaletyZko
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, Row, Col, Space, Typography, Button, Badge, message, Spin, Empty, Tooltip, Popconfirm } from 'antd';
import {
  AppstoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DragOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Style
import './styles.css';
import { colors, dimensions, componentStyles } from './styles/theme';

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
  const [refreshCounter, setRefreshCounter] = useState(0);

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

  // Odświeżanie danych po zmianie pozycji
  useEffect(() => {
    if (selectedPozycjaId) {
      fetchPalety();
      fetchFormatki();
    }
  }, [selectedPozycjaId, refreshCounter]);

  // ========== HANDLERS ==========
  const handleRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
    fetchPalety();
    fetchFormatki();
    if (onRefresh) onRefresh();
    message.success('Odświeżono dane', 1);
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
      setRefreshCounter(prev => prev + 1);
    }
  }, [selectedPozycjaId, utworzPalete]);

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
      setRefreshCounter(prev => prev + 1);
    }
  }, [selectedPozycjaId, utworzPalete]);

  const handleDeletePaleta = useCallback(async (paletaId: number) => {
    const success = await usunPalete(paletaId);
    if (success) {
      setRefreshCounter(prev => prev + 1);
    }
  }, [usunPalete]);

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
      setRefreshCounter(prev => prev + 1);
    }
  }, [selectedPozycjaId, utworzPaletyDlaPozostalych]);

  const handleDropFormatkaToEmptyArea = useCallback(async (
    formatka: any,
    ilosc: number
  ) => {
    if (!selectedPozycjaId) {
      message.warning('Wybierz najpierw pozycję ZKO');
      return;
    }

    const wymiary = formatka.nazwa_formatki 
      ? formatka.nazwa_formatki.split(' - ')[0] 
      : `${formatka.dlugosc}×${formatka.szerokosc}`;
    
    const kolor = formatka.kolor || 'NIEZNANY';

    const data: PaletaFormData = {
      przeznaczenie: 'MAGAZYN',
      formatki: [{
        formatka_id: formatka.id,
        ilosc: ilosc
      }],
      uwagi: `Automatycznie utworzona paleta z formatkami ${wymiary} - ${kolor}`
    };

    const paleta = await utworzPalete(selectedPozycjaId, data);
    if (paleta) {
      message.success(`Utworzono paletę z wszystkimi ${ilosc} sztukami formatki ${wymiary} - ${kolor}`);
      setRefreshCounter(prev => prev + 1);
    }
  }, [selectedPozycjaId, utworzPalete]);

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
        const wymiary = formatka.nazwa_formatki 
          ? formatka.nazwa_formatki.split(' - ')[0] 
          : `${formatka.dlugosc}×${formatka.szerokosc}`;
        const kolor = formatka.kolor || 'NIEZNANY';
        
        message.success(`Dodano wszystkie ${ilosc} szt. formatki ${wymiary} - ${kolor} do palety`);
        setRefreshCounter(prev => prev + 1);
      }
    } catch (error) {
      console.error('Błąd podczas dodawania formatki:', error);
      message.error('Błąd podczas dodawania formatki do palety');
    }
  }, [palety, edytujPalete]);

  const formatkiDostepne = getFormatkiDostepne();
  const statystykiFormatek = obliczStatystyki();
  const loading = paletyLoading || formatkiLoading;

  // ========== RENDER ==========
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="palety-zko">
        {/* Kompaktowy nagłówek */}
        <Card 
          className="palety-header"
          size="small"
          style={{ 
            marginBottom: dimensions.spacingMd,
            borderRadius: dimensions.cardBorderRadius,
            overflow: 'hidden'
          }}
          bodyStyle={{ 
            padding: dimensions.spacingMd 
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={dimensions.spacingSm}>
            {/* Górna linia - tytuł i przyciski */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Space size={dimensions.spacingSm}>
                <DragOutlined style={{ 
                  fontSize: dimensions.iconSizeLarge, 
                  color: colors.primary 
                }} />
                <Title level={5} style={{ 
                  margin: 0, 
                  fontSize: dimensions.fontSizeLarge,
                  fontWeight: dimensions.fontWeightBold
                }}>
                  Zarządzanie Paletami
                </Title>
                {palety.length > 0 && (
                  <Badge 
                    count={palety.length} 
                    style={{ 
                      backgroundColor: colors.success,
                      fontSize: 10,
                      height: 16,
                      lineHeight: '16px',
                      minWidth: 16
                    }} 
                  />
                )}
              </Space>
              <Space size={dimensions.spacingXs}>
                <Tooltip title="Odśwież dane">
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleRefresh}
                    loading={loading}
                    size="small"
                    style={componentStyles.button.small}
                  />
                </Tooltip>
                {palety.length > 0 && (
                  <Popconfirm
                    title="Usuń wszystkie palety"
                    description="Czy na pewno chcesz usunąć wszystkie palety?"
                    onConfirm={usunWszystkiePalety}
                    okText="Tak"
                    cancelText="Nie"
                    okButtonProps={{ danger: true, size: 'small' }}
                    cancelButtonProps={{ size: 'small' }}
                  >
                    <Tooltip title="Usuń wszystkie palety">
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={loading}
                        size="small"
                        style={componentStyles.button.small}
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
                <Tooltip title="Ustawienia">
                  <Button
                    icon={<SettingOutlined />}
                    size="small"
                    style={componentStyles.button.small}
                    disabled
                  />
                </Tooltip>
              </Space>
            </div>

            {/* Selektor pozycji z refresh triggerem */}
            <PozycjaSelector
              zkoId={zkoId}
              selectedPozycjaId={selectedPozycjaId}
              onSelect={handleSelectPozycja}
              loading={loading}
              refreshTrigger={refreshCounter}
            />

            {/* Statystyki - kompaktowe */}
            {selectedPozycjaId && (
              <div style={{ 
                background: colors.bgSecondary,
                padding: dimensions.spacingSm,
                borderRadius: dimensions.buttonBorderRadius,
                marginTop: dimensions.spacingXs
              }}>
                <PaletyStats
                  podsumowanie={podsumowanie}
                  statystykiFormatek={statystykiFormatek}
                />
              </div>
            )}
          </Space>
        </Card>

        {/* GŁÓWNY WIDOK - FORMATKI I PALETY */}
        <div style={{ minHeight: '500px' }}>
          <Row gutter={dimensions.spacingSm}>
            {/* LEWA KOLUMNA - FORMATKI */}
            <Col xs={24} lg={8}>
              <Card 
                size="small"
                className="formatki-container"
                title={
                  <Space size={dimensions.spacingXs}>
                    <DragOutlined style={{ fontSize: dimensions.iconSizeBase }} />
                    <span style={{ fontSize: dimensions.fontSizeBase }}>
                      Formatki ({formatkiDostepne.length})
                    </span>
                    <Tooltip 
                      title="Przeciągnij formatki na palety - przenosi wszystkie sztuki"
                      placement="right"
                    >
                      <InfoCircleOutlined style={{ 
                        fontSize: dimensions.iconSizeSmall, 
                        color: colors.info, 
                        cursor: 'help' 
                      }} />
                    </Tooltip>
                  </Space>
                }
                extra={
                  formatkiDostepne.length > 0 && (
                    <Button
                      size="small"
                      onClick={handleCreateRemaining}
                      disabled={!selectedPozycjaId}
                      style={componentStyles.button.small}
                    >
                      Wszystkie na palety
                    </Button>
                  )
                }
                headStyle={{ 
                  minHeight: dimensions.headerHeightSmall,
                  padding: `0 ${dimensions.spacingSm}px`
                }}
                bodyStyle={{ 
                  height: '450px',
                  overflowY: 'auto',
                  padding: dimensions.spacingSm,
                  overflowX: 'hidden'
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
                    image={<InboxOutlined style={componentStyles.empty.icon} />}
                    description={
                      <Text style={{ fontSize: dimensions.fontSizeSmall }}>
                        {selectedPozycjaId 
                          ? "Wszystkie formatki na paletach"
                          : "Wybierz pozycję ZKO"
                        }
                      </Text>
                    }
                  />
                )}
              </Card>
            </Col>

            {/* PRAWA KOLUMNA - PALETY */}
            <Col xs={24} lg={16}>
              <Card 
                size="small"
                className="palety-container"
                title={
                  <Space size={dimensions.spacingXs}>
                    <AppstoreOutlined style={{ fontSize: dimensions.iconSizeBase }} />
                    <span style={{ fontSize: dimensions.fontSizeBase }}>
                      Palety ({palety.length})
                    </span>
                  </Space>
                }
                extra={
                  <Space size={dimensions.spacingXs}>
                    {palety.length > 0 && (
                      <Tooltip title="Utwórz pustą paletę">
                        <Button
                          icon={<InboxOutlined />}
                          onClick={handleCreateEmptyPaleta}
                          disabled={!selectedPozycjaId}
                          size="small"
                          style={componentStyles.button.small}
                        />
                      </Tooltip>
                    )}
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                      disabled={!selectedPozycjaId}
                      size="small"
                      style={{
                        ...componentStyles.button.small,
                        fontWeight: dimensions.fontWeightBold
                      }}
                    >
                      Nowa paleta
                    </Button>
                  </Space>
                }
                headStyle={{ 
                  minHeight: dimensions.headerHeightSmall,
                  padding: `0 ${dimensions.spacingSm}px`
                }}
                bodyStyle={{ 
                  height: '450px',
                  overflowY: 'auto',
                  padding: dimensions.spacingSm,
                  overflowX: 'hidden'
                }}
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                  </div>
                ) : (
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
                    onDropToEmptyArea={handleDropFormatkaToEmptyArea}
                    deleting={deleting}
                    closing={closing}
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