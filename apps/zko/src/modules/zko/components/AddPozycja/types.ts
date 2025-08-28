// Typy dla komponentów AddPozycja
export interface Plyta {
  id: number;
  nazwa: string;
  opis: string;
  kolor_nazwa: string;
  grubosc: number;
  stan_magazynowy: number;
  aktywna: boolean;
  struktura?: number;
  cena_za_plyte?: number;
  cena_za_m2?: number;
  dlugosc?: number;
  szerokosc?: number;
}

export interface Rozkroj {
  id: number;
  kod_rozkroju: string;
  opis: string;
  rozmiar_plyty: string;
  typ_plyty?: string;
  formatki: Formatka[];
}

export interface Formatka {
  nazwa_formatki: string;
  dlugosc: number;
  szerokosc: number;
  ilosc_sztuk: number;
  typ_plyty: string;
  pozycja?: number;
}

export interface KolorPlyty {
  kolor: string;
  nazwa: string;
  ilosc: number;
  plyta_id?: number;
  stan_magazynowy?: number;
  grubosc?: number;
}

export interface AddPozycjaModalProps {
  visible: boolean;
  zkoId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export interface PlytyQueryParams {
  search?: string;
  limit?: number;
  grubosc?: number;
}

export interface AddPozycjaFormData {
  rozkroj_id: number;
  kolejnosc?: number;
  uwagi?: string;
}
