export const PALLET_DESTINATIONS = {
  MAGAZYN: { label: 'Magazyn', icon: '📦', color: 'blue' },
  OKLEINIARKA: { label: 'Okleiniarka', icon: '🎨', color: 'orange' },
  WIERCENIE: { label: 'Wiercenie', icon: '🔧', color: 'purple' },
  CIECIE: { label: 'Cięcie', icon: '✂️', color: 'red' },
  WYSYLKA: { label: 'Wysyłka', icon: '🚚', color: 'green' }
};

export interface Formatka {
  id: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  grubosc: number;
  kolor: string;
  ilosc_planowana: number;
  waga_sztuka: number;
  ilosc_dostepna?: number;
}

export interface PaletaFormatka {
  formatka_id: number;
  ilosc: number;
}

export interface Paleta {
  id: string;
  numer?: string;
  formatki: PaletaFormatka[];
  przeznaczenie: string;
  uwagi?: string;
  max_waga: number;
  max_wysokosc: number;
  pozycja_id?: number;
  operator?: string;
}

export interface PaletaStats {
  waga: number;
  sztuk: number;
  wysokosc: number;
  kolory: string[];
  wykorzystanieWagi: number;
  wykorzystanieWysokosci: number;
}
