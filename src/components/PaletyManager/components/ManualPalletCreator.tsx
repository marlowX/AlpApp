import React, { useState, useEffect } from 'react';
import { Card, Button, Select, message, Space, Tag, Empty, Spin, Alert } from 'antd';
import { PlusOutlined, SaveOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { PaletaItem } from './PaletaItem';
import { AddFormatkaModal } from './AddFormatkaModal';
import { Formatka, Paleta } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ManualPalletCreatorProps {
  pozycjaId: number;
  onRefresh?: () => void;
}

export const ManualPalletCreator: React.FC<ManualPalletCreatorProps> = ({ 
  pozycjaId, 
  onRefresh 
}) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [dostepneFormatki, setDostepneFormatki] = useState<Formatka[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPaletaId, setSelectedPaletaId] = useState<string>();

  // Pobierz dostępne formatki
  useEffect(() => {
    if (pozycjaId) {
      fetchDostepneFormatki();
    }
  }, [pozycjaId]);

  const fetchDostepneFormatki = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/pallets/position/${pozycjaId}/available-formatki`);
      const data = await response.json();
      
      if (data.sukces) {
        setDostepneFormatki(data.formatki);
      } else {
        message.error('Błąd pobierania formatek');
      }
    } catch (error) {
      console.error('Error fetching formatki:', error);
      message.error('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Dodaj nową paletę
  const dodajPalete = (przeznaczenie: string = 'MAGAZYN') => {
    const nowaPaleta: Paleta = {
      id: uuidv4(),
      pozycja_id: pozycjaId,
      formatki: [],
      przeznaczenie,
      max_waga: 700,
      max_wysokosc: 1440,
      operator: 'user'
    };
    setPalety([...palety, nowaPaleta]);
    message.success(`Dodano nową paletę (${przeznaczenie})`);
  };

  // Usuń paletę
  const usunPalete = (paletaId: string) => {
    setPalety(palety.filter(p => p.id !== paletaId));
    message.info('Usunięto paletę');
  };

  // Dodaj formatkę do palety
  const dodajFormatke = (paletaId: string, formatkaId: number, ilosc: number) => {
    setPalety(palety.map(p => {
      if (p.id === paletaId) {
        const existing = p.formatki.find(f => f.formatka_id === formatkaId);
        if (existing) {
          return {
            ...p,
            formatki: p.formatki.map(f =>
              f.formatka_id === formatkaId
                ? { ...f, ilosc: f.ilosc + ilosc }
                : f
            )
          };
        } else {
          return {
            ...p,
            formatki: [...p.formatki, { formatka_id: formatkaId, ilosc }]
          };
        }
      }
      return p;
    }));
    message.success(`Dodano ${ilosc} szt. do palety`);
  };

  // Usuń formatkę z palety
  const usunFormatke = (paletaId: string, formatkaId: number) => {
    setPalety(palety.map(p => 
      p.id === paletaId 
        ? { ...p, formatki: p.formatki.filter(f => f.formatka_id !== formatkaId) }
        : p
    ));
  };

  // Aktualizuj ilość formatki
  const aktualizujIlosc = (paletaId: string, formatkaId: number, nowaIlosc: number) => {
    if (nowaIlosc <= 0) {
      usunFormatke(paletaId, formatkaId);
      return;
    }
    
    setPalety(palety.map(p => 
      p.id === paletaId
        ? {
            ...p,
            formatki: p.formatki.map(f =>
              f.formatka_id === formatkaId
                ? { ...f, ilosc: nowaIlosc }
                : f
            )
          }
        : p
    ));
  };

  // Dodaj wszystkie dostępne formatki danego typu
  const dodajWszystkieFormatki = (paletaId: string, formatkaId: number) => {
    const formatka = dostepneFormatki.find(f => f.id === formatkaId);
    if (formatka && formatka.ilosc_dostepna > 0) {
      const paleta = palety.find(p => p.id === paletaId);
      const existing = paleta?.formatki.find(f => f.formatka_id === formatkaId);
      const obecnaIlosc = existing?.ilosc || 0;
      
      aktualizujIlosc(paletaId, formatkaId, formatka.ilosc_dostepna);
      message.success(`Ustawiono maksymalną ilość: ${formatka.ilosc_dostepna} szt.`);
    }
  };

  // Zapisz wszystkie palety do bazy
  const zapiszWszystkie = async () => {
    const niepustePalety = palety.filter(p => p.formatki.length > 0);
    
    if (niepustePalety.length === 0) {
      message.warning('Brak palet z formatkami do zapisania');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:5001/api/pallets/manual/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: pozycjaId,
          palety: niepustePalety.map(p => ({
            formatki: p.formatki,
            przeznaczenie: p.przeznaczenie,
            max_waga: p.max_waga,
            max_wysokosc: p.max_wysokosc,
            operator: p.operator,
            uwagi: p.uwagi
          }))
        })
      });

      const data = await response.json();
      
      if (data.sukces) {
        message.success(`Zapisano ${data.palety_utworzone.length} palet`);
        setPalety([]);
        fetchDostepneFormatki();
        if (onRefresh) onRefresh();
      } else {
        message.error(data.error || 'Błąd zapisywania');
      }
    } catch (error) {
      console.error('Error saving pallets:', error);
      message.error('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  // Utwórz paletę ze wszystkimi pozostałymi formatkami
  const utworzPaleteZeWszystkimi = async (przeznaczenie: string = 'MAGAZYN') => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:5001/api/pallets/manual/create-all-remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pozycja_id: pozycjaId,
          przeznaczenie,
          operator: 'user'
        })
      });

      const data = await response.json();
      
      if (data.sukces) {
        message.success(`Utworzono paletę ${data.numer_palety} z ${data.total_sztuk} formatkami`);
        fetchDostepneFormatki();
        if (onRefresh) onRefresh();
      } else {
        message.error(data.error || 'Brak dostępnych formatek');
      }
    } catch (error) {
      console.error('Error creating all-remaining pallet:', error);
      message.error('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  // Oblicz podsumowanie
  const obliczPodsumowanie = () => {
    const totalFormatek = palety.reduce((sum, p) => 
      sum + p.formatki.reduce((s, f) => s + f.ilosc, 0), 0
    );
    const totalWaga = palety.reduce((sum, p) => {
      return sum + p.formatki.reduce((s, f) => {
        const formatka = dostepneFormatki.find(df => df.id === f.formatka_id);
        if (!formatka) return s;
        const waga = (formatka.dlugosc * formatka.szerokosc * 18 * 0.8) / 1000000000;
        return s + (waga * f.ilosc);
      }, 0);
    }, 0);
    
    return { totalFormatek, totalWaga };
  };

  const { totalFormatek, totalWaga } = obliczPodsumowanie();

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <p className="mt-4">Ładowanie formatek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nagłówek z akcjami */}
      <Card className="shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Ręczne tworzenie palet</h3>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchDostepneFormatki}
              loading={loading}
            >
              Odśwież
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => utworzPaleteZeWszystkimi('MAGAZYN')}
              loading={saving}
            >
              📦 Utwórz paletę ze wszystkimi
            </Button>
          </Space>
        </div>

        {/* Podsumowanie */}
        {palety.length > 0 && (
          <Alert
            className="mt-4"
            message="Podsumowanie"
            description={
              <div>
                <p>Liczba palet: <strong>{palety.length}</strong></p>
                <p>Łączna liczba formatek: <strong>{totalFormatek} szt.</strong></p>
                <p>Łączna waga: <strong>{totalWaga.toFixed(2)} kg</strong></p>
              </div>
            }
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Lista palet */}
      {palety.map((paleta, index) => (
        <PaletaItem
          key={paleta.id}
          paleta={paleta}
          index={index}
          dostepneFormatki={dostepneFormatki}
          onAddFormatka={(paletaId) => {
            setSelectedPaletaId(paletaId);
            setModalVisible(true);
          }}
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
      <Card className="shadow-sm">
        <Space wrap>
          <Button
            icon={<PlusOutlined />}
            onClick={() => dodajPalete('MAGAZYN')}
          >
            Nowa paleta - MAGAZYN
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => dodajPalete('OKLEINIARKA')}
          >
            Nowa paleta - OKLEINIARKA
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => dodajPalete('WIERCENIE')}
          >
            Nowa paleta - WIERCENIE
          </Button>
          {palety.length > 0 && (
            <>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={zapiszWszystkie}
                loading={saving}
              >
                Zapisz wszystkie ({palety.filter(p => p.formatki.length > 0).length})
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setPalety([]);
                  message.info('Usunięto wszystkie palety');
                }}
              >
                Usuń wszystkie
              </Button>
            </>
          )}
        </Space>
      </Card>

      {/* Modal dodawania formatki */}
      <AddFormatkaModal
        visible={modalVisible}
        paletaId={selectedPaletaId || ''}
        dostepneFormatki={dostepneFormatki}
        onAdd={dodajFormatke}
        onCancel={() => setModalVisible(false)}
      />
    </div>
  );
};
