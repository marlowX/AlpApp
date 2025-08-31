/**
 * @fileoverview Główny komponent zarządzania paletami
 * @module PaletyManager
 * 
 * ⚠️ WAŻNE: Maksymalnie 300 linii kodu na plik!
 * Jeśli plik przekracza ten limit, należy go rozbić na podkomponenty.
 * Podkomponenty umieszczamy w katalogu ./components/
 * 
 * Ten plik jest menedżerem stanu i koordynatorem podkomponentów.
 * Logika renderowania została przeniesiona do podkomponentów.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, message, Alert, Empty, Space, Typography, Button } from 'antd';
import { PaletaDetails } from './PaletaDetails';
import { 
  PlanowanieModal, 
  PlanowanieModularneModal,
  PozycjaSelector,
  PaletyHeader,
  ExistingPalettes,
  PaletyTabs
} from './components';
import { LIMITY_PALETY, MESSAGES } from './types';
import { usePaletyModular } from '../../hooks';

const { Text } = Typography;

// Interfejsy typów
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
  pozycja_id?: number;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_szczegoly?: FormatkaDetail[];
  waga_kg?: number;
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

export const PaletyManager: React.FC<PaletyManagerProps> = ({ zkoId, onRefresh }) => {
  // Stan komponentu
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [pozycjaFormatki, setPozycjaFormatki] = useState<PozycjaFormatka[]>([]);
  const [selectedPozycjaId, setSelectedPozycjaId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingPaletaId, setDeletingPaletaId] = useState<number | null>(null);
  const [selectedPaleta, setSelectedPaleta] = useState<Paleta | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [planowanieModalVisible, setPlanowanieModalVisible] = useState(false);
  const [planowanieModularneModalVisible, setPlanowanieModularneModalVisible] = useState(false);
  const [podsumowanie, setPodsumowanie] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('manual');

  const { 
    loading: modularLoading,
    error: modularError,
    planujModularnie,
    inteligentneZnalowanie
  } = usePaletyModular();

  // Efekty
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

  // Funkcje pomocnicze
  const handleFullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPalety(),
        selectedPozycjaId ? fetchPozycjaFormatki() : Promise.resolve()
      ]);
      onRefresh?.();
      message.success('Dane zostały odświeżone');
    } catch (error) {
      message.error('Błąd podczas odświeżania danych');
    } finally {
      setRefreshing(false);
    }
  }, [selectedPozycjaId, onRefresh]);

  const fetchPalety = async () => {
    try {
      setLoading(true);
      let response = await fetch(`/api/pallets/zko/${zkoId}/details`);
      if (!response.ok) response = await fetch(`/api/pallets/zko/${zkoId}`);
      
      if (response.ok) {
        const data = await response.json();
        const mappedPalety = (data.palety || []).map((p: any) => ({
          ...p,
          formatki_szczegoly: p.formatki_szczegoly || [],
          sztuk_total: p.sztuk_total || p.ilosc_formatek || 
            (p.formatki_szczegoly?.reduce((sum: number, f: any) => sum + (f.ilosc || 0), 0)) || 0,
          procent_wykorzystania: p.sztuk_total 
            ? Math.round((p.sztuk_total / LIMITY_PALETY.DOMYSLNE_FORMATEK) * 100)
            : p.procent_wykorzystania || 0,
          kolory_na_palecie: p.kolory_na_palecie || ''
        }));
        setPalety(mappedPalety);
        setPodsumowanie(data.podsumowanie);
      } else {
        const error = await response.json();
        message.error(error.error || MESSAGES.PLAN_ERROR);
      }
    } catch (error) {
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
            nazwa: f.nazwa || f.nazwa_formatki || `${f.dlugosc}x${f.szerokosc}`,
            dlugosc: Number(f.dlugosc),
            szerokosc: Number(f.szerokosc),
            grubosc: Number(f.grubosc || 18),
            kolor: f.kolor || 'nieznany',
            ilosc_planowana: f.ilosc_planowana,
            waga_sztuka: Number(f.waga_sztuka || 0.7),
            ilosc_w_paletach: f.ilosc_w_paletach || 0,
            ilosc_dostepna: f.ilosc_dostepna || 0,
            czy_w_pelni_przypisana: f.czy_w_pelni_przypisana || (f.ilosc_dostepna === 0)
          }));
          setPozycjaFormatki(mappedFormatki);
        } else {
          message.error(data.error || 'Błąd pobierania formatek');
        }
      } else {
        message.error('Błąd komunikacji z serwerem');
      }
    } catch (error) {
      message.error('Błąd pobierania formatek z pozycji');
    }
  };

  // Handlery akcji
  const handleViewDetails = (paleta: Paleta) => {
    setSelectedPaleta(paleta);
    setDetailsModalVisible(true);
  };

  const handleDeletePaleta = async (paletaId: number) => {
    try {
      setDeletingPaletaId(paletaId);
      const response = await fetch(`/api/pallets/${paletaId}`, { method: 'DELETE' });
      if (response.ok) {
        message.success('Paleta została usunięta');
        await handleFullRefresh();
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd usuwania palety');
      }
    } catch (error) {
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setDeletingPaletaId(null);
    }
  };

  const handleDeleteAllPalety = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pallets/zko/${zkoId}/clear`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.sukces) {
        message.success(`Usunięto ${data.usuniete} palet`);
        await handleFullRefresh();
      } else {
        message.error(data.error || 'Błąd usuwania palet');
      }
    } catch (error) {
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
    const totalAvailable = pozycjaFormatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0);
    if (totalAvailable === 0) {
      message.warning('Brak dostępnych formatek do utworzenia palety');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/pallets/manual/create-all-remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pozycja_id: selectedPozycjaId, przeznaczenie, operator: 'user' })
      });
      const data = await response.json();
      if (response.ok && data.sukces) {
        message.success(`Utworzono paletę ${data.numer_palety} (${data.total_sztuk} szt.)`);
        await handleFullRefresh();
      } else {
        message.error(data.error || 'Błąd tworzenia palety');
      }
    } catch (error) {
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualPallets = async (manualPalety: any[]) => {
    if (!selectedPozycjaId) {
      message.error('Brak ID pozycji');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/pallets/manual/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: selectedPozycjaId,
          palety: manualPalety.map(p => ({
            formatki: p.formatki,
            przeznaczenie: p.przeznaczenie,
            max_waga: p.max_waga,
            max_wysokosc: p.max_wysokosc,
            operator: 'user',
            uwagi: p.uwagi || null
          }))
        })
      });
      const data = await response.json();
      if (response.ok && data.sukces) {
        message.success(`Zapisano ${data.palety_utworzone.length} palet`);
        await handleFullRefresh();
      } else {
        message.error(data.error || 'Błąd zapisywania');
      }
    } catch (error) {
      message.error('Błąd komunikacji');
    } finally {
      setLoading(false);
    }
  };

  // Obliczenia
  const totalAvailableFormatki = pozycjaFormatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0);
  const isAllAssigned = totalAvailableFormatki === 0 && pozycjaFormatki.length > 0;

  // Nagłówek karty
  const headerProps = PaletyHeader({
    paletyCount: palety.length,
    loading,
    modularLoading,
    refreshing,
    onRefresh: handleFullRefresh,
    onDeleteAll: handleDeleteAllPalety
  });

  return (
    <Card title={headerProps.title} extra={headerProps.extra}>
      <PozycjaSelector
        zkoId={zkoId}
        selectedPozycjaId={selectedPozycjaId}
        onSelect={setSelectedPozycjaId}
        loading={loading}
      />

      {isAllAssigned && selectedPozycjaId && (
        <Alert
          message="✅ Wszystkie formatki z tej pozycji zostały przypisane do palet"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <ExistingPalettes
        palety={palety}
        loading={loading}
        podsumowanie={podsumowanie}
        deletingId={deletingPaletaId}
        onViewDetails={handleViewDetails}
        onDelete={handleDeletePaleta}
      />

      <PaletyTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedPozycjaId={selectedPozycjaId}
        pozycjaFormatki={pozycjaFormatki}
        palety={palety}
        loading={loading}
        modularLoading={modularLoading}
        modularError={modularError}
        podsumowanie={podsumowanie}
        totalAvailableFormatki={totalAvailableFormatki}
        onSaveManualPallets={handleSaveManualPallets}
        onCreateAllRemaining={handleCreateAllRemainingPallet}
        onRefresh={handleFullRefresh}
        onViewDetails={handleViewDetails}
        onShowPlanningModal={() => setPlanowanieModalVisible(true)}
        onShowModularModal={() => setPlanowanieModularneModalVisible(true)}
        onQuickPlanning={async () => {
          const result = await inteligentneZnalowanie(zkoId, {
            max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
            max_formatek_na_palete: 80,
            operator: 'user'
          });
          if (result) {
            message.success('Planowanie zakończone');
            await handleFullRefresh();
          }
        }}
        renderFormatkiColumn={(p: Paleta) => null}
      />

      {/* Modale */}
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
        onOk={async () => {
          setPlanowanieModalVisible(false);
          message.info('Planowanie V5 - funkcja do implementacji');
        }}
      />

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
        onOk={async (params) => {
          const result = await planujModularnie(zkoId, params);
          if (result) {
            message.success('Planowanie modularyczne zakończone');
            setPlanowanieModularneModalVisible(false);
            await handleFullRefresh();
          }
        }}
      />
    </Card>
  );
};