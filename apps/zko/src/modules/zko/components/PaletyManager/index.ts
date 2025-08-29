// Eksport głównego komponentu
export { PaletyManager } from './PaletyManager';

// Eksport komponentów szczegółowych
export { PaletaDetails } from './PaletaDetails';
export { PaletaPrzeniesFormatki } from './PaletaPrzeniesFormatki';

// Eksport podkomponentów
export { PaletyStats } from './components/PaletyStats';
export { PaletyTable } from './components/PaletyTable';
export { PlanowanieModal } from './components/PlanowanieModal';

// Eksport typów
export type {
  Paleta,
  PaletaStatus,
  TypPalety,
  StrategiaPlanowania,
  PlanowaniePaletParams,
  Formatka,
  TransferFormatekParams,
  PaletaHistoria,
  PlanPaletyzacji,
  TransportInfo,
  BuforOkleiniarka
} from './types';

export {
  LIMITY_PALETY,
  STATUS_COLORS,
  MESSAGES
} from './types';

// Eksport hooków
export { usePaletyData } from './hooks/usePaletyData';

// Eksport funkcji pomocniczych
export {
  isPaletaHeightExceeded,
  isPaletaHeightNearLimit,
  getHeightColor,
  getStatusColor,
  calculatePaletaUtilization,
  calculatePaletaCapacityUtilization,
  isPaletaOptimal,
  calculatePaletaWeight,
  isPaletaWeightExceeded,
  formatPaletaNumber,
  parseKolory,
  groupPaletyByStatus,
  sortPaletyByPriority,
  findOptimalPaleta,
  generatePaletySummary,
  exportPaletyToCSV
} from './utils/paletaHelpers';