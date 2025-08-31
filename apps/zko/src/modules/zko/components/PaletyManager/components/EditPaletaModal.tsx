import React, { useState, useEffect } from 'react';
import { Modal, message, Spin, Alert, Button, Space, Select } from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';

const { Option } = Select;

interface EditPaletaModalProps {
  visible: boolean;
  paletaId: number | null;
  pozycjaId: number | undefined;
  onClose: () => void;
  onSave: () => void;
}

interface FormatkaOnPallet {
  formatka_id: number;
  pozycja_id?: number;
  ilosc: number;
  nazwa?: string;
  dlugosc?: number;
  szerokosc?: number;
  kolor?: string;
  nazwa_plyty?: string;
}

interface PaletaData {
  id: number;
  numer_palety: string;
  przeznaczenie: string;
  max_waga: number;
  max_wysokosc: number;
  uwagi?: string;
  formatki_szczegoly?: FormatkaOnPallet[];
}

export const EditPaletaModal: React.FC<EditPaletaModalProps> = ({
  visible,
  paletaId,
  pozycjaId,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paletaData, setPaletaData] = useState<PaletaData | null>(null);
  const [editedFormatki, setEditedFormatki] = useState<FormatkaOnPallet[]>([]);
  const [przeznaczenie, setPrzeznaczenie] = useState<string>('MAGAZYN');

  useEffect(() => {
    if (visible && paletaId) {
      fetchPaletaData();
    }
  }, [visible, paletaId]);

  const fetchPaletaData = async () => {
    if (!paletaId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/pallets/${paletaId}`);
      if (response.ok) {
        const data = await response.json();
        setPaletaData(data);
        setEditedFormatki(data.formatki_szczegoly || []);
        setPrzeznaczenie(data.przeznaczenie || 'MAGAZYN');
        console.log('Loaded pallet data:', data);
      } else {
        message.error('Błąd pobierania danych palety');
      }
    } catch (error) {
      console.error('Error fetching paleta:', error);
      message.error('Błąd pobierania danych palety');
    } finally {
      setLoading(false);
    }
  };

  // Usuń formatkę z palety
  const handleRemoveFormatka = (formatkaId: number) => {
    setEditedFormatki(prev => prev.filter(f => f.formatka_id !== formatkaId));
    message.info('Formatka usunięta z palety (zapisz zmiany aby potwierdzić)');
  };

  // Zmień ilość formatki
  const handleChangeQuantity = (formatkaId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFormatka(formatkaId);
      return;
    }
    
    setEditedFormatki(prev => prev.map(f => 
      f.formatka_id === formatkaId 
        ? { ...f, ilosc: newQuantity }
        : f
    ));
  };

  // Zapisz zmiany
  const handleSave = async () => {
    if (!paletaId || !paletaData) return;
    
    try {
      setSaving(true);
      
      // Najpierw wyczyść paletę
      const clearResponse = await fetch(`/api/pallets/${paletaId}/clear-formatki`, {
        method: 'DELETE'
      });
      
      if (!clearResponse.ok) {
        throw new Error('Błąd czyszczenia palety');
      }
      
      // Jeśli są formatki do dodania, dodaj je
      if (editedFormatki.length > 0) {
        const updateResponse = await fetch(`/api/pallets/${paletaId}/update-formatki`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formatki: editedFormatki.map(f => ({
              formatka_id: f.formatka_id,
              ilosc: f.ilosc
            })),
            przeznaczenie: przeznaczenie,
            uwagi: paletaData.uwagi
          })
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(error.error || 'Błąd aktualizacji palety');
        }
      } else {
        // Jeśli paleta jest pusta, zaktualizuj tylko przeznaczenie
        const updateResponse = await fetch(`/api/pallets/${paletaId}/update-formatki`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formatki: [],
            przeznaczenie: przeznaczenie,
            uwagi: paletaData.uwagi
          })
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(error.error || 'Błąd aktualizacji palety');
        }
      }
      
      message.success('Paleta została zaktualizowana');
      onSave();
      onClose();
      
    } catch (error: any) {
      console.error('Error updating paleta:', error);
      message.error(error.message || 'Błąd aktualizacji palety');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      title={`Edycja palety ${paletaData?.numer_palety || ''}`}
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ maxWidth: '1200px' }}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>
          Anuluj
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          disabled={loading}
        >
          Zapisz zmiany
        </Button>
      ]}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Ładowanie danych palety..." />
        </div>
      ) : paletaData ? (
        <div>
          {/* Informacje o palecie */}
          <Alert
            message={`Paleta: ${paletaData.numer_palety}`}
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span>Przeznaczenie:</span>
                  <Select
                    value={przeznaczenie}
                    onChange={setPrzeznaczenie}
                    style={{ width: 200 }}
                  >
                    <Option value="MAGAZYN">
                      <span style={{ color: '#52c41a' }}>📦 MAGAZYN</span>
                    </Option>
                    <Option value="PILA">
                      <span style={{ color: '#1890ff' }}>🪚 PIŁA</span>
                    </Option>
                    <Option value="OKLEJARKA">
                      <span style={{ color: '#fa8c16' }}>🏭 OKLEJARKA</span>
                    </Option>
                    <Option value="WIERTARKA">
                      <span style={{ color: '#722ed1' }}>🔧 WIERTARKA</span>
                    </Option>
                    <Option value="KLIENT">
                      <span style={{ color: '#eb2f96' }}>🚚 KLIENT</span>
                    </Option>
                    <Option value="TRANSPORT">
                      <span style={{ color: '#faad14' }}>🚛 TRANSPORT</span>
                    </Option>
                  </Select>
                </div>
                <span>Max waga: {paletaData.max_waga} kg</span>
                <span>Max wysokość: {paletaData.max_wysokosc} mm</span>
                {paletaData.uwagi && <span>Uwagi: {paletaData.uwagi}</span>}
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          {/* Lista formatek na palecie */}
          <h3>Formatki na palecie ({editedFormatki.length}):</h3>
          
          {editedFormatki.length === 0 ? (
            <Alert
              message="Paleta jest pusta"
              description="Wszystkie formatki zostały usunięte z palety. Możesz zmienić tylko przeznaczenie."
              type="warning"
              showIcon
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Formatka</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Kolor</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Wymiary</th>
                  <th style={{ padding: 8, textAlign: 'center' }}>Ilość</th>
                  <th style={{ padding: 8, textAlign: 'center' }}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {editedFormatki.map((formatka, idx) => (
                  <tr key={formatka.formatka_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 8 }}>
                      {formatka.nazwa || `Formatka ${formatka.formatka_id}`}
                    </td>
                    <td style={{ padding: 8 }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        backgroundColor: '#e6f7ff',
                        borderRadius: 4 
                      }}>
                        {formatka.kolor || '-'}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>
                      {formatka.dlugosc && formatka.szerokosc 
                        ? `${formatka.dlugosc} x ${formatka.szerokosc} mm`
                        : '-'
                      }
                    </td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <input
                        type="number"
                        value={formatka.ilosc}
                        onChange={(e) => handleChangeQuantity(
                          formatka.formatka_id, 
                          parseInt(e.target.value) || 0
                        )}
                        style={{ 
                          width: 80, 
                          padding: '4px 8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                          textAlign: 'center'
                        }}
                        min="0"
                      />
                      <span style={{ marginLeft: 8 }}>szt.</span>
                    </td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFormatka(formatka.formatka_id)}
                        title="Usuń formatkę z palety"
                      >
                        Usuń
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Podsumowanie */}
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <h4>Podsumowanie:</h4>
            <Space direction="vertical">
              <span>
                Liczba typów formatek: <strong>{editedFormatki.length}</strong>
              </span>
              <span>
                Łączna liczba sztuk: <strong>
                  {editedFormatki.reduce((sum, f) => sum + f.ilosc, 0)}
                </strong>
              </span>
              <span>
                Przeznaczenie: <strong style={{ color: '#1890ff' }}>{przeznaczenie}</strong>
              </span>
              <span style={{ color: '#ff4d4f' }}>
                * Zmiany zostaną zapisane dopiero po kliknięciu "Zapisz zmiany"
              </span>
            </Space>
          </div>
        </div>
      ) : (
        <Alert
          message="Błąd"
          description="Nie udało się załadować danych palety"
          type="error"
          showIcon
        />
      )}
    </Modal>
  );
};