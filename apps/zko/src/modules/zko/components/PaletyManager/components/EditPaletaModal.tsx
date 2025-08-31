import React, { useState, useEffect } from 'react';
import { Modal, message, Spin } from 'antd';
import { ManualPalletCreator } from './ManualPalletCreator';

interface EditPaletaModalProps {
  visible: boolean;
  paletaId: number | null;
  pozycjaId: number | undefined;
  onClose: () => void;
  onSave: () => void;
}

export const EditPaletaModal: React.FC<EditPaletaModalProps> = ({
  visible,
  paletaId,
  pozycjaId,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [paletaData, setPaletaData] = useState<any>(null);
  const [pozycjaFormatki, setPozycjaFormatki] = useState<any[]>([]);

  useEffect(() => {
    if (visible && paletaId && pozycjaId) {
      fetchPaletaData();
      fetchPozycjaFormatki();
    }
  }, [visible, paletaId, pozycjaId]);

  const fetchPaletaData = async () => {
    if (!paletaId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/pallets/${paletaId}`);
      if (response.ok) {
        const data = await response.json();
        setPaletaData(data);
      }
    } catch (error) {
      console.error('Error fetching paleta:', error);
      message.error('Błąd pobierania danych palety');
    } finally {
      setLoading(false);
    }
  };

  const fetchPozycjaFormatki = async () => {
    if (!pozycjaId) return;
    
    try {
      const response = await fetch(`/api/pallets/position/${pozycjaId}/available-formatki`);
      if (response.ok) {
        const data = await response.json();
        if (data.sukces) {
          setPozycjaFormatki(data.formatki || []);
        }
      }
    } catch (error) {
      console.error('Error fetching formatki:', error);
    }
  };

  const handleSavePaleta = async (updatedPaleta: any) => {
    if (!paletaId) return;
    
    try {
      setLoading(true);
      
      // Najpierw usuń starą zawartość palety
      await fetch(`/api/pallets/${paletaId}/clear-formatki`, {
        method: 'DELETE'
      });
      
      // Następnie dodaj nową zawartość
      const response = await fetch(`/api/pallets/${paletaId}/update-formatki`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formatki: updatedPaleta.formatki,
          przeznaczenie: updatedPaleta.przeznaczenie,
          uwagi: updatedPaleta.uwagi
        })
      });

      if (response.ok) {
        message.success('Paleta została zaktualizowana');
        onSave();
        onClose();
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd aktualizacji palety');
      }
    } catch (error) {
      console.error('Error updating paleta:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Edycja palety ${paletaData?.numer_palety || ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: '1400px' }}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Ładowanie danych palety..." />
        </div>
      ) : paletaData ? (
        <ManualPalletCreator
          pozycjaFormatki={pozycjaFormatki}
          onSave={(palety) => {
            // ManualPalletCreator zwraca tablicę palet, bierzemy pierwszą
            if (palety.length > 0) {
              handleSavePaleta(palety[0]);
            }
          }}
          onCancel={onClose}
          initialPaleta={{
            formatki: paletaData.formatki_szczegoly || [],
            przeznaczenie: paletaData.przeznaczenie || 'MAGAZYN',
            max_waga: paletaData.max_waga || 700,
            max_wysokosc: paletaData.max_wysokosc || 1440,
            uwagi: paletaData.uwagi || ''
          }}
          editMode={true}
        />
      ) : null}
    </Modal>
  );
};