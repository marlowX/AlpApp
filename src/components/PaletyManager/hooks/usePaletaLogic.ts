import { useState, useMemo } from 'react';
import { message } from 'antd';
import { Paleta, Formatka, PaletaStats } from '../types';

export const usePaletaLogic = (formatki: Formatka[]) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [selectedPaleta, setSelectedPaleta] = useState<string | null>(null);

  // Oblicz pozostałe ilości formatek
  const pozostaleIlosci = useMemo(() => {
    const result: Record<number, number> = {};
    
    formatki.forEach(f => {
      let przypisane = 0;
      palety.forEach(p => {
        const formatkaWPalecie = p.formatki.find(pf => pf.formatka_id === f.id);
        if (formatkaWPalecie) {
          przypisane += formatkaWPalecie.ilosc;
        }
      });
      const dostepne = f.ilosc_dostepna !== undefined ? f.ilosc_dostepna : f.ilosc_planowana;
      result[f.id] = Math.max(0, dostepne - przypisane);
    });
    
    return result;
  }, [formatki, palety]);

  // Oblicz statystyki palety
  const obliczStatystykiPalety = (paleta: Paleta): PaletaStats => {
    let totalWaga = 0;
    let totalSztuk = 0;
    let totalWysokosc = 0;
    const kolory = new Set<string>();
    
    paleta.formatki.forEach(pf => {
      const formatka = formatki.find(f => f.id === pf.formatka_id);
      if (formatka) {
        totalSztuk += pf.ilosc;
        totalWaga += pf.ilosc * formatka.waga_sztuka;
        const poziomy = Math.ceil(pf.ilosc / 4);
        totalWysokosc = Math.max(totalWysokosc, poziomy * formatka.grubosc);
        kolory.add(formatka.kolor);
      }
    });
    
    return {
      waga: totalWaga,
      sztuk: totalSztuk,
      wysokosc: totalWysokosc,
      kolory: Array.from(kolory),
      wykorzystanieWagi: (totalWaga / paleta.max_waga) * 100,
      wykorzystanieWysokosci: (totalWysokosc / paleta.max_wysokosc) * 100
    };
  };

  // Utwórz nową paletę
  const utworzPalete = () => {
    const newPaleta: Paleta = {
      id: `PAL-${Date.now()}`,
      numer: `PAL-${String(palety.length + 1).padStart(3, '0')}`,
      formatki: [],
      przeznaczenie: 'MAGAZYN',
      max_waga: 700,
      max_wysokosc: 1440
    };
    setPalety([...palety, newPaleta]);
    setSelectedPaleta(newPaleta.id);
    message.success('Utworzono nową paletę');
  };

  // Dodaj formatki do palety
  const dodajFormatkiDoPalety = (paletaId: string, formatkaId: number, ilosc: number) => {
    setPalety(prev => prev.map(p => {
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

  // Usuń formatki z palety
  const usunFormatkiZPalety = (paletaId: string, formatkaId: number) => {
    setPalety(prev => prev.map(p => {
      if (p.id === paletaId) {
        return {
          ...p,
          formatki: p.formatki.filter(f => f.formatka_id !== formatkaId)
        };
      }
      return p;
    }));
    message.success('Usunięto formatki z palety');
  };

  // Zmień przeznaczenie palety
  const zmienPrzeznaczenie = (paletaId: string, przeznaczenie: string) => {
    setPalety(prev => prev.map(p => 
      p.id === paletaId ? { ...p, przeznaczenie } : p
    ));
  };

  // Kopiuj paletę
  const kopiujPalete = (paletaId: string) => {
    const paleta = palety.find(p => p.id === paletaId);
    if (paleta) {
      const newPaleta: Paleta = {
        ...paleta,
        id: `PAL-${Date.now()}`,
        numer: `PAL-${String(palety.length + 1).padStart(3, '0')}`,
      };
      setPalety([...palety, newPaleta]);
      message.success('Skopiowano paletę');
    }
  };

  // Usuń paletę
  const usunPalete = (paletaId: string) => {
    setPalety(prev => prev.filter(p => p.id !== paletaId));
    if (selectedPaleta === paletaId) {
      setSelectedPaleta(null);
    }
    message.success('Usunięto paletę');
  };

  // Wyczyść wszystkie palety
  const wyczyscPalety = () => {
    setPalety([]);
    setSelectedPaleta(null);
  };

  return {
    palety,
    selectedPaleta,
    pozostaleIlosci,
    setSelectedPaleta,
    obliczStatystykiPalety,
    utworzPalete,
    dodajFormatkiDoPalety,
    usunFormatkiZPalety,
    zmienPrzeznaczenie,
    kopiujPalete,
    usunPalete,
    wyczyscPalety
  };
};
