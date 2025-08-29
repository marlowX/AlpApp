import { Router } from 'express';

// Import pod-routerów
import planRoutes from './plan.routes';
import manageRoutes from './manage.routes';
import rulesRoutes from './rules.routes';
import testRoutes from './test.routes';

/**
 * Główny router modułu Pallets
 * Agreguje wszystkie pod-moduły
 * 
 * ZASADA: Każdy plik max 300 linii!
 */
const router = Router();

// Test route - musi być pierwszy!
router.use('/', testRoutes);

// Montowanie pod-routerów
router.use('/', planRoutes);    // Planowanie palet
router.use('/', manageRoutes);  // Zarządzanie (close, reorganize, delete)
router.use('/', rulesRoutes);   // Reguły planowania

// zko.routes został przeniesiony do /routes/zko/pallets.routes.ts

export default router;