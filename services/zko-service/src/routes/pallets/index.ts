import { Router } from 'express';

// Import pod-routerów
import planRoutes from './plan.routes';
import manageRoutes from './manage.routes';
import zkoRoutes from './zko.routes';
import rulesRoutes from './rules.routes';

/**
 * Główny router modułu Pallets
 * Agreguje wszystkie pod-moduły
 * 
 * ZASADA: Każdy plik max 300 linii!
 */
const router = Router();

// Montowanie pod-routerów
router.use('/', planRoutes);    // Planowanie palet
router.use('/', manageRoutes);  // Zarządzanie (close, reorganize, delete)
router.use('/', zkoRoutes);     // Operacje dla ZKO
router.use('/', rulesRoutes);   // Reguły planowania

export default router;