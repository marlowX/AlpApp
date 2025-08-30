import { useState } from 'react';
import { message } from 'antd';
import { Paleta, Formatka } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const usePaletyLogic = (pozycjaId: number) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [dostepneFormatki, setDostepneFormatki] = useState<Formatka[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pobierz dostępne formatki
  const fetchDostepneFormatki = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5001/api/pallets/position/${pozycjaId}/available-formatki`
      );
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
      aktualizujIlosc(paletaId, formatkaId, formatka.ilosc_dostepna);
      message.success(`Ustawiono maksymalną ilość: ${formatka.ilosc_dostepna} szt.`);
    }
  };

  // Zapisz wszystkie palety
  const zapiszWszystkie = async (onRefresh?: () => void) => {
    const niepustePalety = palety.filter(p => p.formatki.length > 0);
    
    if (niepustePalety.length === 0) {
      message.warning('Brak palet z formatkami do zapisania');
      return;
    }
    
    const payload = {
      pozycja_id: pozycjaId,
      palety: niepustePalety.map(p => {
        const paletaData: any = {
          formatki: p.formatki,
          przeznaczenie: p.przeznaczenie,
          max_waga: p.max_waga,
          max_wysokosc: p.max_wysokosc,
          operator: p.operator || 'user'
        };
        
        if (p.uwagi && p.uwagi !== null) {
          paletaData.uwagi = p.uwagi;
        }
        
        return paletaData;
      })
    };

    setSaving(true);
    try {
      const response = await fetch('http://localhost:5001/api/pallets/manual/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  // Utwórz paletę ze wszystkimi pozostałymi
  const utworzPaleteZeWszystkimi = async (przeznaczenie: string = 'MAGAZYN', onRefresh?: () => void) => {
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

  // Usuń wszystkie palety
  const usunWszystkie = () => {
    setPalety([]);
    message.info('Usunięto wszystkie palety');
  };

  return {
    palety,
    setPalety,
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
  };
};
