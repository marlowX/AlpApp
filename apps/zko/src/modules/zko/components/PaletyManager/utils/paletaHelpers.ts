import { LIMITY_PALETY, STATUS_COLORS } from '../types';
import type { Paleta, PaletaStatus } from '../types';

/**
 * Sprawdza czy wysokość palety przekracza limit
 */
export const isPaletaHeightExceeded = (wysokosc: number): boolean => {
  return wysokosc > LIMITY_PALETY.MAX_WYSOKOSC_MM;
};

/**
 * Sprawdza czy wysokość palety jest blisko limitu (>80%)
 */
export const isPaletaHeightNearLimit = (wysokosc: number): boolean => {
  return wysokosc > LIMITY_PALETY.MAX_WYSOKOSC_MM * 0.8;
};

/**
 * Zwraca kolor dla wysokości palety
 */
export const getHeightColor = (wysokosc: number): string => {
  if (isPaletaHeightExceeded(wysokosc)) return '#ff4d4f'; // Czerwony - za wysoka
  if (isPaletaHeightNearLimit(wysokosc)) return '#faad14'; // Żółty - blisko limitu
  return '#52c41a'; // Zielony - OK
};

/**
 * Zwraca kolor dla statusu palety
 */
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status?.toLowerCase() as PaletaStatus;
  return STATUS_COLORS[normalizedStatus] || 'default';
};

/**
 * Oblicza procent wykorzystania palety (wysokość)
 */
export const calculatePaletaUtilization = (wysokosc: number): number => {
  return Math.round((wysokosc / LIMITY_PALETY.MAX_WYSOKOSC_MM) * 100);
};

/**
 * Oblicza procent wykorzystania palety (ilość formatek)
 */
export const calculatePaletaCapacityUtilization = (ilosc: number): number => {
  return Math.round((ilosc / LIMITY_PALETY.OPTYMALNE_FORMATEK_MAX) * 100);
};

/**
 * Sprawdza czy paleta jest optymalna
 */
export const isPaletaOptimal = (paleta: Paleta): boolean => {
  const heightUtilization = calculatePaletaUtilization(paleta.wysokosc_stosu);
  const capacityUtilization = calculatePaletaCapacityUtilization(paleta.ilosc_formatek);
  
  return heightUtilization >= 85 && 
         heightUtilization <= 100 &&
         capacityUtilization >= 60 &&
         capacityUtilization <= 100;
};

/**
 * Oblicza wagę palety na podstawie ilości formatek i grubości płyty
 * Zakłada średnią gęstość płyty 650 kg/m³
 */
export const calculatePaletaWeight = (
  ilosc_formatek: number,
  grubosc_mm: number = LIMITY_PALETY.GRUBOSC_PLYTY_DEFAULT,
  srednia_powierzchnia_m2: number = 0.5
): number => {
  const gestosc_kg_m3 = 650; // średnia gęstość płyty wiórowej/MDF
  const objetosc_m3 = ilosc_formatek * srednia_powierzchnia_m2 * (grubosc_mm / 1000);
  return Math.round(objetosc_m3 * gestosc_kg_m3);
};

/**
 * Sprawdza czy waga palety przekracza limit
 */
export const isPaletaWeightExceeded = (waga_kg: number): boolean => {
  return waga_kg > LIMITY_PALETY.MAX_WAGA_KG;
};

/**
 * Formatuje numer palety
 */
export const formatPaletaNumber = (paleta: Paleta): string => {
  return paleta.numer_palety || `PAL-${paleta.id}`;
};

/**
 * Parsuje kolory z string do tablicy
 */
export const parseKolory = (kolory: string): string[] => {
  if (!kolory) return [];
  return kolory.split(',').map(k => k.trim()).filter(Boolean);
};

/**
 * Grupuje palety według statusu
 */
export const groupPaletyByStatus = (palety: Paleta[]): Record<PaletaStatus, Paleta[]> => {
  const grouped: Partial<Record<PaletaStatus, Paleta[]>> = {};
  
  palety.forEach(paleta => {
    const status = (paleta.status || 'otwarta') as PaletaStatus;
    if (!grouped[status]) {
      grouped[status] = [];
    }
    grouped[status]!.push(paleta);
  });
  
  return grouped as Record<PaletaStatus, Paleta[]>;
};

/**
 * Sortuje palety według priorytetu (najpierw otwarte, potem według wysokości)
 */
export const sortPaletyByPriority = (palety: Paleta[]): Paleta[] => {
  return [...palety].sort((a, b) => {
    // Najpierw otwarte
    if (a.status === 'otwarta' && b.status !== 'otwarta') return -1;
    if (a.status !== 'otwarta' && b.status === 'otwarta') return 1;
    
    // Potem według wykorzystania wysokości
    const aUtilization = calculatePaletaUtilization(a.wysokosc_stosu);
    const bUtilization = calculatePaletaUtilization(b.wysokosc_stosu);
    
    return aUtilization - bUtilization;
  });
};

/**
 * Znajduje optymalną paletę do dodania formatek
 */
export const findOptimalPaleta = (
  palety: Paleta[],
  formatki_count: number,
  grubosc_mm: number = LIMITY_PALETY.GRUBOSC_PLYTY_DEFAULT
): Paleta | null => {
  const otwartePalety = palety.filter(p => p.status === 'otwarta');
  if (otwartePalety.length === 0) return null;
  
  const dodatkowaWysokosc = formatki_count * grubosc_mm;
  
  // Znajdź paletę która pomieści formatki bez przekroczenia limitu
  const pasujacePalety = otwartePalety.filter(p => {
    const nowaWysokosc = p.wysokosc_stosu + dodatkowaWysokosc;
    return nowaWysokosc <= LIMITY_PALETY.MAX_WYSOKOSC_MM;
  });
  
  if (pasujacePalety.length === 0) return null;
  
  // Wybierz paletę z najwyższym wykorzystaniem po dodaniu
  return pasujacePalety.reduce((best, current) => {
    const bestUtilization = calculatePaletaUtilization(best.wysokosc_stosu + dodatkowaWysokosc);
    const currentUtilization = calculatePaletaUtilization(current.wysokosc_stosu + dodatkowaWysokosc);
    
    return currentUtilization > bestUtilization ? current : best;
  });
};

/**
 * Generuje podsumowanie statystyk palet
 */
export const generatePaletySummary = (palety: Paleta[]) => {
  const total = palety.length;
  const otwarte = palety.filter(p => p.status === 'otwarta').length;
  const zamkniete = palety.filter(p => p.status === 'zamknieta').length;
  const totalFormatek = palety.reduce((sum, p) => sum + (p.ilosc_formatek || 0), 0);
  const avgWysokosc = total > 0 
    ? Math.round(palety.reduce((sum, p) => sum + (p.wysokosc_stosu || 0), 0) / total)
    : 0;
  const maxWysokosc = Math.max(...palety.map(p => p.wysokosc_stosu || 0), 0);
  const przekroczone = palety.filter(p => isPaletaHeightExceeded(p.wysokosc_stosu)).length;
  const optymalne = palety.filter(p => isPaletaOptimal(p)).length;
  
  return {
    total,
    otwarte,
    zamkniete,
    totalFormatek,
    avgWysokosc,
    maxWysokosc,
    przekroczone,
    optymalne,
    procentOptymalne: total > 0 ? Math.round((optymalne / total) * 100) : 0
  };
};

/**
 * Eksportuje dane palet do CSV
 */
export const exportPaletyToCSV = (palety: Paleta[]): string => {
  const headers = [
    'ID',
    'Numer',
    'Status',
    'Kierunek',
    'Typ',
    'Ilość formatek',
    'Wysokość stosu (mm)',
    'Kolory',
    'Procent wykorzystania (%)',
    'Data utworzenia'
  ].join(',');
  
  const rows = palety.map(p => [
    p.id,
    formatPaletaNumber(p),
    p.status || 'otwarta',
    p.kierunek || 'wewnętrzny',
    p.typ || 'EURO',
    p.ilosc_formatek || 0,
    p.wysokosc_stosu || 0,
    `"${p.kolory_na_palecie || ''}"`,
    calculatePaletaUtilization(p.wysokosc_stosu),
    p.created_at || ''
  ].join(','));
  
  return [headers, ...rows].join('\n');
};