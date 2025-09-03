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
  popularnosc?: number;  // Dodane pole popularności (1-5)
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
  dlugosc?: number;
  szerokosc?: number;
}

export interface AddPozycjaModalProps {
  visible: boolean;
  zkoId: number;
  onCancel: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  pozycjaToEdit?: any;
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

// Nowy interfejs dla analizy wymiarów
export interface WymiaryGrupa {
  dlugosc: number;
  szerokosc: number;
  plyty: Array<{
    plyta: Plyta;
    ilosc: number;
  }>;
  grubosci: Set<number>;
}

export interface WymiaryAnaliza {
  grupy: Map<string, WymiaryGrupa>;
  wszystkieTeSame: boolean;
  rozkrojPasuje: boolean;
  rozmiarRozkroju: {
    dlugosc: number;
    szerokosc: number;
  } | null;
}
