/**
 * @fileoverview Eksport wszystkich komponentów PaletyManager
 * @module components
 * 
 * UWAGA: Maksymalnie 300 linii kodu na plik!
 * Usunięto duplikaty komponentów.
 */

// Główne komponenty
export { PozycjaSelector } from './PozycjaSelector';
export { PaletyTable } from './PaletyTable';
export { PaletaCard } from './PaletaCard';
export { FormatkaTable } from './FormatkaTable';

// Zakładki
export { AutomaticPlanningTab } from './AutomaticPlanningTab';
export { ManualCreationTab } from './ManualCreationTab';
export { DestinationTab } from './DestinationTab';

// Kreatory i wizualizacje
export { ManualPalletCreator } from './ManualPalletCreator';
export { PaletaVisualizer } from './PaletaVisualizer';

// Statystyki (używamy PaletyStats, usuwamy duplikat PaletyStatistics)
export { PaletyStats } from './PaletyStats';

// Modale
export { PlanowanieModal } from './PlanowanieModal';
export { PlanowanieModularneModal } from './PlanowanieModularneModal';
export { EditPaletaModal } from './EditPaletaModal';