import { Router } from 'express';

// Import pod-routerów
import planRoutes from './plan.routes';
import manageRoutes from './manage.routes';
import rulesRoutes from './rules.routes';
import testRoutes from './test.routes';
import v5Routes from './v5.routes';
import detailsRoutes from './details.routes'; // NOWY - szczegóły z ilościami
import modularRoutes from './modular.routes'; // NOWY - poprawne planowanie modulariczne

/**
 * Główny router modułu Pallets
 * Agreguje wszystkie pod-moduły
 * 
 * ZASADA: Każdy plik max 300 linii!
 * 
 * WERSJE:
 * - v4 (plan.routes.ts) - Stara wersja (deprecated)
 * - v5 (v5.routes.ts) - Nowa, ulepszona wersja (MA BŁĄD Z ILOŚCIAMI!)
 * - modular (modular.routes.ts) - POPRAWNA wersja z obsługą ilości
 * - details (details.routes.ts) - Szczegóły z ilościami
 */
const router = Router();

// Test route - musi być pierwszy!
router.use('/', testRoutes);

// NOWE ENDPOINTY - modular ma pierwszeństwo przed v5
router.use('/', modularRoutes); // POPRAWNE planowanie z ilościami
router.use('/', v5Routes);      // V5 (ma błąd z ilościami)
router.use('/', detailsRoutes); // Szczegóły z tabeli palety_formatki_ilosc

// Stare endpointy (kompatybilność wsteczna)
router.use('/', planRoutes);    // Planowanie palet (v4)
router.use('/', manageRoutes);  // Zarządzanie (close, reorganize, delete)
router.use('/', rulesRoutes);   // Reguły planowania

export default router;