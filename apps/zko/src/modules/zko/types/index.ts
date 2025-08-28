// Typy dla modułu ZKO
export interface ZKO {
  id: number;
  numer_zko: string;
  data_utworzenia: string;
  kooperant: string | null;
  status: ZKOStatus;
  data_wyslania: string | null;
  data_planowana: string | null;
  data_rozpoczecia: string | null;
  data_zakonczenia: string | null;
  data_przyjecia_magazyn: string | null;
  utworzyl: string | null;
  operator_pily: string | null;
  operator_oklejarki: string | null;
  operator_wiertarki: string | null;
  priorytet: number;
  komentarz: string | null;
  etap_id: number | null;
  
  // Relacje
  pozycje?: ZKOPozycja[];
  palety?: Paleta[];
  historia?: HistoriaStatus[];
}

export type ZKOStatus = 
  | 'nowe'
  | 'CIECIE_START'
  | 'OTWARCIE_PALETY'
  | 'PAKOWANIE_PALETY' 
  | 'ZAMKNIECIE_PALETY'
  | 'CIECIE_STOP'
  | 'BUFOR_PILA'
  | 'TRANSPORT_1'
  | 'BUFOR_OKLEINIARKA'
  | 'OKLEJANIE_START'
  | 'OKLEJANIE_STOP'
  | 'TRANSPORT_2'
  | 'BUFOR_WIERTARKA'
  | 'WIERCENIE_START'
  | 'WIERCENIE_STOP'
  | 'TRANSPORT_3'
  | 'BUFOR_KOMPLETOWANIE'
  | 'KOMPLETOWANIE_START'
  | 'KOMPLETOWANIE_STOP'
  | 'BUFOR_PAKOWANIE'
  | 'PAKOWANIE_START'
  | 'PAKOWANIE_STOP'
  | 'BUFOR_WYSYLKA'
  | 'WYSYLKA'
  | 'ZAKONCZONE'
  | 'ANULOWANE';

export interface ZKOPozycja {
  id: number;
  zko_id: number;
  rozkroj_id: number;
  kolor_plyty: string;
  nazwa_plyty: string;
  ilosc_plyt: number;
  kolejnosc: number;
  uwagi: string | null;
  formatki?: Formatka[];
}

export interface Formatka {
  id: number;
  pozycja_id: number;
  nazwa_formatki: string;
  dlugosc: number;
  szerokosc: number;
  ilosc_planowana: number;
  ilosc_wyprodukowana: number;
  ilosc_uszkodzona: number;
  ilosc_na_magazyn: number;
}

export interface Paleta {
  id: number;
  numer_palety: string;
  zko_id: number;
  pozycja_id: number | null;
  status: PaletaStatus;
  typ_palety: 'EURO' | 'POLPALETA' | 'INNA';
  waga_kg: number | null;
  wysokosc_cm: number | null;
  data_utworzenia: string;
  data_zamkniecia: string | null;
  operator: string | null;
  lokalizacja: string | null;
}

export type PaletaStatus = 
  | 'PUSTA'
  | 'OTWARTA'
  | 'PAKOWANIE'
  | 'PELNA'
  | 'ZAMKNIETA'
  | 'BUFOR_PILA'
  | 'TRANSPORT'
  | 'BUFOR_OKLEINIARKA'
  | 'OKLEJANIE'
  | 'BUFOR_WIERTARKA'
  | 'WIERCENIE'
  | 'BUFOR_KOMPLETOWANIE'
  | 'KOMPLETOWANIE'
  | 'GOTOWA'
  | 'WYSLANA';

export interface HistoriaStatus {
  id: number;
  zko_id: number;
  status_poprzedni: string;
  status_nowy: string;
  data_zmiany: string;
  uzytkownik: string;
  komentarz: string | null;
  operator: string | null;
  lokalizacja: string | null;
}

export interface CreateZKODto {
  kooperant: string;
  priorytet?: number;
  komentarz?: string;
}

export interface AddPozycjaDto {
  zko_id: number;
  rozkroj_id: number;
  kolory_plyty: {
    kolor: string;
    nazwa: string;
    ilosc: number;
  }[];
  kolejnosc?: number;
  uwagi?: string;
}

export interface ChangeStatusDto {
  zko_id: number;
  nowy_etap_kod: ZKOStatus;
  komentarz?: string;
  operator?: string;
  lokalizacja?: string;
}

export interface WorkflowStep {
  krok: number;
  wariant: 'GŁÓWNA' | 'WARIANT_OKLEJANIE' | 'WARIANT_WIERCENIE' | 'USZKODZENIA' | 'WIELE_PALET' | 'ANULOWANIE';
  faza: string;
  akcja: string;
  funkcja: string;
  opis: string;
  parametry: string;
  status_po: string;
}
