import React, { useState, useEffect } from 'react';
import { Empty, Spin } from 'antd';
import { PaletaItem } from './PaletaItem';
import { AddFormatkaModal } from './AddFormatkaModal';
import { PaletaHeader } from './PaletaHeader';
import { PaletaSummary } from './PaletaSummary';
import { PaletaActions } from './PaletaActions';
import { usePaletyLogic } from '../hooks/usePaletyLogic';

interface ManualPalletCreatorProps {
  pozycjaId: number;
  onRefresh?: () => void;
}

export const ManualPalletCreator: React.FC<ManualPalletCreatorProps> = ({ 
  pozycjaId, 
  onRefresh 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPaletaId, setSelectedPaletaId] = useState<string>();
  
  const {
    palety,
    dostepneFormatki,
    loading,
    saving,
    fetchDostepneFormatki,
    dodajPalete,
    usunPalete,
    dodajFormatke,
    usunFormatke,
    aktualizujIlosc,
    dodajWszystkieFormatki,
    zapiszWszystkie,
    utworzPaleteZeWszystkimi,
    usunWszystkie
  } = usePaletyLogic(pozycjaId);

  // Pobierz formatki przy pierwszym renderze
  useEffect(() => {
    if (pozycjaId) {
      fetchDostepneFormatki();
    }
  }, [pozycjaId]);

  // Obsługa modalu
  const handleOpenModal = (paletaId: string) => {
    setSelectedPaletaId(paletaId);
    setModalVisible(true);
  };

  const handleAddFormatka = (paletaId: string, formatkaId: number, ilosc: number) => {
    dodajFormatke(paletaId, formatkaId, ilosc);
    setModalVisible(false);
  };

  // Loading state
  if (loading && palety.length === 0) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <p className="mt-4">Ładowanie formatek...</p>
      </div>
    );
  }

  const niepustePalety = palety.filter(p => p.formatki.length > 0);

  return (
    <div className="space-y-4">
      {/* Nagłówek z akcjami */}
      <PaletaHeader
        pozycjaId={pozycjaId}
        loading={loading}
        saving={saving}
        onRefresh={fetchDostepneFormatki}
        onCreateAllRemaining={() => utworzPaleteZeWszystkimi('MAGAZYN', onRefresh)}
      />

      {/* Podsumowanie */}
      <PaletaSummary
        palety={palety}
        dostepneFormatki={dostepneFormatki}
        pozycjaId={pozycjaId}
      />

      {/* Lista palet */}
      {palety.map((paleta, index) => (
        <PaletaItem
          key={paleta.id}
          paleta={paleta}
          index={index}
          dostepneFormatki={dostepneFormatki}
          onAddFormatka={handleOpenModal}
          onRemoveFormatka={usunFormatke}
          onUpdateIlosc={aktualizujIlosc}
          onDeletePaleta={usunPalete}
          onDodajWszystkie={dodajWszystkieFormatki}
        />
      ))}

      {/* Pusta lista */}
      {palety.length === 0 && (
        <Empty
          description="Brak palet. Kliknij przycisk poniżej aby dodać nową paletę."
          className="py-8"
        />
      )}

      {/* Przyciski akcji */}
      <PaletaActions
        paletCount={palety.length}
        niepustePaletCount={niepustePalety.length}
        saving={saving}
        onAddPaleta={dodajPalete}
        onSaveAll={() => zapiszWszystkie(onRefresh)}
        onDeleteAll={usunWszystkie}
      />

      {/* Modal dodawania formatki */}
      <AddFormatkaModal
        visible={modalVisible}
        paletaId={selectedPaletaId || ''}
        dostepneFormatki={dostepneFormatki}
        onAdd={handleAddFormatka}
        onCancel={() => setModalVisible(false)}
      />
    </div>
  );
};
