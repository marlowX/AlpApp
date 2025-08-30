import { Router } from 'express';

// Import pod-routerów
import planRoutes from './plan.routes';
import manageRoutes from './manage.routes';
import rulesRoutes from './rules.routes';
import testRoutes from './test.routes';
import v5Routes from './v5.routes';
import detailsRoutes from './details.routes'; // NOWY - szczegóły z ilościami

/**
 * Główny router modułu Pallets
 * Agreguje wszystkie pod-moduły
 * 
 * ZASADA: Każdy plik max 300 linii!
 * 
 * WERSJE:
 * - v4 (plan.routes.ts) - Stara wersja (deprecated)
 * - v5 (v5.routes.ts) - Nowa, ulepszona wersja
 * - details (details.routes.ts) - Szczegóły z ilościami
 */
const router = Router();

// Test route - musi być pierwszy!
router.use('/', testRoutes);

// NOWE ENDPOINTY V5 i szczegóły
router.use('/', v5Routes);
router.use('/', detailsRoutes);

// Stare endpointy (kompatybilność wsteczna)
router.use('/', planRoutes);    // Planowanie palet (v4)
router.use('/', manageRoutes);  // Zarządzanie (close, reorganize, delete)
router.use('/', rulesRoutes);   // Reguły planowania

export default router;